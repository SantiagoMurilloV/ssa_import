// Service worker de la tienda: SOLO recibe los avisos push de la guía de
// envíos. No cachea nada ni intercepta peticiones (no hay handler de fetch),
// así que no interfiere con Vite en desarrollo ni con el catálogo en producción.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// El admin manda {title, body, url}. url es relativa a la tienda (/envios/SSA-…).
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }
  const url = payload.url ?? '/envios';
  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'SSA Import', {
      body: payload.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url },
      // Un aviso por pedido: la etapa nueva reemplaza a la anterior en vez de apilarse
      tag: url,
      renotify: true
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url ?? '/envios', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          return client.focus().then((focused) => (focused.navigate ? focused.navigate(target) : focused));
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
