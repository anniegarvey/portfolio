import { expect, test } from "@playwright/test";

test.describe("Energy Planner", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should allow creating a task and planning it for today", async ({
    page,
  }) => {
    // Open the "New Task" modal
    await page.getByRole("button", { name: "New Task" }).click();

    // Wait for modal to appear and fill task name
    const taskNameInput = page.getByLabel("Task Name");
    await expect(taskNameInput).toBeVisible();
    await taskNameInput.fill("Test Task");

    // Submit the form
    await page.getByRole("button", { name: "Add Task" }).click();

    // Open the "Available Tasks" modal to plan the task
    await page.getByRole("button", { name: "Plan an available task" }).click();

    // Verify the task appears in the available tasks list
    const availableModal = page.getByRole("dialog", {
      name: "Available Tasks",
    });
    await expect(availableModal).toBeVisible();
    await expect(availableModal.getByText("Test Task")).toBeVisible();

    // Add the task to today's plan
    await availableModal
      .getByRole("button", { name: "Add to day", exact: true })
      .click();

    // Verify modal closes and task appears in the day plan
    await expect(availableModal).not.toBeVisible();
    await expect(page.getByText("Selected Tasks (1)")).toBeVisible();
    await expect(
      page.getByTestId("selected-tasks").getByText("Test Task"),
    ).toBeVisible();
  });
});
