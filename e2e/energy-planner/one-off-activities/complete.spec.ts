import { expect, test } from "../../utils/accessibility-test";
import {
  mockOneOffActivity,
  mockPlannedInstance,
  mockStoredDayPlan,
  TODAY,
} from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

const instance = mockPlannedInstance(mockOneOffActivity.id);

test.describe("One-off Activities - Complete", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: {
        [TODAY]: mockStoredDayPlan([instance]),
      },
    });
  });

  test("should allow marking an activity as complete", async ({
    page,
    makeAxeBuilder,
  }) => {
    const selectedActivities = page.getByTestId("selected-activities");
    await expect(
      selectedActivities.getByText(mockOneOffActivity.title),
    ).toBeVisible();

    await selectedActivities
      .getByRole("button", { name: "Mark as done", exact: true })
      .click();

    await expect(
      selectedActivities.getByRole("button", {
        name: "Mark as not done",
        exact: true,
      }),
    ).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
