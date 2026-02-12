import { expect, test } from "../../utils/accessibility-test";
import {
  createActivity,
  planActivityForToday,
  testActivity,
} from "../../utils/activity-test-helpers";

test.describe("Energy Types - Stats", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should show energy usage summary when activities are planned", async ({
    page,
  }) => {
    await createActivity(page, testActivity);
    await planActivityForToday(page, testActivity.name);

    // Verify usage summary shows energy values
    const usageSummary = page.locator("text=Usage:");
    await expect(usageSummary).toBeVisible();
  });
});
