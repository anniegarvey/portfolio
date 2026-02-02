import type AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page } from "@playwright/test";

export interface TaskData {
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

export const testTask: TaskData = {
  name: "Morning Exercise",
  physical: "30",
  social: "5",
  executive: "10",
  startDifficulty: "7",
  stopDifficulty: "3",
  isRestorative: true,
};

export const repeatingTask: TaskData = {
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

export async function fillTaskForm(modal: Locator, task: TaskData) {
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

    await modal
      .getByLabel("Frequency")
      .fill(task.repeatConfig.frequency.toString());

    // Radix UI Select interaction
    await modal.getByRole("combobox", { name: "Repeat Unit" }).click();

    // Options render in a portal (at root), so we search on the page, not scoped to modal
    // However, we need 'page' access if we want to search root.
    // The 'modal' locator usually has a .page() method.
    const unitText =
      task.repeatConfig.unit.charAt(0).toUpperCase() +
      task.repeatConfig.unit.slice(1);

    await modal.page().getByRole("option", { name: unitText }).click();
  }
}

export async function verifyTaskEnergyBadges(
  container: Locator,
  task: TaskData,
) {
  await expect(container.getByText(`${task.physical} P`)).toBeVisible();
  await expect(container.getByText(`${task.social} S`)).toBeVisible();
  await expect(container.getByText(`${task.executive} E`)).toBeVisible();
}

export async function createTask(
  page: Page,
  task: TaskData,
  makeAxeBuilder?: () => AxeBuilder,
) {
  await page.getByRole("button", { name: "Manage Tasks" }).click();
  const availableModal = page.getByRole("dialog", { name: "Available Tasks" });
  await expect(availableModal).toBeVisible();

  await page.getByRole("button", { name: "New Task" }).click();
  const createModal = page.getByRole("dialog", { name: "Create New Task" });
  await expect(createModal).toBeVisible();

  await fillTaskForm(createModal, task);

  if (makeAxeBuilder) {
    const firstAccessibilityScanResults = await makeAxeBuilder().analyze();
    expect(firstAccessibilityScanResults.violations).toEqual([]);
  }

  await page.getByRole("button", { name: "Add Task" }).click();
  await expect(createModal).not.toBeVisible();

  // Close the Available Tasks modal if still open
  await page.getByRole("button", { name: "Close modal" }).click();
}

export async function planTaskForToday(page: Page, taskName: string) {
  await page.getByRole("button", { name: "Manage Tasks" }).click();
  const modal = page.getByRole("dialog", { name: "Available Tasks" });

  // Sometimes creating a task might leave it selected or something, but generally we find it in the list.
  // One-off tasks are in the default view.
  await expect(modal.getByText(taskName)).toBeVisible();
  await modal.getByRole("button", { name: "Add to day", exact: true }).click();
  await expect(modal).not.toBeVisible();
}
