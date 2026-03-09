import {
  expect,
  test,
  violationFingerprints,
} from "../../utils/accessibility-test";
import {
  createActivity,
  repeatingActivity,
} from "../../utils/activity-test-helpers";
import { DEFAULT_CAPACITY, TODAY } from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

test.describe("Repeating Activities - Future Projection", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });
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
    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();
  });
});
