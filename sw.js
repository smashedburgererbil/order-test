// Smashed Burger — shows order notifications on the customer's phone, even when the menu is closed.
// Deliberately does NOT cache anything, so the menu is always the latest version.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: 'Smashed Burger', body: event.data && event.data.text() }; }
  const ready = data.kind === 'ready';
  event.waitUntil((async () => {
    await self.registration.showNotification(data.title || 'Smashed Burger', {
      body: data.body || '',
      tag: data.tag || 'order',
      renotify: true,
      requireInteraction: ready,          // the "ready" alert stays until they tap it
      icon: 'image/favicon-192.png',
      badge: 'image/favicon-192.png',
      vibrate: ready ? [500, 200, 500, 200, 900] : [200, 100, 200],
      data: { url: data.url || '' },
    });
    // If the menu is open, tell it to refresh the order status right away
    const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    open.forEach((c) => c.postMessage({ type: 'order-update' }));
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Open the order on whichever address this menu is hosted at
  let target = new URL('menu.html', self.registration.scope).href;
  try {
    const u = new URL(event.notification.data.url);
    target = new URL('menu.html' + u.search, self.registration.scope).href;
  } catch { /* use the plain menu */ }
  event.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of open) {
      if (c.url.startsWith(self.registration.scope)) {
        await c.focus();
        c.postMessage({ type: 'order-update' });
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
