"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Dev builds aren't cacheable (unhashed chunks, HMR), so only register
    // in production to avoid serving stale code during development.
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => navigator.serviceWorker.ready)
        .then((registration) => {
          // This page and its assets may have loaded before the SW took
          // control, so hand it the list to cache for offline launches.
          registration.active?.postMessage({
            type: "precache",
            page: location.pathname,
            assets: performance
              .getEntriesByType("resource")
              .map((entry) => entry.name),
          });
        })
        .catch(() => {
          // Registration failing just means no offline support; the app still works.
        });
    };

    // Wait for the load event so registration (and the SW's install fetch)
    // doesn't compete with critical resources during initial page load.
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
