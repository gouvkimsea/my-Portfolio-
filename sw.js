/**
 * Service Worker for Gouv Kimsea's Portfolio & Mini World 3D
 * Provides offline caching, resilient asset delivery, and instant load speeds.
 */

const CACHE_NAME = 'kimsea-pwa-v3';
const CORE_ASSETS = [
  './',
  './index.html',
  './miniworld.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './og-image.jpg',
  './pingu-contact-bg.webp',
  './robots.txt',
  './sitemap.xml'
];

// Pre-cache core shell during installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        CORE_ASSETS.map((url) =>
          fetch(url)
            .then((res) => {
              if (res.ok) {
                return cache.put(url, res);
              }
            })
            .catch((err) => {
              console.warn('[SW] Pre-cache skipped for:', url, err.message);
            })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Clean up previous cache generations upon activation
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

// Resilient fetch strategy:
// - HTML Navigations: Network-first with cache fallback for fresh content
// - Static Assets: Stale-While-Revalidate for instant delivery with background refresh
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // HTML page navigation: Network-first
  const isHtml = request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');

  if (isHtml) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return caches.match('./index.html');
        })
    );
    return;
  }

  // Same-origin static assets: Stale-While-Revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => {
            if (cachedResponse) return cachedResponse;
            return new Response('Resource unavailable offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Cross-origin assets (e.g. Google Fonts): Cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        // Graceful fallback for optional external resources
        return new Response('', { status: 408, statusText: 'Request timed out or offline' });
      });
    })
  );
});

// Immediate activation trigger
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
