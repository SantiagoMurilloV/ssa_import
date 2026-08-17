import { adminApiForwardMultipart, clientIp, clientUserAgent } from './_admin-api.js';

// El cuerpo llega crudo y se reenvía tal cual; _admin-api.js lo lee tanto si
// el runtime ya lo dejó en req.body como si sigue siendo un stream.
export const config = { runtime: 'nodejs' };

const REFERENCE_PATTERN = /^SSA-\d{6}$/;
const RELAYED = new Set([200, 400, 404, 409, 413, 422, 429, 503]);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const reference = String(req.query?.reference ?? '');
  if (!REFERENCE_PATTERN.test(reference)) {
    return res.status(422).json({ error: 'Referencia inválida' });
  }
  try {
    const { status, body } = await adminApiForwardMultipart(
      `/api/public/orders/${reference}/receipt`,
      req,
      { ip: clientIp(req), userAgent: clientUserAgent(req) }
    );
    if (RELAYED.has(status)) return res.status(status).json(body);
    return res.status(502).json({ error: 'Receipt service unavailable' });
  } catch {
    return res.status(502).json({ error: 'Receipt service unavailable' });
  }
}
