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
    // 1. Create an activity with a default zone via the Manage Activities modal.
    //    No active zone is selected, but the activity has a defaultZoneId of "Afternoon",
    //    so it is auto-planned there immediately upon creation.
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
    await expect(createModal.getByLabel("Default Zone")).toBeVisible();
    await createModal.getByLabel("Default Zone").click();
    await page.getByRole("option", { name: "Afternoon" }).click();

    // Submit
    await page.getByRole("button", { name: "Add Activity" }).click();
    await expect(createModal).not.toBeVisible();

    // 2. Close the Available Activities modal (it stays open since no zone context was active)
    await page.getByRole("button", { name: "Close modal" }).click();

    // 3. Verify the activity was immediately planned into the "Afternoon" zone
    await expect(page.getByText("Your Day Plan (1)")).toBeVisible();
    const afternoonZone = page.getByTestId("zone-afternoon");
    await expect(afternoonZone.getByText(activityName)).toBeVisible();

    // Verify it is NOT in Morning
    const morningZone = page.getByTestId("zone-morning");
    await expect(morningZone.getByText(activityName)).not.toBeVisible();
  });
});
