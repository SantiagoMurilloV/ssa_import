// Analítica anónima de embudo. Fire-and-forget: nunca bloquea la tienda.
const send = (type) => {
  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
    keepalive: true
  }).catch(() => {});
};

export const trackPageView = () => {
  // una sola vez por sesión de pestaña
  if (sessionStorage.getItem('ssa-pv')) return;
  sessionStorage.setItem('ssa-pv', '1');
  send('page_view');
};

export const trackProductView = () => send('product_view');
export const trackAddToCart = () => send('add_to_cart');
