// Ledger service worker.
// Network-first for the app's own files, so a fresh deploy always wins when
// you're online. The cache is only a fallback for when the network fails or
// is too slow. Anything cross-origin (Apps Script, Google Fonts) is never
// touched: financial data and the password never enter Cache Storage.
//
// Bump CACHE_VERSION only if you want to force-clear old cached files.
const CACHE_VERSION = 'ledger-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const SLOW_NETWORK_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      // Prefix check is deliberate: Cache Storage is shared by every app on this origin (e.g. devotion), so only delete our own old ledger-* caches.
      .then((keys) => Promise.all(
        keys
          .filter((k) => k.startsWith('ledger-') && k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                       // POSTs (login, add, edit) go straight through
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // never touch script.google.com or fonts

  event.respondWith(networkFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(req, { ignoreSearch: true });

  const network = fetch(req).then((res) => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  });

  // No cached copy yet: just wait on the network.
  if (!cached) return network.catch(() => cache.match('./index.html'));

  // Cached copy exists: use the network, but fall back to cache if it fails
  // or takes too long (bad signal shouldn't leave you on a blank screen).
  const timeout = new Promise((resolve) => setTimeout(() => resolve(cached), SLOW_NETWORK_MS));
  return Promise.race([network, timeout]).catch(() => cached);
}
