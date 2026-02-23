import { expect, test } from "../../utils/accessibility-test";
import {
  createActivity,
  goToEnergyPlanner,
  planActivityForToday,
  testActivity,
  verifyActivityEnergyBadges,
} from "../../utils/activity-test-helpers";

test.describe("One-off Activities - Create and Plan", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlanner(page, {});
  });

  test("should allow creating an activity and planning it for today", async ({
    page,
    makeAxeBuilder,
  }) => {
    await createActivity(page, testActivity, makeAxeBuilder);
    await planActivityForToday(page, testActivity.name);

    await expect(page.getByText("Your Day Plan (1)")).toBeVisible();
    const selectedActivities = page.getByTestId("selected-activities");
    await expect(selectedActivities.getByText(testActivity.name)).toBeVisible();
    await verifyActivityEnergyBadges(selectedActivities, testActivity);

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
