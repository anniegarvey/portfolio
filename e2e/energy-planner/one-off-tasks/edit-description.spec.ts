import { expect, test } from "@playwright/test";
import {
  createTask,
  planTaskForToday,
  testTask,
} from "../../utils/task-test-helpers";

test.describe("One-off Tasks - Edit Description", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should allow editing a task's description while in the day plan", async ({
    page,
  }) => {
    await createTask(page, testTask);
    await planTaskForToday(page, testTask.name);

    // Verify task is in day plan
    const selectedTasks = page.getByTestId("selected-tasks");
    await expect(selectedTasks.getByText(testTask.name)).toBeVisible();

    // Click edit on the planned task
    await selectedTasks
      .getByRole("button", { name: "Edit task", exact: true })
      .click();

    // Edit modal should open
    const editModal = page.getByRole("dialog", { name: "Edit Task" });
    await expect(editModal).toBeVisible();

    // Add a description
    const newDescription = "This is a detailed description of the task.";
    await editModal.getByLabel("Description").fill(newDescription);
    await page.getByRole("button", { name: "Update Task" }).click();
    await expect(editModal).not.toBeVisible();

    // Verify description appears on card immediately
    await expect(selectedTasks.getByText(newDescription)).toBeVisible();

    // Reload page to verify persistence
    await page.reload();

    // Verify description persists
    await expect(page.getByTestId("selected-tasks")).toBeVisible();
    await expect(
      page.getByTestId("selected-tasks").getByText(newDescription),
    ).toBeVisible();
  });
});
