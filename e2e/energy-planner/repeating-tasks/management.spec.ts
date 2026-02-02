import { expect, test } from "../../utils/accessibility-test";
import { createTask, repeatingTask } from "../../utils/task-test-helpers";

test.describe("Repeating Tasks - Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should manage repeating tasks via Available Tasks modal", async ({
    page,
    makeAxeBuilder,
  }) => {
    await createTask(page, repeatingTask);

    // Open Manage Tasks
    await page.getByRole("button", { name: "Manage Tasks" }).click();
    const modal = page.getByRole("dialog", { name: "Available Tasks" });

    // Switch to Repeating Tab
    await modal.getByRole("button", { name: "Repeating Tasks" }).click();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // Verify task is listed
    await expect(modal.getByText(repeatingTask.name)).toBeVisible();

    // Click Edit
    await modal.getByRole("button", { name: "Edit task" }).click();
    const editModal = page.getByRole("dialog", { name: "Edit Task" });
    await expect(editModal).toBeVisible();

    // Change frequency to 2 days
    await editModal.getByRole("spinbutton", { name: "Frequency" }).fill("2");
    await editModal.getByRole("button", { name: "Update Task" }).click();

    // Verify update
    // Check Today (should still be there as it was due today)
    await page.getByRole("button", { name: "Close modal" }).click();
    await expect(page.getByTestId("selected-tasks")).toBeVisible(); // Wait for main view

    // Navigating: Today = Instance. Next instance = Today + 2 days.
    // Today is visible.
    await expect(
      page.getByTestId("selected-tasks").getByText(repeatingTask.name),
    ).toBeVisible();

    // Tomorrow (Today+1) should NOT have it anymore
    await page.getByRole("button", { name: "Next day" }).click();
    await expect(
      page.getByTestId("selected-tasks").getByText(repeatingTask.name),
    ).not.toBeVisible();

    // Day after Tomorrow (Today+2) SHOULD have it
    await page.getByRole("button", { name: "Next day" }).click();
    await expect(
      page.getByTestId("selected-tasks").getByText(repeatingTask.name),
    ).toBeVisible();
  });
});
