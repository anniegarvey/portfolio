import { expect, test } from "../../utils/accessibility-test";
import {
  type ActivityData,
  createActivity,
  planActivityForToday,
  testActivity,
} from "../../utils/activity-test-helpers";

test.describe("Energy Types - Capacity Warning", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should show warning when energy capacity is exceeded", async ({
    page,
    makeAxeBuilder,
  }) => {
    // 1. Create an activity with high energy cost
    const highEnergyActivity: ActivityData = {
      ...testActivity,
      name: "High Energy Activity",
      physical: "20",
    };
    await createActivity(page, highEnergyActivity);

    // 2. Set daily capacity lower than activity cost
    // The physical slider is the first one
    const physicalSlider = page.getByLabel("Physical").first();
    await physicalSlider.fill("10");

    // 3. Plan the activity for today
    await planActivityForToday(page, highEnergyActivity.name);

    // 4. Verify warning appears
    await expect(
      page.getByText(
        "Warning: You have exceeded your Physical energy capacity!",
      ),
    ).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
