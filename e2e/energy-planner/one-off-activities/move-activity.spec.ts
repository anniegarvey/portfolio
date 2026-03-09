import { expect, test } from "../../utils/accessibility-test";
import {
  mockOneOffActivity,
  mockPlannedInstance,
  mockStoredDayPlan,
  TODAY,
} from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

const instance = mockPlannedInstance(mockOneOffActivity.id);

test.describe("One-off Activities - Move Activity", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: {
        [TODAY]: mockStoredDayPlan([instance]),
      },
    });
  });

  test("should allow moving an activity to tomorrow", async ({ page }) => {
    await expect(page.getByText("Your Day Plan (1)")).toBeVisible();

    const selectedActivities = page.getByTestId("selected-activities");
    await expect(
      selectedActivities.getByText(mockOneOffActivity.title),
    ).toBeVisible();

    await selectedActivities
      .getByRole("button", { name: "Move activity", exact: true })
      .click();

    await page.getByText("Tomorrow", { exact: true }).click();

    await expect(page.getByText("Your Day Plan (0)")).toBeVisible();
    await expect(
      page.getByText("No activities in this zone").first(),
    ).toBeVisible();

    await page.getByLabel("Next Day").click();

    await expect(page.getByText("Your Day Plan (1)")).toBeVisible();
    await expect(
      page
        .getByTestId("selected-activities")
        .getByText(mockOneOffActivity.title),
    ).toBeVisible();

    await page
      .getByTestId("selected-activities")
      .getByRole("button", { name: "Move activity", exact: true })
      .click();

    await page.getByText("Return to unplanned").click();

    await expect(page.getByText("Your Day Plan (0)")).toBeVisible();
  });
});
