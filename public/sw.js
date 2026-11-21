/* Service worker de Bidxaga Saa.
   Versión: cambia este número cuando quieras invalidar la caché. */
const CACHE = 'bidxaga-saa-/* __VERSION__ */';

// Assets base que siempre deben estar disponibles.
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
  '/images/bannerinicio.png',
  '/audio/click1.mp3',
  '/audio/click2.mp3',
  '/audio/click3.mp3'
];

// Los chunks con hash y las imágenes se inyectan al compilar.
const BUILD_ASSETS = /* __PRECACHE__ */ [];
const IMAGE_ASSETS = /* __IMAGENES__ */ [];

const PRECACHE = [...new Set([...CORE, ...BUILD_ASSETS])];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith('bidxaga-saa-') && key !== CACHE)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());

  // Las imágenes se guardan después de activar, sin bloquear la primera pantalla.
  event.waitUntil(calentarImagenes());
});

async function calentarImagenes() {
  if (IMAGE_ASSETS.length === 0) return;

  const cache = await caches.open(CACHE);
  const LOTE = 8;

  for (let inicio = 0; inicio < IMAGE_ASSETS.length; inicio += LOTE) {
    const lote = IMAGE_ASSETS.slice(inicio, inicio + LOTE);
    await Promise.allSettled(
      lote.map(async (url) => {
        const existente = await cache.match(url, { ignoreVary: true });
        if (!existente) await cache.add(url);
      })
    );
  }
}

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
          (await caches.match(request, { ignoreVary: true })) ||
          (await caches.match('/', { ignoreVary: true })) ||
          response
        );
      } catch {
        return (
          (await caches.match(request, { ignoreVary: true })) ||
          (await caches.match('/', { ignoreVary: true })) ||
          Response.error()
        );
      }
    })());
    return;
  }

  // Assets estáticos: caché primero y actualización en segundo plano.
  if (/\.(?:png|jpe?g|webp|svg|gif|mp3|woff2?|css|js|json)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request, { ignoreVary: true }).then((cached) => {
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
