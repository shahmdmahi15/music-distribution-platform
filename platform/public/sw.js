/**
 * RoyalMotionIT Platform - Universal Service Worker
 * Strategies:
 * - Immediate activation & claim: self.skipWaiting() & clients.claim()
 * - Cache-first: static assets, Next.js chunks, fonts, icons
 * - Network-first: dynamic HTML routes with graceful offline fallback
 */

const CACHE_NAME = 'rmit-platform-pwa-v1';

const STATIC_ASSET_PATTERNS = [
  /\/_next\/static\//,
  /\/fonts\//,
  /https:\/\/fonts\.googleapis\.com/,
  /https:\/\/fonts\.gstatic\.com/,
  /\/icon\.svg$/,
  /\/manifest\.json$/,
  /\/favicon\.ico$/
];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Offline | RMIT Music Platform</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0;
      padding: 0;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #030712;
      color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      text-align: center;
      padding: 1.5rem;
    }
    .card {
      max-width: 440px;
      padding: 2.25rem 2rem;
      border-radius: 1.25rem;
      background: rgba(17, 24, 39, 0.85);
      border: 1px solid rgba(75, 85, 99, 0.4);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(12px);
    }
    .icon-badge {
      width: 56px;
      height: 56px;
      margin: 0 auto 1.25rem;
      border-radius: 1rem;
      background: rgba(79, 70, 229, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #818cf8;
    }
    .icon { width: 32px; height: 32px; }
    h1 { font-size: 1.5rem; margin: 0 0 0.5rem; font-weight: 700; }
    p { font-size: 0.875rem; color: #9ca3af; margin: 0 0 1.5rem; line-height: 1.5; }
    .btn {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 0.75rem 1.75rem;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 0.625rem;
      cursor: pointer;
      min-height: 44px;
      min-width: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease;
    }
    .btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-badge">
      <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-2.828-6.364m0 0l2.828 2.828M3 3l18 18" />
      </svg>
    </div>
    <h1>You are currently offline</h1>
    <p>The RMIT Music Platform will reconnect automatically once your network connection is restored.</p>
    <button class="btn" onclick="window.location.reload()">Retry Connection</button>
  </div>
  <script>
    window.addEventListener('online', () => window.location.reload());
  </script>
</body>
</html>`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const isStatic = STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(request.url));
  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => caches.match('/icon.svg'));
      })
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(OFFLINE_HTML, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        })
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request);
      return cached || Promise.reject('no-match');
    })
  );
});
