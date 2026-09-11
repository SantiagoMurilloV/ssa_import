import { adminApiRequest, clientIp, clientUserAgent } from './_admin-api.js';
import { normalizeReference } from '../server/src/utils/reference.js';

// Guía pública de un pedido. Nunca se cachea: si el admin acaba de mover la
// etapa, el cliente que refresca tiene que verla ya.
const RELAYED = new Set([200, 404, 422, 429]);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');
  const reference = normalizeReference(req.query?.reference);
  if (!reference) {
    return res.status(422).json({ error: 'El código debe tener el formato SSA-123456' });
  }
  try {
    const { status, body } = await adminApiRequest(`/api/public/tracking/${reference}`, {
      ip: clientIp(req),
      userAgent: clientUserAgent(req)
    });
    if (RELAYED.has(status)) return res.status(status).json(body);
    return res.status(502).json({ error: 'Tracking service unavailable' });
  } catch {
    return res.status(502).json({ error: 'Tracking service unavailable' });
  }
}
