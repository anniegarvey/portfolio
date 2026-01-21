import { expect, type Locator, type Page, test } from "@playwright/test";

interface TaskData {
  name: string;
  physical: string;
  social: string;
  executive: string;
  startDifficulty: string;
  stopDifficulty: string;
  isRestorative: boolean;
}

const testTask: TaskData = {
  name: "Morning Exercise",
  physical: "30",
  social: "5",
  executive: "10",
  startDifficulty: "7",
  stopDifficulty: "3",
  isRestorative: true,
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
}

async function verifyTaskEnergyBadges(container: Locator, task: TaskData) {
  await expect(container.getByText(`${task.physical} P`)).toBeVisible();
  await expect(container.getByText(`${task.social} S`)).toBeVisible();
  await expect(container.getByText(`${task.executive} E`)).toBeVisible();
}

async function createTask(page: Page, task: TaskData) {
  await page.getByRole("button", { name: "New Task" }).click();
  const modal = page.getByRole("dialog", { name: "Create New Task" });
  await expect(modal).toBeVisible();
  await fillTaskForm(modal, task);
  await page.getByRole("button", { name: "Add Task" }).click();
  await expect(modal).not.toBeVisible();
}

async function planTaskForToday(page: Page, taskName: string) {
  await page.getByRole("button", { name: "Plan an available task" }).click();
  const modal = page.getByRole("dialog", { name: "Available Tasks" });
  await expect(modal.getByText(taskName)).toBeVisible();
  await modal.getByRole("button", { name: "Add to day", exact: true }).click();
  await expect(modal).not.toBeVisible();
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: E2E test suites require multiple test cases
test.describe("Energy Planner", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should allow creating a task and planning it for today", async ({
    page,
  }) => {
    await createTask(page, testTask);
    await planTaskForToday(page, testTask.name);

    await expect(page.getByText("Selected Tasks (1)")).toBeVisible();
    const selectedTasks = page.getByTestId("selected-tasks");
    await expect(selectedTasks.getByText(testTask.name)).toBeVisible();
    await verifyTaskEnergyBadges(selectedTasks, testTask);
  });

  test("should allow editing a task", async ({ page }) => {
    await createTask(page, testTask);

    // Open available tasks and click edit
    await page.getByRole("button", { name: "Plan an available task" }).click();
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

  test("should allow marking a task as complete", async ({ page }) => {
    await createTask(page, testTask);
    await planTaskForToday(page, testTask.name);

    // Mark task as complete
    const selectedTasks = page.getByTestId("selected-tasks");
    await selectedTasks
      .getByRole("button", { name: "Mark as done", exact: true })
      .click();

    // Task should now show as completed (button changes to "Mark as not done")
    await expect(
      selectedTasks.getByRole("button", {
        name: "Mark as not done",
        exact: true,
      }),
    ).toBeVisible();
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
    await expect(
      page.getByText("No tasks selected for this day."),
    ).toBeVisible();
  });

  test("should allow navigating between days", async ({ page }) => {
    // Verify "Today" indicator is visible
    await expect(page.getByText("Today", { exact: true })).toBeVisible();

    // Navigate to previous day
    await page.getByRole("button", { name: "Previous day" }).click();

    // "Today" should no longer be visible, "Go to Today" button should appear
    await expect(page.getByText("Today", { exact: true })).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Go to Today" }),
    ).toBeVisible();

    // Navigate back to today
    await page.getByRole("button", { name: "Go to Today" }).click();
    await expect(page.getByText("Today", { exact: true })).toBeVisible();

    // Navigate to next day
    await page.getByRole("button", { name: "Next day" }).click();
    await expect(page.getByText("Today", { exact: true })).not.toBeVisible();
  });

  test("should show energy usage summary when tasks are planned", async ({
    page,
  }) => {
    await createTask(page, testTask);
    await planTaskForToday(page, testTask.name);

    // Verify usage summary shows energy values
    const usageSummary = page.locator("text=Usage:");
    await expect(usageSummary).toBeVisible();
  });

  test("should allow setting daily energy capacity", async ({ page }) => {
    // The physical slider in Daily Energy Capacity section
    // Use first() since there may be multiple "Physical" labels in forms
    const physicalSlider = page.getByLabel("Physical").first();

    // Set slider value (range inputs accept string values)
    await physicalSlider.fill("50");

    // Verify the value is displayed in the capacity section
    await expect(page.getByText("50%").first()).toBeVisible();
  });

  // biome-ignore lint/complexity/noExcessiveLinesPerFunction: E2E test suites require multiple test cases
  test.describe("Uncompleted Tasks", () => {
    test.beforeEach(async ({ page }) => {
      // Create a task and plan it for yesterday
      await createTask(page, testTask);

      // Navigate to yesterday
      await page.getByRole("button", { name: "Previous day" }).click();

      // Plan the task for yesterday
      await planTaskForToday(page, testTask.name);

      // Return to today - task should appear as uncompleted
      await page.getByRole("button", { name: "Go to Today" }).click();
    });

    test("should show uncompleted tasks from previous days", async ({
      page,
    }) => {
      // Verify uncompleted section is visible
      await expect(page.getByText("Uncompleted Tasks (1)")).toBeVisible();
      const uncompletedSection = page.getByTestId("uncompleted-tasks");
      await expect(uncompletedSection.getByText(testTask.name)).toBeVisible();
    });

    test("should mark uncompleted task as complete", async ({ page }) => {
      const uncompletedSection = page.getByTestId("uncompleted-tasks");
      await expect(uncompletedSection.getByText(testTask.name)).toBeVisible();

      // Mark as complete
      await uncompletedSection
        .getByRole("button", { name: "Mark as complete", exact: true })
        .click();

      // Task should disappear from uncompleted section
      await expect(
        uncompletedSection.getByText(testTask.name),
      ).not.toBeVisible();
    });

    test("should move uncompleted task to today", async ({ page }) => {
      const uncompletedSection = page.getByTestId("uncompleted-tasks");
      await expect(uncompletedSection.getByText(testTask.name)).toBeVisible();

      // Move to today
      await uncompletedSection
        .getByRole("button", { name: "Move to today", exact: true })
        .click();

      // Task should disappear from uncompleted and appear in selected
      await expect(
        uncompletedSection.getByText(testTask.name),
      ).not.toBeVisible();
      await expect(
        page.getByTestId("selected-tasks").getByText(testTask.name),
      ).toBeVisible();
    });

    test("should return uncompleted task to unplanned", async ({ page }) => {
      const uncompletedSection = page.getByTestId("uncompleted-tasks");
      await expect(uncompletedSection.getByText(testTask.name)).toBeVisible();

      // Return to unplanned
      await uncompletedSection
        .getByRole("button", { name: "Return to unplanned", exact: true })
        .click();

      // Task should disappear from uncompleted section
      await expect(
        uncompletedSection.getByText(testTask.name),
      ).not.toBeVisible();

      // Verify task is now available (not planned anywhere)
      await page
        .getByRole("button", { name: "Plan an available task" })
        .click();
      const modal = page.getByRole("dialog", { name: "Available Tasks" });
      await expect(modal.getByText(testTask.name)).toBeVisible();
    });
  });
});
