/**
 * WhiteLabel Backstage Portal - Universal Service Worker
 * Strategies:
 * - Immediate activation & claim: self.skipWaiting() & clients.claim()
 * - Cache-first: static assets, Next.js chunks, fonts, icons
 * - Network-first: dynamic HTML routes with graceful offline fallback
 */

const CACHE_NAME = 'rmit-whitelabel-pwa-v1';

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
  <title>Offline | WhiteLabel Backstage Portal</title>
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
      border-radius: 0.75rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-badge">
      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-12.728 0m0 0l2.829-2.829m-2.829 2.829L3 21m2.828-12.728a5 5 0 017.072 0m0 0l-2.829 2.829"></path>
      </svg>
    </div>
    <h1>You are currently offline</h1>
    <p>Please check your internet connection. Your releases, catalog drafts, and contracts will automatically sync once your connection is restored.</p>
    <button class="btn" onclick="window.location.reload()">Retry Connection</button>
  </div>
</body>
</html>`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/icon.svg', '/manifest.json']);
    })
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
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and mutations
  if (request.method !== 'GET') {
    return;
  }

  // Skip API and telemetry requests
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/telemetry/')) {
    return;
  }

  // Cache-first for static assets
  const isStatic = STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(request.url));
  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for HTML document navigation with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response(OFFLINE_HTML, {
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
          });
        })
    );
    return;
  }
});
