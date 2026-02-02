import { expect, test } from "@playwright/test";
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
  }) => {
    await createTask(page, testTask);
    await planTaskForToday(page, testTask.name);

    await expect(page.getByText("Selected Tasks (1)")).toBeVisible();
    const selectedTasks = page.getByTestId("selected-tasks");
    await expect(selectedTasks.getByText(testTask.name)).toBeVisible();
    await verifyTaskEnergyBadges(selectedTasks, testTask);
  });
});
