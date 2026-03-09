import { expect, test } from "../../utils/accessibility-test";
import {
  mockOneOffActivity,
  mockPlannedInstance,
  mockStoredDayPlan,
  TODAY,
} from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

const instance = mockPlannedInstance(mockOneOffActivity.id);

test.describe("One-off Activities - Remove from Day", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: {
        [TODAY]: mockStoredDayPlan([instance]),
      },
    });
  });

  test("should allow removing an activity from the day plan", async ({
    page,
  }) => {
    await expect(page.getByText("Your Day Plan (1)")).toBeVisible();

    const selectedActivities = page.getByTestId("selected-activities");
    await selectedActivities
      .getByRole("button", { name: "Move activity", exact: true })
      .click();
    await page.getByText("Return to unplanned").click();

    await expect(page.getByText("Your Day Plan (0)")).toBeVisible();
    await expect(
      page.getByText("No activities in this zone").first(),
    ).toBeVisible();
  });
});
