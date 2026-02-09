import { expect, test } from "../../utils/accessibility-test";
import { fillTaskForm, testTask } from "../../utils/task-test-helpers";

test.describe("One-off Tasks - Default Zone", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should use default zone when adding to plan", async ({ page }) => {
    // 1. Create a task with a default zone
    await page.getByRole("button", { name: "Manage Tasks" }).click();
    await page.getByRole("button", { name: "New Task" }).click();
    const createModal = page.getByRole("dialog", { name: "Create New Task" });

    // Unique task name to avoid locator ambiguity
    const taskName = "Yoga Session";
    const task = { ...testTask, name: taskName };

    // Fill basic fields
    await fillTaskForm(createModal, task);

    // Select Default Zone "Afternoon"
    // The label is "Default Zone"
    // We need to click the trigger associated with it.
    // Since Select in Radix is complex, we might target the trigger directly.
    // Current helper fillTaskForm doesn't handle this, so we do it manually.

    // Wait for animation
    await expect(createModal.getByLabel("Default Zone")).toBeVisible();

    // Click the select trigger (it behaves like a button or combobox)
    // The SelectTrigger has id=`${formId}-defaultZoneId` and the label points to it.
    // So getByLabel("Default Zone") should target the button.
    await createModal.getByLabel("Default Zone").click();

    // Select "Afternoon" from the options
    await page.getByRole("option", { name: "Afternoon" }).click();

    // Submit
    await page.getByRole("button", { name: "Add Task" }).click();
    await expect(createModal).not.toBeVisible();

    // 2. Add the task to the day plan
    // We are still in "Available Tasks" modal
    const availableModal = page.getByRole("dialog", {
      name: "Available Tasks",
    });
    await expect(availableModal.getByText(taskName)).toBeVisible();

    await availableModal
      .getByRole("article")
      .filter({ hasText: taskName })
      .getByRole("button", { name: "Add to day" })
      .click();

    // Verify modal closes
    await expect(availableModal).not.toBeVisible();

    // 3. Verify the task is in the "Afternoon" zone
    const afternoonZone = page.getByTestId("zone-afternoon");
    await expect(afternoonZone.getByText(taskName)).toBeVisible();

    // Verify it is NOT in Morning
    const morningZone = page.getByTestId("zone-morning");
    await expect(morningZone.getByText(taskName)).not.toBeVisible();
  });
});
