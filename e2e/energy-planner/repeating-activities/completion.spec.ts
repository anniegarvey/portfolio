import {
  expect,
  test,
  violationFingerprints,
} from "../../utils/accessibility-test";
import {
  mockPlannedInstance,
  mockRepeatingActivity,
  mockStoredDayPlan,
  TODAY,
} from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

const instance = mockPlannedInstance(mockRepeatingActivity.id);

test.describe("Repeating Activities - Completion", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockRepeatingActivity],
      dayPlans: {
        [TODAY]: mockStoredDayPlan([instance]),
      },
    });
  });

  test("should instantiate activity when completed and update schedule", async ({
    page,
    makeAxeBuilder,
  }) => {
    const selectedActivities = page.getByTestId("selected-activities");
    const activityItem = selectedActivities
      .filter({ hasText: mockRepeatingActivity.title })
      .first();
    await expect(activityItem).toBeVisible();

    await activityItem.getByRole("button", { name: "Mark as done" }).click();

    await expect(
      activityItem.getByRole("button", { name: "Mark as not done" }),
    ).toBeVisible();

    // Navigate to Tomorrow — next daily instance should be projected
    await page.getByRole("button", { name: "Next day" }).click();
    const tomorrowActivity = page
      .getByTestId("selected-activities")
      .filter({ hasText: mockRepeatingActivity.title })
      .first();
    await expect(tomorrowActivity).toBeVisible();
    await expect(
      tomorrowActivity.getByRole("button", { name: "Mark as done" }),
    ).not.toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();
  });
});
