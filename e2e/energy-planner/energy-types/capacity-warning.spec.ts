import {
  expect,
  test,
  violationFingerprints,
} from "../../utils/accessibility-test";
import {
  mockOneOffActivity,
  mockPlannedInstance,
  TODAY,
} from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

// Activity with 20 physical cost; seeded capacity will be set to 10 physical
const highEnergyActivity = {
  ...mockOneOffActivity,
  id: "aaaaaaaa-0000-0000-0000-000000000099",
  title: "High Energy Activity",
  energyCost: { physical: 20, social: 5, executive: 10 },
};
const instance = mockPlannedInstance(highEnergyActivity.id);

test.describe("Energy Types - Capacity Warning", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [highEnergyActivity],
      dayPlans: {
        [TODAY]: {
          // Physical capacity = 10, activity costs 20 → triggers warning
          dailyCapacity: { physical: 10, social: 50, executive: 51 },
          plannedInstances: [instance],
        },
      },
    });
  });

  test("should show warning when energy capacity is exceeded", async ({
    page,
    makeAxeBuilder,
  }) => {
    await expect(
      page.getByText(
        "Warning: You have exceeded your Physical energy capacity!",
      ),
    ).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();
  });
});
