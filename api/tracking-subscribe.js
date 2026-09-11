import { adminApiRequest, clientIp, clientUserAgent, readJsonBody } from './_admin-api.js';
import { normalizeReference } from '../server/src/utils/reference.js';

// Alta (POST) y baja (DELETE) de los avisos push de UNA referencia. La
// suscripción del navegador viaja tal cual al admin, que es quien manda los push.
const RELAYED = new Set([200, 201, 404, 422, 429, 503]);

const isSubscription = (value) =>
  value &&
  typeof value.endpoint === 'string' &&
  value.keys &&
  typeof value.keys.p256dh === 'string' &&
  typeof value.keys.auth === 'string';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const body = await readJsonBody(req);
  const reference = normalizeReference(body?.reference);
  if (!reference) return res.status(422).json({ error: 'Referencia inválida' });

  const proxy = { ip: clientIp(req), userAgent: clientUserAgent(req) };
  try {
    if (req.method === 'POST') {
      if (!isSubscription(body.subscription)) {
        return res.status(422).json({ error: 'Suscripción inválida' });
      }
      const { endpoint, keys } = body.subscription;
      const { status, body: payload } = await adminApiRequest(
        `/api/public/tracking/${reference}/subscribe`,
        { method: 'POST', body: { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } }, ...proxy }
      );
      if (RELAYED.has(status)) return res.status(status).json(payload);
      return res.status(502).json({ error: 'Tracking service unavailable' });
    }
    if (typeof body.endpoint !== 'string') return res.status(422).json({ error: 'Falta el endpoint' });
    const { status, body: payload } = await adminApiRequest(
      `/api/public/tracking/${reference}/subscribe`,
      { method: 'DELETE', body: { endpoint: body.endpoint }, ...proxy }
    );
    if (RELAYED.has(status)) return res.status(status).json(payload);
    return res.status(502).json({ error: 'Tracking service unavailable' });
  } catch {
    return res.status(502).json({ error: 'Tracking service unavailable' });
  }
}
