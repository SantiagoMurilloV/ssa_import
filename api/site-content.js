import { adminApiRequest, clientIp, clientUserAgent } from './_admin-api.js';
import {
  DEFAULT_SITE_CONTENT,
  mergeSiteContent
} from '../server/src/config/default-site-content.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=20');
  try {
    const { status, body } = await adminApiRequest('/api/public/site-content', {
      ip: clientIp(req),
      userAgent: clientUserAgent(req)
    });
    if (status === 200 && body?.content) {
      return res.status(200).json(body);
    }
  } catch {
    /* admin caído: usar fallback */
  }
  // mergeSiteContent garantiza layout e images completos, igual que el admin
  res.status(200).json({ content: mergeSiteContent(DEFAULT_SITE_CONTENT) });
}
