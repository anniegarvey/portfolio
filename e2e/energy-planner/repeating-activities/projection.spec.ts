import { expect, test } from "../../utils/accessibility-test";
import {
  createActivity,
  repeatingActivity,
} from "../../utils/activity-test-helpers";

test.describe("Repeating Activities - Future Projection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should project repeating activity on future dates", async ({
    page,
    makeAxeBuilder,
  }) => {
    await createActivity(page, repeatingActivity);

    // Check Today
    await expect(
      page.getByTestId("selected-activities").getByText(repeatingActivity.name),
    ).toBeVisible();

    // Navigate to Tomorrow
    await page.getByRole("button", { name: "Next day" }).click();

    // Should be visible on Tomorrow (Daily activity)
    await expect(
      page.getByTestId("selected-activities").getByText(repeatingActivity.name),
    ).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
