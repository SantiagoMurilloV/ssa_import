import { adminApiRequest, clientIp, clientUserAgent } from './_admin-api.js';
import { DEFAULT_CATALOG } from '../server/src/config/default-catalog.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  // Cache de edge corto: los cambios del admin aparecen en ~10 s y la CDN protege al API
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=20');
  try {
    const { status, body } = await adminApiRequest('/api/public/catalog', {
      ip: clientIp(req),
      userAgent: clientUserAgent(req)
    });
    if (status === 200 && Array.isArray(body?.products)) {
      return res.status(200).json(body);
    }
  } catch {
    /* admin caído: usar fallback */
  }
  res.status(200).json(DEFAULT_CATALOG);
}
