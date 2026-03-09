import { expect, test } from "../../utils/accessibility-test";
import {
  fillActivityForm,
  repeatingActivity,
} from "../../utils/activity-test-helpers";
import { DEFAULT_CAPACITY, TODAY } from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

test.describe("Repeating Activities - Default Zone", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });
  });

  test("should create a repeating activity with default zone and project it correctly", async ({
    page,
  }) => {
    const activityName = "Evening Routine";
    const activity = { ...repeatingActivity, name: activityName };

    // 1. Open activity creation
    await page.getByRole("button", { name: "Manage Activities" }).click();
    await page.getByRole("button", { name: "New Activity" }).click();
    const createModal = page.getByRole("dialog", {
      name: "Create New Activity",
    });

    // 2. Fill form
    await fillActivityForm(createModal, activity);

    // 3. Select Default Zone "Evening"
    await expect(createModal.getByLabel("Default Zone")).toBeVisible();
    await createModal.getByLabel("Default Zone").click();
    await page.getByRole("option", { name: "Evening" }).click();

    // 4. Submit
    await page.getByRole("button", { name: "Add Activity" }).click();
    await expect(createModal).not.toBeVisible();

    // Close "Available Activities" modal
    await page.getByRole("button", { name: "Close modal" }).click();

    // 5. Verify the activity is automatically projected into the "Evening" zone
    const eveningZone = page.getByTestId("zone-evening");
    await expect(eveningZone.getByText(activityName)).toBeVisible();

    // Verify it is NOT in Morning or Afternoon
    const morningZone = page.getByTestId("zone-morning");
    await expect(morningZone.getByText(activityName)).not.toBeVisible();
    const afternoonZone = page.getByTestId("zone-afternoon");
    await expect(afternoonZone.getByText(activityName)).not.toBeVisible();
  });
});
