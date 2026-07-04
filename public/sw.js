// Bump when changing caching strategy so old caches are dropped on activate.
const CACHE_VERSION = "v1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const PAGE_CACHE = `pages-${CACHE_VERSION}`;

// Precache the PWA start page so it works offline immediately after the
// service worker installs (the page the user is on when the SW first
// installs was fetched before the SW controlled it, so it isn't cached).
const START_URL = "/energy-planner";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.add(START_URL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Build assets are content-hashed: the same URL never changes, so a
  // cached copy is always valid.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Images and fonts from public/ can change without their URL changing,
  // so serve from cache but refresh the copy in the background.
  if (/\.(png|jpe?g|svg|ico|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event, request));
    return;
  }

  // Page navigations always try the network so fresh deploys show up,
  // falling back to the last cached copy when offline. Everything else
  // (RSC payloads, prefetches) goes straight to the network untouched.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(event, request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  if (cached) {
    // Keep the SW alive until the background refresh lands in the cache.
    event.waitUntil(refresh);
    return cached;
  }
  const response = await refresh;
  if (!response) throw new Error(`Offline and not cached: ${request.url}`);
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}
