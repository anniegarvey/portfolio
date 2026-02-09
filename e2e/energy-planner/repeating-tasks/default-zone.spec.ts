import { expect, test } from "../../utils/accessibility-test";
import { fillTaskForm, repeatingTask } from "../../utils/task-test-helpers";

test.describe("Repeating Tasks - Default Zone", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should create a repeating task with default zone and project it correctly", async ({
    page,
  }) => {
    const taskName = "Evening Routine";
    const task = { ...repeatingTask, name: taskName };

    // 1. Open task creation
    await page.getByRole("button", { name: "Manage Tasks" }).click();
    await page.getByRole("button", { name: "New Task" }).click();
    const createModal = page.getByRole("dialog", { name: "Create New Task" });

    // 2. Fill form
    await fillTaskForm(createModal, task);

    // 3. Select Default Zone "Evening"
    await expect(createModal.getByLabel("Default Zone")).toBeVisible();
    await createModal.getByLabel("Default Zone").click();
    await page.getByRole("option", { name: "Evening" }).click();

    // 4. Submit
    await page.getByRole("button", { name: "Add Task" }).click();
    await expect(createModal).not.toBeVisible();

    // Close "Available Tasks" modal
    await page.getByRole("button", { name: "Close modal" }).click();

    // 5. Verify the task is automatically projected into the "Evening" zone
    const eveningZone = page.getByTestId("zone-evening");
    await expect(eveningZone.getByText(taskName)).toBeVisible();

    // Verify it is NOT in Morning or Afternoon
    const morningZone = page.getByTestId("zone-morning");
    await expect(morningZone.getByText(taskName)).not.toBeVisible();
    const afternoonZone = page.getByTestId("zone-afternoon");
    await expect(afternoonZone.getByText(taskName)).not.toBeVisible();
  });
});
