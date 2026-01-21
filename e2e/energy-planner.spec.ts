import { expect, type Locator, test } from "@playwright/test";

interface TaskData {
  name: string;
  physical: string;
  social: string;
  executive: string;
  startDifficulty: string;
  stopDifficulty: string;
  isRestorative: boolean;
}

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

test.describe("Energy Planner", () => {
  const testTask: TaskData = {
    name: "Morning Exercise",
    physical: "30",
    social: "5",
    executive: "10",
    startDifficulty: "7",
    stopDifficulty: "3",
    isRestorative: true,
  };

  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should allow creating a task and planning it for today", async ({
    page,
  }) => {
    // Create the task
    await page.getByRole("button", { name: "New Task" }).click();
    const taskModal = page.getByRole("dialog", { name: "Create New Task" });
    await expect(taskModal).toBeVisible();
    await fillTaskForm(taskModal, testTask);
    await page.getByRole("button", { name: "Add Task" }).click();
    await expect(taskModal).not.toBeVisible();

    // Plan the task for today
    await page.getByRole("button", { name: "Plan an available task" }).click();
    const availableModal = page.getByRole("dialog", {
      name: "Available Tasks",
    });
    await expect(availableModal.getByText(testTask.name)).toBeVisible();
    await verifyTaskEnergyBadges(availableModal, testTask);
    await availableModal
      .getByRole("button", { name: "Add to day", exact: true })
      .click();

    // Verify task in day plan
    await expect(availableModal).not.toBeVisible();
    await expect(page.getByText("Selected Tasks (1)")).toBeVisible();
    const selectedTasks = page.getByTestId("selected-tasks");
    await expect(selectedTasks.getByText(testTask.name)).toBeVisible();
    await verifyTaskEnergyBadges(selectedTasks, testTask);
  });
});
