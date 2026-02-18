import { expect, test } from "../../utils/accessibility-test";
import {
  createActivity,
  repeatingActivity,
} from "../../utils/activity-test-helpers";

test.describe("Repeating Activities - Moving", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should reschedule a repeating activity when moved to a future date", async ({
    page,
  }) => {
    // Create repeating activity
    await createActivity(page, repeatingActivity);

    // Find activity in the day plan
    await expect(
      page.getByTestId("selected-activities").getByText(repeatingActivity.name),
    ).toBeVisible();

    // Open Move dropdown
    await page.getByRole("button", { name: "Move activity" }).click();

    // Click "Day after tomorrow"
    await page.getByText("Day after tomorrow").click();

    // Expect gone from Today
    await expect(
      page.getByTestId("selected-activities").getByText(repeatingActivity.name),
    ).not.toBeVisible();

    // Go to Tomorrow
    await page.getByRole("button", { name: "Next day" }).click();

    // Expect VISIBLE in Tomorrow (because daily schedule remains intact)
    await expect(
      page.getByTestId("selected-activities").getByText(repeatingActivity.name),
    ).toBeVisible();

    // Go to Day After Tomorrow
    await page.getByRole("button", { name: "Next day" }).click();

    // Expect visible (moved instance + potentially projected instance)
    await expect(
      page
        .getByTestId("selected-activities")
        .getByText(repeatingActivity.name)
        .first(),
    ).toBeVisible();
  });
});
