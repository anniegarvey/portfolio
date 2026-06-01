import { expect, test } from "../../utils/accessibility-test";
import { DEFAULT_CAPACITY, TODAY } from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

async function seedWellnessConfig(page: import("@playwright/test").Page) {
  await page.evaluate((today) => {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("wellness-db", 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("data", "readwrite");
        const store = tx.objectStore("data");

        store.put(
          {
            enabled: true,
            anchorDate: today,
            frequency: 1,
            unit: "days",
            metrics: [
              {
                id: "a3f8d1c2-7b4e-4f9a-8c6d-1e2f3a4b5c6d",
                label: "Overall mood",
                lowLabel: "Low",
                highLabel: "Great",
              },
            ],
          },
          "config",
        );

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
  }, TODAY);
}

test.describe("Wellness Check", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });
    await seedWellnessConfig(page);
    await page.goto("/energy-planner", { waitUntil: "load" });
    await page.getByTestId("selected-activities").waitFor({ state: "visible" });
  });

  test("fills a check and sees it in the dashboard trend and entries list", async ({
    page,
  }) => {
    const checkCard = page.getByRole("region", { name: "Wellness check" });
    await expect(checkCard).toBeVisible();

    await checkCard.getByRole("button", { name: "5 – Great" }).click();

    await checkCard.getByRole("button", { name: "Save" }).click();

    await expect(checkCard).not.toBeVisible();

    await page.goto("/energy-planner/wellness", { waitUntil: "load" });

    const trendsSection = page.getByRole("region", { name: "Wellness trends" });
    await expect(trendsSection).toBeVisible();
    await expect(
      trendsSection.getByRole("img", { name: "Overall mood trend" }),
    ).toBeVisible();

    const entriesList = page.getByRole("list", { name: "Wellness entries" });
    await expect(entriesList).toBeVisible();

    const entryRow = entriesList.getByRole("listitem").first();
    await expect(entryRow).toBeVisible();
    await expect(entryRow.getByText("Overall mood")).toBeVisible();
    await expect(entryRow.getByText("5")).toBeVisible();
  });
});
