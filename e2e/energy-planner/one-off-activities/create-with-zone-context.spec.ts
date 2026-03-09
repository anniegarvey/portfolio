import { expect, test } from "../../utils/accessibility-test";
import {
  fillActivityForm,
  testActivity,
} from "../../utils/activity-test-helpers";
import { DEFAULT_CAPACITY, TODAY } from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

test.describe("One-off Activities - Create with Zone Context", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });
  });

  test("should immediately plan activity and close all modals when created from a zone", async ({
    page,
  }) => {
    // Click "Add Activity" directly on the zone (not "Manage Activities")
    await page
      .getByRole("button", { name: /Add activity to/i })
      .first()
      .click();

    const availableModal = page.getByRole("dialog", {
      name: "Available Activities",
    });
    await expect(availableModal).toBeVisible();

    // Click New Activity from within the available activities modal
    await availableModal.getByRole("button", { name: "New Activity" }).click();

    const createModal = page.getByRole("dialog", {
      name: "Create New Activity",
    });
    await expect(createModal).toBeVisible();

    await fillActivityForm(createModal, testActivity);
    await page.getByRole("button", { name: "Add Activity" }).click();

    // Both modals should be gone — no manual close needed
    await expect(createModal).not.toBeVisible();
    await expect(availableModal).not.toBeVisible();

    // Activity should be immediately visible in the day plan
    await expect(page.getByText("Your Day Plan (1)")).toBeVisible();
    const selectedActivities = page.getByTestId("selected-activities");
    await expect(selectedActivities.getByText(testActivity.name)).toBeVisible();
  });

  test("should not auto-close available activities modal when New Activity is opened without zone context", async ({
    page,
  }) => {
    // Open available activities via the top-level "Manage Activities" button
    await page.getByRole("button", { name: "Manage Activities" }).click();

    const availableModal = page.getByRole("dialog", {
      name: "Available Activities",
    });
    await expect(availableModal).toBeVisible();

    await page.getByRole("button", { name: "New Activity" }).click();

    const createModal = page.getByRole("dialog", {
      name: "Create New Activity",
    });
    await expect(createModal).toBeVisible();

    await fillActivityForm(createModal, testActivity);
    await page.getByRole("button", { name: "Add Activity" }).click();

    // Create modal closes, but available activities modal remains open
    await expect(createModal).not.toBeVisible();
    await expect(availableModal).toBeVisible();

    // Activity should be in the available list (unplanned pool), not the day plan
    await expect(availableModal.getByText(testActivity.name)).toBeVisible();
    await expect(page.getByText("Your Day Plan (0)")).toBeVisible();

    // Clean up
    await page.getByRole("button", { name: "Close modal" }).click();
  });
});
