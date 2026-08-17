// Helper compartido por las funciones serverless: TODAS son proxy hacia el
// API del admin (única fuente de verdad). En Vercel define ADMIN_API_URL.
const ADMIN_API_URL = (process.env.ADMIN_API_URL ?? 'http://localhost:4500').replace(/\/$/, '');
// Debe coincidir con STORE_PROXY_SECRET del admin: es lo que hace confiable la
// IP del comprador que reenviamos, y con ella su rate limit.
const STORE_PROXY_SECRET = process.env.STORE_PROXY_SECRET ?? '';

export const clientIp = (req) =>
  String(req.headers['x-forwarded-for'] ?? '')
    .split(',')[0]
    .trim();

export const clientUserAgent = (req) => String(req.headers['user-agent'] ?? '');

const proxyHeaders = (ip, userAgent) => ({
  'X-Store-Client-IP': ip ?? '',
  'X-Store-Client-UA': userAgent ?? '',
  ...(STORE_PROXY_SECRET ? { 'X-Store-Proxy-Secret': STORE_PROXY_SECRET } : {})
});

export async function adminApiRequest(path, { method = 'GET', body, ip, userAgent } = {}) {
  const headers = proxyHeaders(ip, userAgent);
  const options = { method, headers, signal: AbortSignal.timeout(8000) };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${ADMIN_API_URL}${path}`, options);
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* sin cuerpo */
  }
  return { status: response.status, body: payload };
}

// El runtime puede haber consumido ya el stream y dejado el cuerpo en req.body
// (Buffer o string, según el content-type que reconozca). Leer el stream a
// ciegas devolvería vacío en ese caso, así que probamos las dos formas.
async function readRawBody(req, maxBytes) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body, 'binary');

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > maxBytes) throw new Error('PAYLOAD_TOO_LARGE');
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

// Reenvía un multipart/form-data crudo (comprobantes, encargos) sin parsearlo.
export async function adminApiForwardMultipart(path, req, { ip, userAgent, maxBytes = 4_500_000 } = {}) {
  let raw;
  try {
    raw = await readRawBody(req, maxBytes);
  } catch (error) {
    if (error.message === 'PAYLOAD_TOO_LARGE') {
      return { status: 413, body: { error: 'La imagen es muy grande. Intenta con una foto más liviana.' } };
    }
    throw error;
  }
  if (raw.length === 0) {
    return { status: 400, body: { error: 'No recibimos el archivo. Intenta de nuevo.' } };
  }
  if (raw.length > maxBytes) {
    return { status: 413, body: { error: 'La imagen es muy grande. Intenta con una foto más liviana.' } };
  }

  const response = await fetch(`${ADMIN_API_URL}${path}`, {
    method: 'POST',
    headers: {
      ...proxyHeaders(ip, userAgent),
      'Content-Type': req.headers['content-type'] ?? 'multipart/form-data'
    },
    body: raw,
    signal: AbortSignal.timeout(15000)
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* sin cuerpo */
  }
  return { status: response.status, body: payload };
}
