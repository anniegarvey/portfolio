import {
  expect,
  test,
  violationFingerprints,
} from "../../utils/accessibility-test";
import {
  createActivity,
  goToEnergyPlanner,
  planActivityForToday,
  testActivity,
} from "../../utils/activity-test-helpers";

test.describe("Energy Types - Stats", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlanner(page, {});
  });

  test("should show energy usage summary when activities are planned", async ({
    page,
    makeAxeBuilder,
  }) => {
    await createActivity(page, testActivity);
    await planActivityForToday(page, testActivity.name);

    // Verify usage summary shows energy values
    const usageSummary = page.getByRole("heading", {
      name: "Energy Usage vs Capacity",
    });
    await expect(usageSummary).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();
  });
});
