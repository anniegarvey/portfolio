import { expect, test } from "../../utils/accessibility-test";
import { createTask, repeatingTask } from "../../utils/task-test-helpers";

test.describe("Repeating Tasks - Completion", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should instantiate task when completed and update schedule", async ({
    page,
    makeAxeBuilder,
  }) => {
    await createTask(page, repeatingTask);

    const selectedTasks = page.getByTestId("selected-tasks");
    const taskItem = selectedTasks
      .filter({
        hasText: repeatingTask.name,
      })
      .first();
    await expect(taskItem).toBeVisible();

    // Check if it is projected? (Visual check hard in E2E without robust selectors)
    // But we check behavior.

    // Complete it
    await taskItem
      .getByRole("button", {
        name: "Mark as done",
      })
      .click();

    // Verify it is now completed
    await expect(
      taskItem.getByRole("button", {
        name: "Mark as not done",
      }),
    ).toBeVisible();

    // Navigate to Tomorrow. It should still be there (next instance).
    await page
      .getByRole("button", {
        name: "Next day",
      })
      .click();
    const tomorrowTask = page
      .getByTestId("selected-tasks")
      .filter({
        hasText: repeatingTask.name,
      })
      .first();
    await expect(tomorrowTask).toBeVisible();
    await expect(
      tomorrowTask.getByRole("button", {
        name: "Mark as done",
      }),
    ).not.toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
