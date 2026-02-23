import type AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page } from "@playwright/test";

export interface ActivityData {
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

export async function goToEnergyPlanner(
  page: Page,
  {
    physical = "49",
    social = "50",
    executive = "51",
  }: { physical?: string; social?: string; executive?: string },
) {
  await page.goto("/energy-planner");
  const modal = page.getByRole("dialog", { name: "Daily Energy Capacity" });

  // Wait a short moment for the modal to potentially appear
  try {
    await modal.waitFor({ state: "visible", timeout: 2000 });

    const physicalSlider = page.getByRole("slider", { name: "Physical" });
    await physicalSlider.fill(physical);

    const socialSlider = page.getByRole("slider", { name: "Social" });
    await socialSlider.fill(social);

    const executiveSlider = page.getByRole("slider", { name: "Executive" });
    await executiveSlider.fill(executive);

    await page.getByRole("button", { name: "Save" }).click();
    await modal.waitFor({ state: "hidden", timeout: 2000 });
  } catch {
    // Modal didn't appear, that's fine
  }
}

export const testActivity: ActivityData = {
  name: "Morning Exercise",
  physical: "30",
  social: "5",
  executive: "10",
  startDifficulty: "7",
  stopDifficulty: "3",
  isRestorative: true,
};

export const repeatingActivity: ActivityData = {
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

export async function fillActivityForm(modal: Locator, activity: ActivityData) {
  await modal.getByLabel("Activity Name").fill(activity.name);
  await modal.getByLabel("Physical").fill(activity.physical);
  await modal.getByLabel("Social").fill(activity.social);
  await modal.getByLabel("Executive").fill(activity.executive);
  await modal
    .getByLabel("Start Difficulty (0-10)")
    .fill(activity.startDifficulty);
  await modal
    .getByLabel("Stop Difficulty (0-10)")
    .fill(activity.stopDifficulty);

  if (activity.isRestorative) {
    await modal.getByLabel("Restorative?").check();
  }

  if (activity.repeatConfig) {
    await modal.getByText("Repeat this activity").click();

    await modal
      .getByLabel("Frequency")
      .fill(activity.repeatConfig.frequency.toString());

    // Radix UI Select interaction
    await modal.getByRole("combobox", { name: "Repeat Unit" }).click();

    // Options render in a portal (at root), so we search on the page, not scoped to modal
    // However, we need 'page' access if we want to search root.
    // The 'modal' locator usually has a .page() method.
    const unitText =
      activity.repeatConfig.unit.charAt(0).toUpperCase() +
      activity.repeatConfig.unit.slice(1);

    await modal.page().getByRole("option", { name: unitText }).click();
  }
}

export async function verifyActivityEnergyBadges(
  container: Locator,
  activity: ActivityData,
) {
  await expect(container.getByText(`${activity.physical} P`)).toBeVisible();
  await expect(container.getByText(`${activity.social} S`)).toBeVisible();
  await expect(container.getByText(`${activity.executive} E`)).toBeVisible();
}

export async function createActivity(
  page: Page,
  activity: ActivityData,
  makeAxeBuilder?: () => AxeBuilder,
) {
  await page.getByRole("button", { name: "Manage Activities" }).click();
  const availableModal = page.getByRole("dialog", {
    name: "Available Activities",
  });
  await expect(availableModal).toBeVisible();

  await page.getByRole("button", { name: "New Activity" }).click();
  const createModal = page.getByRole("dialog", {
    name: "Create New Activity",
  });
  await expect(createModal).toBeVisible();

  await fillActivityForm(createModal, activity);

  if (makeAxeBuilder) {
    const firstAccessibilityScanResults = await makeAxeBuilder().analyze();
    expect(firstAccessibilityScanResults.violations).toEqual([]);
  }

  await page.getByRole("button", { name: "Add Activity" }).click();
  await expect(createModal).not.toBeVisible();

  // Close the Available Activities modal if still open
  await page.getByRole("button", { name: "Close modal" }).click();
}

export async function planActivityForToday(page: Page, activityName: string) {
  await page.getByRole("button", { name: "Manage Activities" }).click();
  const modal = page.getByRole("dialog", { name: "Available Activities" });

  // Sometimes creating an activity might leave it selected or something, but generally we find it in the list.
  // One-off activities are in the default view.
  await expect(modal.getByText(activityName)).toBeVisible();
  await modal.getByRole("button", { name: "Add to day", exact: true }).click();
  await expect(modal).not.toBeVisible();
}
