import {
  expect,
  test,
  violationFingerprints,
} from "../../utils/accessibility-test";
import {
  type ActivityData,
  createActivity,
  goToEnergyPlanner,
  planActivityForToday,
  testActivity,
} from "../../utils/activity-test-helpers";

test.describe("Energy Types - Capacity Warning", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlanner(page, {});
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
    await page.getByRole("button", { name: "Edit Capacity" }).click();

    // The physical slider is the first one
    const physicalSlider = page.getByLabel("Physical").first();
    await physicalSlider.fill("10");
    await page.getByRole("button", { name: "Save" }).click();

    // 3. Plan the activity for today
    await planActivityForToday(page, highEnergyActivity.name);

    // 4. Verify warning appears
    await expect(
      page.getByText(
        "Warning: You have exceeded your Physical energy capacity!",
      ),
    ).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();
  });
});
