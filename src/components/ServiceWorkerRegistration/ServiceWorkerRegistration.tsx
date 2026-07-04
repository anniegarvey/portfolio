"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Dev builds aren't cacheable (unhashed chunks, HMR), so only register
    // in production to avoid serving stale code during development.
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failing just means no offline support; the app still works.
    });
  }, []);

  return null;
}
