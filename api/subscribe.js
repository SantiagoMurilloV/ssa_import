import { adminApiRequest, clientIp, clientUserAgent } from './_admin-api.js';

const RELAYED = new Set([201, 422, 429]);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const website = typeof req.body?.website === 'string' ? req.body.website : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
    return res.status(422).json({ error: 'Correo inválido' });
  }
  if (website !== '') return res.status(422).json({ error: 'Solicitud inválida' });
  try {
    const { status, body } = await adminApiRequest('/api/public/subscribe', {
      method: 'POST',
      body: { email, website: '' },
      ip: clientIp(req),
      userAgent: clientUserAgent(req)
    });
    if (RELAYED.has(status)) return res.status(status).json(body);
    return res.status(502).json({ error: 'Subscribe service unavailable' });
  } catch {
    return res.status(502).json({ error: 'Subscribe service unavailable' });
  }
}
