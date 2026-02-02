import { expect, test } from "../../utils/accessibility-test";
import {
  createTask,
  planTaskForToday,
  testTask,
} from "../../utils/task-test-helpers";

test.describe("One-off Tasks - Remove from Day", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should allow removing a task from the day plan", async ({ page }) => {
    await createTask(page, testTask);
    await planTaskForToday(page, testTask.name);

    await expect(page.getByText("Selected Tasks (1)")).toBeVisible();

    // Remove task from day
    const selectedTasks = page.getByTestId("selected-tasks");
    await selectedTasks
      .getByRole("button", { name: "Remove from day", exact: true })
      .click();

    // Task count should decrease
    await expect(page.getByText("Selected Tasks (0)")).toBeVisible();
    await expect(page.getByText("No tasks in this zone").first()).toBeVisible();
  });
});
