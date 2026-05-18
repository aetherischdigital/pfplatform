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
//   - fetch:   network-first. Only the navigation request gets an HTML
//              fallback when offline; JS/CSS/API fetches fail naturally so
//              the caller can handle the network error itself (rather than
//              trying to parse the plaintext fallback as JS/CSS/JSON).

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Offline</title><style>html,body{height:100%;margin:0;font-family:system-ui,sans-serif;background:#F4F1E8;color:#2C382B;display:grid;place-items:center;padding:24px;text-align:center}h1{font-size:1.5rem;margin:0 0 .5rem}p{margin:0;color:#5A6657}</style></head><body><div><h1>You're offline</h1><p>Reconnect and reload to continue.</p></div></body></html>`

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(OFFLINE_HTML, {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          }),
      ),
    )
  }
  // For non-navigation requests (JS/CSS/API/images), let the browser handle
  // network errors normally — don't substitute a plaintext 503 that would
  // break parsers downstream.
})
