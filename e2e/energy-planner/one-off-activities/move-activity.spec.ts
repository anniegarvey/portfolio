import { expect, test } from "../../utils/accessibility-test";
import {
  createActivity,
  planActivityForToday,
  testActivity,
} from "../../utils/activity-test-helpers";

test.describe("One-off Activities - Move Activity", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should allow moving an activity to tomorrow", async ({ page }) => {
    await createActivity(page, testActivity);
    await planActivityForToday(page, testActivity.name);

    await expect(page.getByText("Selected Activities (1)")).toBeVisible();

    // Verify it is in today's plan
    const selectedActivities = page.getByTestId("selected-activities");
    await expect(selectedActivities.getByText(testActivity.name)).toBeVisible();

    // Move activity to tomorrow
    await selectedActivities
      .getByRole("button", { name: "Move activity", exact: true })
      .click();

    await page.getByText("Tomorrow", { exact: true }).click();

    // Activity count should decrease
    await expect(page.getByText("Selected Activities (0)")).toBeVisible();
    await expect(
      page.getByText("No activities in this zone").first(),
    ).toBeVisible();

    // Navigate to tomorrow
    await page.getByLabel("Next Day").click();

    // Verify activity is present on tomorrow
    await expect(page.getByText("Selected Activities (1)")).toBeVisible();
    await expect(
      page.getByTestId("selected-activities").getByText(testActivity.name),
    ).toBeVisible();

    // Move back to unplanned from tomorrow
    await page
      .getByTestId("selected-activities")
      .getByRole("button", { name: "Move activity", exact: true })
      .click();

    await page.getByText("Return to unplanned").click();

    await expect(page.getByText("Selected Activities (0)")).toBeVisible();
  });
});
