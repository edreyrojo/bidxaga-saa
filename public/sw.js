/* Service worker de Bidxaga Saa.
   Versión: cambia este número cuando quieras invalidar la caché. */
const CACHE = 'bidxaga-saa-v2';
const CORE = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/totopo.png',
  '/tuna-vida.png',
  '/engrane.png',
  '/guiechachi.png',
  '/tehuana.png',
  '/images/banner.png',
  '/images/bannerinicio.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.allSettled(CORE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('bidxaga-saa-') && key !== CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/sw.js') return;

  // Navegación: red primero para recibir el index más reciente.
  // Si la red falla o responde con error, se usa la copia en caché.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        }
        return (
          (await caches.match(request)) ||
          (await caches.match('/')) ||
          response
        );
      } catch {
        return (
          (await caches.match(request)) ||
          (await caches.match('/')) ||
          Response.error()
        );
      }
    })());
    return;
  }

  // Assets estáticos: caché primero y actualización en segundo plano.
  if (/\.(?:png|jpe?g|webp|svg|gif|mp3|woff2?|css|js|json)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});
