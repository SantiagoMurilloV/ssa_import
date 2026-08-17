import { adminApiRequest, clientIp, clientUserAgent } from './_admin-api.js';
import { createOrderSchema } from '../server/src/schemas/order.schema.js';

const RELAYED = new Set([201, 422, 429]);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      error: 'Validation failed',
      details: parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  try {
    const { status, body } = await adminApiRequest('/api/public/orders', {
      method: 'POST',
      body: parsed.data,
      ip: clientIp(req),
      userAgent: clientUserAgent(req)
    });
    if (RELAYED.has(status)) return res.status(status).json(body);
    return res.status(502).json({ error: 'Order service unavailable' });
  } catch {
    return res.status(502).json({ error: 'Order service unavailable' });
  }
}
