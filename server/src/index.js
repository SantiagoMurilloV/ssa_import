// Proxy de desarrollo: replica localmente lo que hacen las funciones
// serverless de api/ en Vercel (mismos endpoints, mismos fallbacks).
import express from 'express';
import cors from 'cors';
import { DEFAULT_CATALOG } from './config/default-catalog.js';
import { DEFAULT_SITE_CONTENT, mergeSiteContent } from './config/default-site-content.js';
import { createOrderSchema } from './schemas/order.schema.js';

const PORT = Number(process.env.PORT ?? 4000);
const ADMIN_API_URL = (process.env.ADMIN_API_URL ?? 'http://localhost:4500').replace(/\/$/, '');
const STORE_PROXY_SECRET = process.env.STORE_PROXY_SECRET ?? '';

const app = express();
app.use(cors());

const adminHeaders = (req, extra = {}) => ({
  'X-Store-Client-IP': req.ip ?? '',
  'X-Store-Client-UA': req.get('user-agent') ?? '',
  ...(STORE_PROXY_SECRET ? { 'X-Store-Proxy-Secret': STORE_PROXY_SECRET } : {}),
  ...extra
});

const adminJson = async (path, { method = 'GET', body, req }) => {
  const options = {
    method,
    headers: adminHeaders(req),
    signal: AbortSignal.timeout(8000)
  };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
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
};

const rawMultipart = express.raw({ type: 'multipart/form-data', limit: '8mb' });

const forwardMultipart = async (path, req) => {
  const response = await fetch(`${ADMIN_API_URL}${path}`, {
    method: 'POST',
    headers: adminHeaders(req, { 'Content-Type': req.get('content-type') }),
    body: req.body,
    signal: AbortSignal.timeout(15000)
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* sin cuerpo */
  }
  return { status: response.status, body: payload };
};

app.get('/api/catalog', async (req, res) => {
  try {
    const { status, body } = await adminJson('/api/public/catalog', { req });
    if (status === 200 && Array.isArray(body?.products)) return res.json(body);
  } catch {
    /* fallback */
  }
  res.json(DEFAULT_CATALOG);
});

app.get('/api/site-content', async (req, res) => {
  try {
    const { status, body } = await adminJson('/api/public/site-content', { req });
    if (status === 200 && body?.content) return res.json(body);
  } catch {
    /* fallback */
  }
  res.json({ content: mergeSiteContent(DEFAULT_SITE_CONTENT) });
});

app.post('/api/orders', express.json(), async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      error: 'Validation failed',
      details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
    });
  }
  try {
    const { status, body } = await adminJson('/api/public/orders', {
      method: 'POST',
      body: parsed.data,
      req
    });
    if ([201, 422, 429].includes(status)) return res.status(status).json(body);
  } catch {
    /* cae al 502 */
  }
  res.status(502).json({ error: 'Order service unavailable' });
});

app.post('/api/receipt', rawMultipart, async (req, res) => {
  const reference = String(req.query.reference ?? '');
  if (!/^SSA-\d{6}$/.test(reference)) return res.status(422).json({ error: 'Referencia inválida' });
  try {
    const { status, body } = await forwardMultipart(`/api/public/orders/${reference}/receipt`, req);
    if ([200, 400, 404, 409, 413, 422, 429, 503].includes(status)) return res.status(status).json(body);
  } catch {
    /* cae al 502 */
  }
  res.status(502).json({ error: 'Receipt service unavailable' });
});

app.post('/api/encargos', rawMultipart, async (req, res) => {
  try {
    const { status, body } = await forwardMultipart('/api/public/encargos', req);
    if ([201, 400, 413, 422, 429, 503].includes(status)) return res.status(status).json(body);
  } catch {
    /* cae al 502 */
  }
  res.status(502).json({ error: 'Encargos service unavailable' });
});

app.post('/api/subscribe', express.json(), async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const website = typeof req.body?.website === 'string' ? req.body.website : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
    return res.status(422).json({ error: 'Correo inválido' });
  }
  if (website !== '') return res.status(422).json({ error: 'Solicitud inválida' });
  try {
    const { status, body } = await adminJson('/api/public/subscribe', {
      method: 'POST',
      body: { email, website: '' },
      req
    });
    if ([201, 422, 429].includes(status)) return res.status(status).json(body);
  } catch {
    /* cae al 502 */
  }
  res.status(502).json({ error: 'Subscribe service unavailable' });
});

app.post('/api/events', express.json(), (req, res) => {
  const type = req.body?.type;
  if (!['page_view', 'product_view', 'add_to_cart'].includes(type)) {
    return res.status(422).json({ error: 'Invalid event type' });
  }
  adminJson('/api/events', { method: 'POST', body: { type }, req }).catch(() => {});
  res.status(202).json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`[ssa-store] dev proxy on :${PORT} → ${ADMIN_API_URL}`);
});
