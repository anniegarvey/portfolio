import { expect, test } from "../../utils/accessibility-test";
import {
  createTask,
  planTaskForToday,
  testTask,
  verifyTaskEnergyBadges,
} from "../../utils/task-test-helpers";

test.describe("One-off Tasks - Create and Plan", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should allow creating a task and planning it for today", async ({
    page,
    makeAxeBuilder,
  }) => {
    await createTask(page, testTask, makeAxeBuilder);
    await planTaskForToday(page, testTask.name);

    await expect(page.getByText("Selected Tasks (1)")).toBeVisible();
    const selectedTasks = page.getByTestId("selected-tasks");
    await expect(selectedTasks.getByText(testTask.name)).toBeVisible();
    await verifyTaskEnergyBadges(selectedTasks, testTask);

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
