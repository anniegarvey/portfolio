import type { Page } from "@playwright/test";
import { expect, test } from "../utils/accessibility-test";
import { createActivity, testActivity } from "../utils/activity-test-helpers";
import {
  DEFAULT_CAPACITY,
  mockOneOffActivity,
  mockPlannedInstance,
  mockStoredDayPlan,
  TODAY,
} from "../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../utils/seed-storage";

// On Desktop Chrome the MobileNav PointsDisplay is hidden (display:none on its
// parent). The DesktopSide PointsDisplay is the last one in DOM order.
function pointsDisplay(page: Page) {
  return page.locator("[data-points-display]").last();
}

test.describe("Points System", () => {
  test.beforeEach(async ({ page }) => {
    // Skip particle animation so the counter updates synchronously
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("shows points counter in the header with zero on first visit", async ({
    page,
  }) => {
    await goToEnergyPlannerWithSeed(page, {});
    await expect(pointsDisplay(page)).toBeVisible();
    await expect(pointsDisplay(page)).toContainText("0");
  });

  test("restores persisted points from localStorage on reload", async ({
    page,
  }) => {
    await goToEnergyPlannerWithSeed(page, {});
    await page.evaluate(() =>
      localStorage.setItem("energy-planner-points", "75"),
    );
    await page.reload();
    await expect(pointsDisplay(page)).toContainText("75");
  });

  test("awards 3 + energy sum points when completing an activity", async ({
    page,
  }) => {
    const instance = mockPlannedInstance(mockOneOffActivity.id);
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: { [TODAY]: mockStoredDayPlan([instance]) },
    });

    await page
      .getByTestId("selected-activities")
      .getByRole("button", { name: "Mark as done", exact: true })
      .click();

    // mockOneOffActivity: physical=30, social=5, executive=10 → 3 + 45 = 48
    await expect(pointsDisplay(page)).toContainText("48");
  });

  test("does not award points when un-completing an activity", async ({
    page,
  }) => {
    const instance = mockPlannedInstance(mockOneOffActivity.id, {
      completed: true,
    });
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: { [TODAY]: mockStoredDayPlan([instance]) },
    });

    await page
      .getByTestId("selected-activities")
      .getByRole("button", { name: "Mark as not done", exact: true })
      .click();

    await expect(pointsDisplay(page)).toContainText("0");
  });

  test("awards 3 points when adding an activity to the day plan", async ({
    page,
  }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });

    await page.getByRole("button", { name: "Manage Activities" }).click();
    const modal = page.getByRole("dialog", { name: "Available Activities" });
    await expect(modal).toBeVisible();
    await modal
      .getByRole("button", { name: "Add to day", exact: true })
      .click();

    await expect(pointsDisplay(page)).toContainText("3");
  });

  test("awards 5 points when creating a new activity", async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });
    await createActivity(page, testActivity);

    await expect(pointsDisplay(page)).toContainText("5");
  });

  test("accumulates points across multiple actions", async ({ page }) => {
    const instance = mockPlannedInstance(mockOneOffActivity.id);
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: { [TODAY]: mockStoredDayPlan([instance]) },
    });

    // +48 for completing (3 + 45 energy)
    await page
      .getByTestId("selected-activities")
      .getByRole("button", { name: "Mark as done", exact: true })
      .click();
    await expect(pointsDisplay(page)).toContainText("48");

    // +0 for un-completing (no regression)
    await page
      .getByTestId("selected-activities")
      .getByRole("button", { name: "Mark as not done", exact: true })
      .click();
    await expect(pointsDisplay(page)).toContainText("48");

    // +48 again for re-completing
    await page
      .getByTestId("selected-activities")
      .getByRole("button", { name: "Mark as done", exact: true })
      .click();
    await expect(pointsDisplay(page)).toContainText("96");
  });
});
