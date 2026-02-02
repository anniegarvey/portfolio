import { expect, test } from "../../utils/accessibility-test";
import {
  createTask,
  planTaskForToday,
  testTask,
} from "../../utils/task-test-helpers";

test.describe("One-off Tasks - Complete", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should allow marking a task as complete", async ({
    page,
    makeAxeBuilder,
  }) => {
    await createTask(page, testTask);
    await planTaskForToday(page, testTask.name);

    // Mark task as complete
    const selectedTasks = page.getByTestId("selected-tasks");
    await selectedTasks
      .getByRole("button", { name: "Mark as done", exact: true })
      .click();

    // Task should now show as completed (button changes to "Mark as not done")
    await expect(
      selectedTasks.getByRole("button", {
        name: "Mark as not done",
        exact: true,
      }),
    ).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
