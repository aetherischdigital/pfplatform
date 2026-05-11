// Minimal install-friendly service worker.
//
// Purpose: satisfy the PWA installability criterion (browser requires a
// registered service worker that handles `fetch` for the "Install app"
// affordance to surface on Chromium/Android). We deliberately do NOT
// precache the app shell yet — that lands when there's a stable shell
// and a versioning scheme to invalidate caches on deploy.
//
// Behavior:
//   - install: activate immediately
//   - activate: claim open clients
//   - fetch:   network-first, no caching. Returns a 503 shell on full offline.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response('Offline. Please reconnect and reload.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        }),
    ),
  )
})
