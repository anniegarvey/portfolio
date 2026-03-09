import {
  expect,
  test,
  violationFingerprints,
} from "../../utils/accessibility-test";
import {
  mockOneOffActivity,
  mockPlannedInstance,
  mockStoredDayPlan,
  TODAY,
} from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

const instance = mockPlannedInstance(mockOneOffActivity.id);

test.describe("Energy Types - Stats", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: { [TODAY]: mockStoredDayPlan([instance]) },
    });
  });

  test("should show energy usage summary when activities are planned", async ({
    page,
    makeAxeBuilder,
  }) => {
    const usageSummary = page.getByRole("heading", {
      name: "Energy Usage vs Capacity",
    });
    await expect(usageSummary).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();
  });
});
