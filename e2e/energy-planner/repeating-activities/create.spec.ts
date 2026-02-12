import { expect, test } from "../../utils/accessibility-test";
import {
  createActivity,
  repeatingActivity,
} from "../../utils/activity-test-helpers";

test.describe("Repeating Activities - Create", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should create a repeating activity and project it on today", async ({
    page,
    makeAxeBuilder,
  }) => {
    await createActivity(page, repeatingActivity, makeAxeBuilder);

    // It should appear in Selected Activities automatically (projected)
    await expect(
      page.getByTestId("selected-activities").getByText(repeatingActivity.name),
    ).toBeVisible();

    // Verify Repeat Icon is present (title="Repeating Activity")
    await expect(page.locator("div[title='Repeating Activity']")).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
