import {
  expect,
  test,
  violationFingerprints,
} from "../utils/accessibility-test";
import {
  createActivity,
  planActivityForToday,
  repeatingActivity,
  testActivity,
} from "../utils/activity-test-helpers";
import { DEFAULT_CAPACITY, TODAY } from "../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../utils/seed-storage";

test.describe("Activity Conversion", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });
  });

  test("should persist and project when converting from one-off to repeating", async ({
    page,
    makeAxeBuilder,
  }) => {
    const activityName = "To Repeating Conversion";
    const activityData = { ...testActivity, name: activityName };

    // 1. Create a one-off activity and plan it
    await createActivity(page, activityData);
    await planActivityForToday(page, activityName);

    // 2. Edit the activity in the day plan
    const activityCard = page
      .getByRole("article")
      .filter({ hasText: activityName });
    await activityCard.getByText(activityName).click();

    // 3. Convert to repeating
    const editModal = page.getByRole("dialog", { name: "Edit Activity" });
    await editModal.getByLabel("Repeat this activity").check();
    await editModal.getByRole("button", { name: "Update Activity" }).click();
    await expect(editModal).not.toBeVisible();

    // 4. Verify it's still in the day plan today
    const selectedActivities = page.getByTestId("selected-activities");
    await expect(selectedActivities.getByText(activityName)).toBeVisible();

    // 5. Navigate to the next day and verify it's projected
    await page.getByRole("button", { name: "Next Day" }).click();
    await expect(selectedActivities.getByText(activityName)).toBeVisible();

    // 6. Reload and verify persistence
    await page.reload();
    await page.locator("[aria-busy='true']").waitFor({ state: "detached" });
    await expect(selectedActivities.getByText(activityName)).toBeVisible();

    // 7. Check repeating tab in management modal
    await page.getByRole("button", { name: "Manage Activities" }).click();
    const modal = page.getByRole("dialog", { name: "Available Activities" });
    await modal.getByRole("button", { name: "Repeating Activities" }).click();
    await expect(modal.getByText(activityName)).toBeVisible();

    // Accessibility check
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();
  });

  test("should persist when converting from repeating to one-off", async ({
    page,
  }) => {
    const activityName = "To One-Off Conversion";
    const activityData = {
      ...repeatingActivity,
      name: activityName,
    };

    // 1. Create a repeating activity
    await createActivity(page, activityData);

    // 2. Locate the activity (it projects automatically) and edit it
    const selectedActivities = page.getByTestId("selected-activities");
    await expect(selectedActivities.getByText(activityName)).toBeVisible();

    const activityCard = page
      .getByRole("article")
      .filter({ hasText: activityName });
    await activityCard.getByText(activityName).click();

    // 3. Convert to one-off
    const editModal = page.getByRole("dialog", { name: "Edit Activity" });
    await editModal.getByLabel("Repeat this activity").uncheck();
    await editModal.getByRole("button", { name: "Update Activity" }).click();
    await expect(editModal).not.toBeVisible();

    // 4. Verify it's still in the day plan today
    await expect(selectedActivities.getByText(activityName)).toBeVisible();

    // 5. Navigate to the next day - it should NOT be projected
    await page.getByRole("button", { name: "Next Day" }).click();
    await expect(selectedActivities.getByText(activityName)).not.toBeVisible();

    // 6. Reload and verify persistence
    // Energy planner resets to Today on reload. Since the activity was explicitly scheduled for today, it should be visible.
    await page.reload();
    await page.locator("[aria-busy='true']").waitFor({ state: "detached" });
    await expect(selectedActivities.getByText(activityName)).toBeVisible();

    // 7. Remove it from today's day plan
    const activityCardToWait = page
      .getByRole("article")
      .filter({ hasText: activityName });
    await activityCardToWait.hover();
    await activityCardToWait
      .getByRole("button", { name: "Move activity" })
      .click();
    await page.getByRole("menuitem", { name: "Return to unplanned" }).click();
    await expect(selectedActivities.getByText(activityName)).not.toBeVisible();

    // 8. Check one-off tab in management modal
    await page.getByRole("button", { name: "Manage Activities" }).click();
    const modal = page.getByRole("dialog", { name: "Available Activities" });
    await modal.getByRole("button", { name: "One-Off Activities" }).click();
    await expect(modal.getByText(activityName)).toBeVisible();
  });
});
