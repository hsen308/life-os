const CACHE_NAME = 'lifeos-cache-v7';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

// Real Web Push Event Handler (Fired when app is closed / phone is asleep)
self.addEventListener('push', (event) => {
  let data = {
    title: 'LifeOS',
    body: 'Priority alert from Cognitive Commander',
    url: '/',
    actions: []
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = Object.assign(data, parsed);
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const targetUrl = data.url || (data.data && data.data.url) || '/';

  const notificationOptions = {
    body: data.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: {
      url: targetUrl,
      id: data.data && data.data.id,
      type: data.data && data.data.type
    },
    vibrate: [250, 100, 250],
    tag: data.data && data.data.id ? `lifeos-${data.data.id}` : 'lifeos-alert',
    renotify: true,
    requireInteraction: true,
    actions: Array.isArray(data.actions) && data.actions.length > 0 ? data.actions : [
      { action: 'open', title: 'Open LifeOS' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// Notifications Click & Action Handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a LifeOS tab is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Legacy in-app message fallback
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'NOTIFY') {
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      vibrate: [200, 100, 200]
    });
  }
});
