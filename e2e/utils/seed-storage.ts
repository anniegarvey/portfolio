import type { Page } from "@playwright/test";
import type { Activity } from "@/lib/energy-planner/schema";
import type { StoredDayPlan } from "@/lib/energy-planner/storage";

interface SeedData {
  activities?: Activity[];
  /** Keyed by YYYY-MM-DD date string */
  dayPlans?: Record<string, StoredDayPlan>;
}

/**
 * Seeds the energy planner's IndexedDB store before page load.
 *
 * Must be called before page.goto() — it opens the same "energy-planner-db"/"data"
 * store used by the app and writes keys using the raw IndexedDB API.
 */
export async function seedEnergyPlannerStorage(
  page: Page,
  data: SeedData,
): Promise<void> {
  // Navigate to the app first so we're in the correct origin for IndexedDB.
  // Wait for load so scripts have executed and the app's initial DB open has
  // completed before we write seed data on top of it.
  await page.goto("/energy-planner", { waitUntil: "load" });

  await page.evaluate(
    (seedData) => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("energy-planner-db", 1);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("data", "readwrite");
          const store = tx.objectStore("data");

          if (seedData.activities) {
            store.put(seedData.activities, "activities");
          }

          if (seedData.dayPlans) {
            for (const [date, plan] of Object.entries(seedData.dayPlans)) {
              store.put(plan, `day-${date}`);
            }
          }

          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };

        // If the DB doesn't exist yet, create the object store
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains("data")) {
            db.createObjectStore("data");
          }
        };
      });
    },
    data as Parameters<typeof page.evaluate>[1],
  );
}

/**
 * Waits for the energy planner to be fully ready after a navigation or reload.
 *
 * Waits for [data-testid="selected-activities"] to appear — this element only
 * renders once isLoading is false and the DayPlanner has replaced the skeleton.
 * Waiting for aria-busy to detach is insufficient because waitFor({ state:
 * 'detached' }) returns immediately if the element was never in the DOM (e.g.
 * React hasn't rendered yet when the load event fires under a slow dev server).
 */
async function waitForEnergyPlannerReady(page: Page): Promise<void> {
  await page
    .getByTestId("selected-activities")
    .waitFor({ state: "visible" });
}

/**
 * Navigate to the energy planner with seeded state.
 */
export async function goToEnergyPlannerWithSeed(
  page: Page,
  data: SeedData,
): Promise<void> {
  await seedEnergyPlannerStorage(page, data);

  await page.goto("/energy-planner", { waitUntil: "load" });
  await waitForEnergyPlannerReady(page);
}

/**
 * Reload the energy planner and wait for the app to be fully ready.
 *
 * Prefer this over bare page.reload() — the load event fires before React
 * hydration and IndexedDB reads complete, causing flaky assertions.
 */
export async function reloadEnergyPlanner(page: Page): Promise<void> {
  await page.reload();
  await waitForEnergyPlannerReady(page);
}
