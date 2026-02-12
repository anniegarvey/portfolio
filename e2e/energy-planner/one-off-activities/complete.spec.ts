import { expect, test } from "../../utils/accessibility-test";
import {
  createActivity,
  planActivityForToday,
  testActivity,
} from "../../utils/activity-test-helpers";

test.describe("One-off Activities - Complete", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should allow marking an activity as complete", async ({
    page,
    makeAxeBuilder,
  }) => {
    await createActivity(page, testActivity);
    await planActivityForToday(page, testActivity.name);

    // Mark activity as complete
    const selectedActivities = page.getByTestId("selected-activities");
    await selectedActivities
      .getByRole("button", { name: "Mark as done", exact: true })
      .click();

    // Activity should now show as completed (button changes to "Mark as not done")
    await expect(
      selectedActivities.getByRole("button", {
        name: "Mark as not done",
        exact: true,
      }),
    ).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
