import { adminApiRequest, clientIp, clientUserAgent } from './_admin-api.js';

const ALLOWED = new Set(['page_view', 'product_view', 'add_to_cart']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const type = req.body?.type;
  if (!ALLOWED.has(type)) return res.status(422).json({ error: 'Invalid event type' });
  // Fire-and-forget: la analítica nunca debe tumbar la tienda
  adminApiRequest('/api/events', {
    method: 'POST',
    body: { type },
    ip: clientIp(req),
    userAgent: clientUserAgent(req)
  }).catch(() => {});
  res.status(202).json({ ok: true });
}
