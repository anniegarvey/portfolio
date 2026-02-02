import {
  expect,
  test,
  violationFingerprints,
} from "../../utils/accessibility-test";
import { createTask, testTask } from "../../utils/task-test-helpers";

test.describe("One-off Tasks - Delete", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should allow deleting a one-off task", async ({
    page,
    makeAxeBuilder,
  }) => {
    await createTask(page, testTask);

    // One-off tasks are in "Available Tasks" modal
    await page.getByRole("button", { name: "Manage Tasks" }).click();
    const modal = page.getByRole("dialog", { name: "Available Tasks" });
    await expect(modal).toBeVisible();

    // Find the delete button for the created task
    await modal.getByLabel("Delete task").click();

    // Verify confirmation modal
    const confirmModal = page.getByRole("dialog", { name: "Delete Task?" });
    await expect(confirmModal).toBeVisible();
    await expect(
      confirmModal.getByText("Are you sure you want to delete"),
    ).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();

    // Confirm delete
    await confirmModal.getByRole("button", { name: "Delete" }).click();
    await expect(confirmModal).not.toBeVisible();

    // Verify task is removed from list
    await expect(modal.getByText(testTask.name)).not.toBeVisible();
  });
});
