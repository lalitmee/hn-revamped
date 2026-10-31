const CACHE_VERSION = 'hn-revamped-v1';
const APP_CACHE = `${CACHE_VERSION}-app`;
const DATA_CACHE = `${CACHE_VERSION}-data`;
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, '/icon.svg']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith('hn-revamped-') && !key.startsWith(CACHE_VERSION)
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error('Network unavailable and no cached response exists');
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DATA_CACHE);
  const cached = await cache.match(request);
  const update = fetch(request).then((response) => {
    if (response.ok) void cache.put(request, response.clone());
    return response;
  });

  if (cached) {
    void update.catch(() => undefined);
    return cached;
  }
  return update;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isHackerNewsApi =
    url.hostname === 'hacker-news.firebaseio.com' ||
    url.hostname === 'hn.algolia.com';

  if (isHackerNewsApi) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, APP_CACHE).catch(async () => {
        const cache = await caches.open(APP_CACHE);
        return (await cache.match(request)) || (await cache.match(OFFLINE_URL));
      })
    );
    return;
  }

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches
              .open(APP_CACHE)
              .then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  if (url.pathname === '/api/reader') {
    event.respondWith(networkFirst(request, DATA_CACHE));
  }
});
