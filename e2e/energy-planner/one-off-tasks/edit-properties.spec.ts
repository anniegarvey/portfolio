import { expect, test } from "@playwright/test";
import { createTask, testTask } from "../../utils/task-test-helpers";

test.describe("One-off Tasks - Edit Properties", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should allow editing a task", async ({ page }) => {
    await createTask(page, testTask);

    // Open available tasks and click edit
    await page.getByRole("button", { name: "Manage Tasks" }).click();
    const modal = page.getByRole("dialog", { name: "Available Tasks" });
    await modal.getByRole("button", { name: "Edit task", exact: true }).click();

    // Edit modal should open
    const editModal = page.getByRole("dialog", { name: "Edit Task" });
    await expect(editModal).toBeVisible();

    // Change the task name
    await editModal.getByLabel("Task Name").fill("Updated Task Name");
    await page.getByRole("button", { name: "Update Task" }).click();
    await expect(editModal).not.toBeVisible();

    // Verify updated name appears
    await expect(page.getByText("Updated Task Name")).toBeVisible();
  });
});
