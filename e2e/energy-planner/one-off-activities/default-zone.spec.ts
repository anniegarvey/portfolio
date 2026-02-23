import { expect, test } from "../../utils/accessibility-test";
import {
  fillActivityForm,
  goToEnergyPlanner,
  testActivity,
} from "../../utils/activity-test-helpers";

test.describe("One-off Activities - Default Zone", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlanner(page, {});
  });

  test("should use default zone when adding to plan", async ({ page }) => {
    // 1. Create an activity with a default zone
    await page.getByRole("button", { name: "Manage Activities" }).click();
    await page.getByRole("button", { name: "New Activity" }).click();
    const createModal = page.getByRole("dialog", {
      name: "Create New Activity",
    });

    // Unique activity name to avoid locator ambiguity
    const activityName = "Yoga Session";
    const activity = { ...testActivity, name: activityName };

    // Fill basic fields
    await fillActivityForm(createModal, activity);

    // Select Default Zone "Afternoon"
    // The label is "Default Zone"
    // We need to click the trigger associated with it.
    // Since Select in Radix is complex, we might target the trigger directly.
    // Current helper fillActivityForm doesn't handle this, so we do it manually.

    // Wait for animation
    await expect(createModal.getByLabel("Default Zone")).toBeVisible();

    // Click the select trigger (it behaves like a button or combobox)
    // The SelectTrigger has id=`${formId}-defaultZoneId` and the label points to it.
    // So getByLabel("Default Zone") should target the button.
    await createModal.getByLabel("Default Zone").click();

    // Select "Afternoon" from the options
    await page.getByRole("option", { name: "Afternoon" }).click();

    // Submit
    await page.getByRole("button", { name: "Add Activity" }).click();
    await expect(createModal).not.toBeVisible();

    // 2. Add the activity to the day plan
    // We are still in "Available Activities" modal
    const availableModal = page.getByRole("dialog", {
      name: "Available Activities",
    });
    await expect(availableModal.getByText(activityName)).toBeVisible();

    await availableModal
      .getByRole("article")
      .filter({ hasText: activityName })
      .getByRole("button", { name: "Add to day" })
      .click();

    // Verify modal closes
    await expect(availableModal).not.toBeVisible();

    // 3. Verify the activity is in the "Afternoon" zone
    const afternoonZone = page.getByTestId("zone-afternoon");
    await expect(afternoonZone.getByText(activityName)).toBeVisible();

    // Verify it is NOT in Morning
    const morningZone = page.getByTestId("zone-morning");
    await expect(morningZone.getByText(activityName)).not.toBeVisible();
  });
});
