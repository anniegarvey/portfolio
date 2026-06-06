import type { Page } from "@playwright/test";
import type { WellnessConfig } from "@/lib/wellness/schema";

export async function seedWellnessConfig(
  page: Page,
  config: WellnessConfig,
): Promise<void> {
  await page.goto("/", { waitUntil: "load" });

  await page.evaluate(
    (cfg) => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("wellness-db", 1);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("data", "readwrite");
          const store = tx.objectStore("data");
          store.put(cfg, "config");
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains("data")) {
            db.createObjectStore("data");
          }
        };
      });
    },
    config as Parameters<typeof page.evaluate>[1],
  );
}
