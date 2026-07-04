// Bump when changing caching strategy so old caches are dropped on activate.
const CACHE_VERSION = "v1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const PAGE_CACHE = `pages-${CACHE_VERSION}`;

// Stale hashed chunks accumulate across deploys and cached pages across
// browsing, so trim each cache oldest-first once it passes these caps.
const STATIC_CACHE_MAX_ENTRIES = 200;
const PAGE_CACHE_MAX_ENTRIES = 50;

// Best-effort precache of the PWA start page: the page the user is on when
// the SW first installs was fetched before the SW controlled it, so it isn't
// cached yet. (Its hashed chunks aren't precached, so full offline support
// still needs one online visit.)
const START_URL = "/energy-planner";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.add(START_URL))
      .catch(() => undefined),
  );
  // No skipWaiting: an updated SW waits until all tabs close, so a version
  // bump can't delete caches out from under pages still running the old build.
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
    event.respondWith(cacheFirst(event, request));
    return;
  }

  // Images (including next/image optimizer output, keyed by query string)
  // and fonts can change without their URL changing, so serve from cache
  // but refresh the copy in the background.
  if (
    url.pathname.startsWith("/_next/image") ||
    /\.(png|jpe?g|svg|ico|webp|woff2?)$/.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(event, request));
    return;
  }

  // Page navigations always try the network so fresh deploys show up,
  // falling back to the last cached copy when offline. Everything else
  // (RSC payloads, prefetches) goes straight to the network untouched.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(event, request));
  }
});

async function cacheFirst(event, request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
    event.waitUntil(trimCache(cache, STATIC_CACHE_MAX_ENTRIES));
  }
  return response;
}

async function staleWhileRevalidate(event, request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
        await trimCache(cache, STATIC_CACHE_MAX_ENTRIES);
      }
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

async function networkFirst(event, request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      event.waitUntil(trimCache(cache, PAGE_CACHE_MAX_ENTRIES));
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  // keys() returns oldest-first, so drop from the front.
  await Promise.all(
    keys.slice(0, Math.max(0, keys.length - maxEntries)).map((key) => {
      return cache.delete(key);
    }),
  );
}
