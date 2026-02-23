import {
  expect,
  test,
  violationFingerprints,
} from "../../utils/accessibility-test";
import {
  createActivity,
  goToEnergyPlanner,
  repeatingActivity,
} from "../../utils/activity-test-helpers";

test.describe("Repeating Activities - Completion", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlanner(page, {});
  });

  test("should instantiate activity when completed and update schedule", async ({
    page,
    makeAxeBuilder,
  }) => {
    await createActivity(page, repeatingActivity);

    const selectedActivities = page.getByTestId("selected-activities");
    const activityItem = selectedActivities
      .filter({
        hasText: repeatingActivity.name,
      })
      .first();
    await expect(activityItem).toBeVisible();

    // Check if it is projected? (Visual check hard in E2E without robust selectors)
    // But we check behavior.

    // Complete it
    await activityItem
      .getByRole("button", {
        name: "Mark as done",
      })
      .click();

    // Verify it is now completed
    await expect(
      activityItem.getByRole("button", {
        name: "Mark as not done",
      }),
    ).toBeVisible();

    // Navigate to Tomorrow. It should still be there (next instance).
    await page
      .getByRole("button", {
        name: "Next day",
      })
      .click();
    const tomorrowActivity = page
      .getByTestId("selected-activities")
      .filter({
        hasText: repeatingActivity.name,
      })
      .first();
    await expect(tomorrowActivity).toBeVisible();
    await expect(
      tomorrowActivity.getByRole("button", {
        name: "Mark as done",
      }),
    ).not.toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();
  });
});
