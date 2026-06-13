const CACHE_NAME = 'checklist-colheita-v1';

function precacheAssets() {
  const urls = [
    './Checklist_Vivencia.html',
    './manifest.json',
    'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
  ];
  return caches.open(CACHE_NAME).then(cache => cache.addAll(urls));
}

function isCacheable(url) {
  const u = url.href;
  return (
    u.startsWith(self.location.origin) ||
    u.includes('cdn.jsdelivr.net/npm/html2canvas')
  );
}

self.addEventListener('install', event => {
  event.waitUntil(precacheAssets());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(event.request);

      if (cached) {
        const networkFetch = fetch(event.request).then(response => {
          if (response && response.status === 200 && isCacheable(url)) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => cached);
        return cached || networkFetch;
      }

      if (isCacheable(url)) {
        try {
          const response = await fetch(event.request);
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        } catch (err) {
          return new Response('Offline', { status: 503 });
        }
      }

      return fetch(event.request);
    })
  );
});
