import { expect, test } from "../../utils/accessibility-test";
import { createTask, repeatingTask } from "../../utils/task-test-helpers";

test.describe("Repeating Tasks - Deletion", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should allow deleting a repeating task", async ({
    page,
    makeAxeBuilder,
  }) => {
    await createTask(page, repeatingTask);

    // Open Manage Tasks
    await page.getByRole("button", { name: "Manage Tasks" }).click();
    const modal = page.getByRole("dialog", { name: "Available Tasks" });
    await expect(modal).toBeVisible();

    // Switch to Repeating Tasks tab
    await modal.getByRole("button", { name: "Repeating Tasks" }).click();

    // Find and click delete
    await modal.getByLabel("Delete task").click();

    // Verify confirmation modal
    const confirmModal = page.getByRole("dialog", { name: "Delete Task?" });
    await expect(confirmModal).toBeVisible();
    await expect(
      confirmModal.getByText("Are you sure you want to delete"),
    ).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // Confirm delete
    await confirmModal.getByRole("button", { name: "Delete" }).click();
    await expect(confirmModal).not.toBeVisible();

    // Verify removed from list
    await expect(modal.getByText(repeatingTask.name)).not.toBeVisible();

    // Close modal and verify removed from day plan (since it was projected)
    await page.getByRole("button", { name: "Close modal" }).click();
    await expect(
      page.getByTestId("selected-tasks").getByText(repeatingTask.name),
    ).not.toBeVisible();
  });
});
