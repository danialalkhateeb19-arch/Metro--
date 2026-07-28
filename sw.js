const CACHE_NAME = 'metro-app-v12';

/* مسارات نسبية (./) — تعمل على أي مستودع GitHub Pages مهما كان اسمه.
   التطبيق ملف واحد، فلا وجود لـ style.css أو script.js منفصلين. */
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon192.png',
  './icon512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('Cache error:', err);
      });
    })
  );

  self.skipWaiting();
});


self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );

  self.clients.claim();
});


self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {

      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {

          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return networkResponse;

        })
        .catch(() => {
          // أي طلب تنقّل (فتح الصفحة) بدون إنترنت يُخدَم من النسخة المحفوظة
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }

          return new Response('Offline', {
            status: 503,
            headers: {
              'Content-Type': 'text/plain'
            }
          });
        });
    })
  );
});