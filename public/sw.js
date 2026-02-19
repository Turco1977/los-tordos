const CACHE_VERSION = 'los-tordos-v5';
const STATIC_CACHE = 'los-tordos-static-v5';
const API_CACHE = 'los-tordos-api-v5';

// App shell - always cache these
const APP_SHELL = [
  '/',
  '/logo.jpg',
  '/manifest.json',
];

// Install: precache app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  const keep = [STATIC_CACHE, API_CACHE];
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !keep.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip non-GET requests
  if (e.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http
  if (!url.protocol.startsWith('http')) return;

  // API calls: network first, cache fallback (short TTL)
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          if (r.ok) {
            const clone = r.clone();
            caches.open(API_CACHE).then(c => c.put(e.request, clone));
          }
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Supabase calls: return 503 when offline instead of hanging
  if (url.hostname.includes('supabase')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Static assets (_next/static): cache first
  if (url.pathname.includes('/_next/static/') || url.pathname.includes('/_next/image')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(r => {
          if (r.ok) {
            const clone = r.clone();
            caches.open(STATIC_CACHE).then(c => c.put(e.request, clone));
          }
          return r;
        });
      })
    );
    return;
  }

  // Images/fonts: cache first
  if (/\.(jpg|jpeg|png|gif|svg|ico|woff2?|ttf)$/i.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(r => {
          if (r.ok) {
            const clone = r.clone();
            caches.open(STATIC_CACHE).then(c => c.put(e.request, clone));
          }
          return r;
        });
      })
    );
    return;
  }

  // HTML pages (navigation): network first, cache fallback, offline page
  if (e.request.mode === 'navigate' || e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          if (r.ok) {
            const clone = r.clone();
            caches.open(STATIC_CACHE).then(c => c.put(e.request, clone));
          }
          return r;
        })
        .catch(() =>
          caches.match(e.request)
            .then(cached => cached || caches.match('/offline.html'))
            .then(r => r || new Response(
              '<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0A1628;color:#fff;text-align:center"><div><h1>Sin conexion</h1><p>Los Tordos funciona offline — recarga la pagina</p></div></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            ))
        )
    );
    return;
  }

  // Everything else: network first, cache fallback
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r.ok) {
          const clone = r.clone();
          caches.open(STATIC_CACHE).then(c => c.put(e.request, clone));
        }
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});

// Background Sync: process offline queue when connectivity returns
self.addEventListener('sync', e => {
  if (e.tag === 'offline-sync') {
    e.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage('TRIGGER_SYNC'));
      })
    );
  }
});

// Listen for messages from client
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
  if (e.data === 'SYNC_COMPLETE') {
    // Could notify other tabs if needed
  }
});
