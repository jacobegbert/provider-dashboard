const CACHE_NAME = 'blm-v1';
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
];

// Install — cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first with cache fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET and API requests
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  let data = { title: 'Black Label Medicine', body: 'You have a new notification' };
  try {
    data = event.data.json();
  } catch (e) {
    data.body = event.data?.text() || data.body;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663344768429/YCQjczTLHVIxeVLr.png',
      badge: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663344768429/YCQjczTLHVIxeVLr.png',
      tag: data.tag || 'blm-notification',
      data: data.url || '/',
      actions: data.actions || [],
    })
  );
});

// Notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
