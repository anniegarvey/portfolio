import { expect, test } from "../../utils/accessibility-test";
import {
  createActivity,
  goToEnergyPlanner,
  planActivityForToday,
  testActivity,
} from "../../utils/activity-test-helpers";

test.describe("One-off Activities - Remove from Day", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlanner(page, {});
  });

  test("should allow removing an activity from the day plan", async ({
    page,
  }) => {
    await createActivity(page, testActivity);
    await planActivityForToday(page, testActivity.name);

    await expect(page.getByText("Your Day Plan (1)")).toBeVisible();

    // Remove activity from day
    const selectedActivities = page.getByTestId("selected-activities");
    await selectedActivities
      .getByRole("button", { name: "Move activity", exact: true })
      .click();
    await page.getByText("Return to unplanned").click();

    // Activity count should decrease
    await expect(page.getByText("Your Day Plan (0)")).toBeVisible();
    await expect(
      page.getByText("No activities in this zone").first(),
    ).toBeVisible();
  });
});
