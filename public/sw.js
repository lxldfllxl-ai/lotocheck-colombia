self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('[SW] install');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  console.log('[SW] activate');
});

self.addEventListener('push', (event) => {
  let data = { title: 'NotiLoto', body: 'Nuevo aviso disponible.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'NotiLoto', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/logo.png',
    badge: '/logo.png',
    data: data.data || {},
    vibrate: [100, 50, 100],
    requireInteraction: false,
    tag: data.tag || 'notiloto-resultado',
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const url = '/';
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
