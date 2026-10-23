const CACHE_NAME = 'mandalo-cache-v4';
const IMAGES_CACHE = 'mandalo-images-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// SVG local de respaldo si la conexión se cae y no hay caché
const FALLBACK_SVG_IMAGE = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="100%" height="100%" fill="#141E33"/>
  <circle cx="200" cy="130" r="45" fill="rgba(255,94,54,0.2)"/>
  <text x="200" y="142" font-family="sans-serif" font-size="34" text-anchor="middle" fill="#FF5E36">🛵</text>
  <text x="200" y="210" font-family="sans-serif" font-weight="bold" font-size="18" fill="#FFFFFF" text-anchor="middle">MÁNDALO!</text>
  <text x="200" y="235" font-family="sans-serif" font-size="12" fill="#94A3B8" text-anchor="middle">Modo Fuera de Línea</text>
</svg>`.trim();

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== IMAGES_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 1. NUNCA cachear peticiones de Base de Datos, Auth o APIs en tiempo real
  // La base de datos siempre va directa a la nube (Supabase / DolarAPI)
  if (
    url.includes('/rest/v1/') ||
    url.includes('/auth/v1/') ||
    url.includes('/realtime/v1/') ||
    url.includes('dolarapi.com') ||
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('/@') ||
    url.includes('/src/') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // 2. Caché Persistente de Imágenes (Banners, Fotos de Productos, Comprobantes, Iconos)
  const isImageRequest = 
    event.request.destination === 'image' ||
    url.match(/\.(png|jpg|jpeg|svg|webp|gif|avif)(\?.*)?$/i) ||
    url.includes('images.unsplash.com') ||
    url.includes('/storage/v1/object/public/');

  if (isImageRequest) {
    event.respondWith(
      caches.open(IMAGES_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // Revalidación en segundo plano: si el comerciante cambió la foto, se descarga la nueva versión y se actualiza la caché
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Si la red falla y no había nada en caché, devolver SVG de respaldo
            return cachedResponse || new Response(FALLBACK_SVG_IMAGE, {
              headers: { 'Content-Type': 'image/svg+xml' }
            });
          });

          // Si ya existe en caché, entregarla al instante (0ms de espera); si no, esperar la descarga de red
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 3. Network-First para Navegación HTML (Para que los despliegues de GitHub Pages se actualicen al instante)
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request) || caches.match('./index.html') || caches.match('/index.html'))
    );
    return;
  }

  // 4. Cache-First para recursos estáticos del bundle compilado (JS, CSS)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html') || caches.match('/index.html');
        }
      });
    })
  );
});

// Push notification listener (FCM / Web Push standard)
self.addEventListener('push', (event) => {
  let data = { title: 'MÁNDALO! Notificación', body: 'Tienes una nueva actualización en tu pedido.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: './icon.svg',
    badge: './icon.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
