import { expect, test } from "../../utils/accessibility-test";
import {
  createActivity,
  planActivityForToday,
  testActivity,
} from "../../utils/activity-test-helpers";

test.describe("One-off Activities - Edit Description", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should allow editing an activity's description while in the day plan", async ({
    page,
    makeAxeBuilder,
  }) => {
    await createActivity(page, testActivity);
    await planActivityForToday(page, testActivity.name);

    // Verify activity is in day plan
    const selectedActivities = page.getByTestId("selected-activities");
    await expect(selectedActivities.getByText(testActivity.name)).toBeVisible();

    // Click edit on the planned activity
    await selectedActivities
      .getByRole("button", { name: "Edit activity", exact: true })
      .click();

    // Edit modal should open
    const editModal = page.getByRole("dialog", { name: "Edit Activity" });
    await expect(editModal).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // Add a description
    const newDescription = "This is a detailed description of the activity.";
    await editModal.getByLabel("Description").fill(newDescription);
    await page.getByRole("button", { name: "Update Activity" }).click();
    await expect(editModal).not.toBeVisible();

    // Verify description appears on card immediately
    await expect(selectedActivities.getByText(newDescription)).toBeVisible();

    // Reload page to verify persistence
    await page.reload();

    // Verify description persists
    await expect(page.getByTestId("selected-activities")).toBeVisible();
    await expect(
      page.getByTestId("selected-activities").getByText(newDescription),
    ).toBeVisible();
  });
});
