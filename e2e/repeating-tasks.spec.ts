import { expect, type Locator, type Page, test } from "@playwright/test";

interface TaskData {
  name: string;
  physical: string;
  social: string;
  executive: string;
  startDifficulty: string;
  stopDifficulty: string;
  isRestorative: boolean;
  repeatConfig?: {
    frequency: number;
    unit: string;
  };
}

const repeatingTask: TaskData = {
  name: "Daily Yoga",
  physical: "20",
  social: "0",
  executive: "5",
  startDifficulty: "3",
  stopDifficulty: "1",
  isRestorative: true,
  repeatConfig: {
    frequency: 1,
    unit: "days",
  },
};

async function fillTaskForm(modal: Locator, task: TaskData) {
  await modal.getByLabel("Task Name").fill(task.name);
  await modal.getByLabel("Physical").fill(task.physical);
  await modal.getByLabel("Social").fill(task.social);
  await modal.getByLabel("Executive").fill(task.executive);
  await modal.getByLabel("Start Difficulty (1-10)").fill(task.startDifficulty);
  await modal.getByLabel("Stop Difficulty (1-10)").fill(task.stopDifficulty);
  if (task.isRestorative) {
    await modal.getByLabel("Restorative?").check();
  }

  if (task.repeatConfig) {
    await modal.getByText("Repeat this task").click();
    // Wait for fields to appear? They appear conditionally.
    // Assuming they appear immediately.
    // Unit uses select.
    await modal
      .getByLabel("Frequency")
      .fill(task.repeatConfig.frequency.toString());

    // Radix UI Select interaction
    await modal.getByRole("combobox", { name: "Repeat Unit" }).click();
    // Options render in a portal (at root), so we search on the page, not scoped to modal
    const unitText =
      task.repeatConfig.unit.charAt(0).toUpperCase() +
      task.repeatConfig.unit.slice(1);
    await modal.page().getByRole("option", { name: unitText }).click();
  }
}

async function createRepeatingTask(page: Page, task: TaskData) {
  await page.getByRole("button", { name: "Manage Tasks" }).click();
  const availableModal = page.getByRole("dialog", { name: "Available Tasks" });
  await expect(availableModal).toBeVisible();
  await page.getByRole("button", { name: "New Task" }).click();
  const createModal = page.getByRole("dialog", { name: "Create New Task" });
  await expect(createModal).toBeVisible();
  await fillTaskForm(createModal, task);
  await page.getByRole("button", { name: "Add Task" }).click();
  await expect(createModal).not.toBeVisible();
  // Close the Available Tasks modal if still open
  await page.getByRole("button", { name: "Close modal" }).click();
}

test.describe("Repeating Tasks", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should create a repeating task and project it on today", async ({
    page,
  }) => {
    await createRepeatingTask(page, repeatingTask);

    // It should appear in Selected Tasks automatically (projected)
    // Projected tasks might have a special style, but we just check visibility text first
    await expect(
      page.getByTestId("selected-tasks").getByText(repeatingTask.name),
    ).toBeVisible();

    // Verify Repeat Icon is present (title="Repeating Task")
    await expect(page.locator("div[title='Repeating Task']")).toBeVisible();
  });

  test("should project repeating task on future dates", async ({ page }) => {
    await createRepeatingTask(page, repeatingTask);

    // Check Today
    await expect(
      page.getByTestId("selected-tasks").getByText(repeatingTask.name),
    ).toBeVisible();

    // Navigate to Tomorrow
    await page.getByRole("button", { name: "Next day" }).click();

    // Should be visible on Tomorrow (Daily task)
    await expect(
      page.getByTestId("selected-tasks").getByText(repeatingTask.name),
    ).toBeVisible();
  });

  test("should instantiate task when completed and update schedule", async ({
    page,
  }) => {
    await createRepeatingTask(page, repeatingTask);

    const selectedTasks = page.getByTestId("selected-tasks");
    const taskItem = selectedTasks
      .filter({ hasText: repeatingTask.name })
      .first();
    await expect(taskItem).toBeVisible();

    // Check if it is projected? (Visual check hard in E2E without robust selectors)
    // But we check behavior.

    // Complete it
    await taskItem.getByRole("button", { name: "Mark as done" }).click();

    // Verify it is now completed
    await expect(
      taskItem.getByRole("button", { name: "Mark as not done" }),
    ).toBeVisible();

    // Navigate to Tomorrow. It should still be there (next instance).
    await page.getByRole("button", { name: "Next day" }).click();
    const tomorrowTask = page
      .getByTestId("selected-tasks")
      .filter({ hasText: repeatingTask.name })
      .first();
    await expect(tomorrowTask).toBeVisible();
    // Verify tomorrow's task is NOT completed
    await expect(
      tomorrowTask.getByRole("button", { name: "Mark as done" }),
    ).toBeVisible();
  });

  test("should manage repeating tasks via Available Tasks modal", async ({
    page,
  }) => {
    await createRepeatingTask(page, repeatingTask);

    // Open Manage Tasks
    await page.getByRole("button", { name: "Manage Tasks" }).click();
    const modal = page.getByRole("dialog", { name: "Available Tasks" });

    // Switch to Repeating Tab
    await modal.getByRole("button", { name: "Repeating Tasks" }).click();

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

  test("should start repeating task on selected date when created from future date", async ({
    page,
  }) => {
    // Navigate to next day
    await page.getByRole("button", { name: "Next day" }).click();

    const firstZone = page
      .getByTestId("selected-tasks")
      .locator("> div")
      .first(); // First child is first zone usually
    const addBtn = firstZone.getByRole("button", { name: "Add Task" });
    await addBtn.click();

    const availableModal = page.getByRole("dialog", {
      name: "Available Tasks",
    });
    await expect(availableModal).toBeVisible();

    await page.getByRole("button", { name: "New Task" }).click();
    const createModal = page.getByRole("dialog", { name: "Create New Task" });
    await expect(createModal).toBeVisible();

    await fillTaskForm(createModal, {
      ...repeatingTask,
      name: "Future Repeated Task",
    });
    await page.getByRole("button", { name: "Add Task" }).click();
    await page.getByRole("button", { name: "Close modal" }).click();

    // Should be visible on THIS future day
    await expect(
      page.getByTestId("selected-tasks").getByText("Future Repeated Task"),
    ).toBeVisible();

    // Verify it is NOT on Today
    await page.getByRole("button", { name: "Previous day" }).click();
    await expect(
      page.getByTestId("selected-tasks").getByText("Future Repeated Task"),
    ).not.toBeVisible();
  });
});
