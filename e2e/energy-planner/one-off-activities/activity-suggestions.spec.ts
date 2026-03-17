import type { Page } from "@playwright/test";
import type { Activity } from "@/lib/energy-planner/schema";
import { expect, test } from "../../utils/accessibility-test";
import {
  DEFAULT_CAPACITY,
  mockOneOffActivity,
  mockPlannedInstance,
  mockStoredDayPlan,
  TODAY,
} from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

const olderActivity: Activity = {
  id: "dddddddd-0000-0000-0000-000000000001",
  title: "Morning Exercise",
  energyCost: { physical: 10, social: 5, executive: 3 },
  factors: {
    initiationDifficulty: 1,
    terminationDifficulty: 1,
    isRestorative: false,
  },
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
};

const newerDuplicateActivity: Activity = {
  id: "eeeeeeee-0000-0000-0000-000000000001",
  title: "morning exercise",
  energyCost: { physical: 99, social: 88, executive: 77 },
  factors: {
    initiationDifficulty: 8,
    terminationDifficulty: 8,
    isRestorative: true,
  },
  createdAt: new Date("2025-06-01T00:00:00.000Z"),
};

async function openCreateModal(page: Page) {
  await page.getByRole("button", { name: "Manage Activities" }).click();
  await page.getByRole("button", { name: "New Activity" }).click();
  return page.getByRole("dialog", { name: "Create New Activity" });
}

test.describe("Activity Name Suggestions", () => {
  test("shows suggestions when typing matching text", async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });

    const modal = await openCreateModal(page);
    await modal.getByLabel("Activity Name").fill("Morning");

    await expect(modal.getByRole("listbox")).toBeVisible();
    await expect(
      modal.getByRole("option", { name: mockOneOffActivity.title }),
    ).toBeVisible();
  });

  test("matches case-insensitively", async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });

    const modal = await openCreateModal(page);
    await modal.getByLabel("Activity Name").fill("morning exercise");

    await expect(
      modal.getByRole("option", { name: mockOneOffActivity.title }),
    ).toBeVisible();
  });

  test("does not show suggestions when no activity matches", async ({
    page,
  }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });

    const modal = await openCreateModal(page);
    await modal.getByLabel("Activity Name").fill("Yoga");

    await expect(modal.getByRole("listbox")).not.toBeVisible();
  });

  test("clicking a suggestion populates all form fields", async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });

    const modal = await openCreateModal(page);
    await modal.getByLabel("Activity Name").fill("Morning");
    await modal.getByRole("option", { name: mockOneOffActivity.title }).click();

    await expect(modal.getByLabel("Activity Name")).toHaveValue(
      mockOneOffActivity.title,
    );
    await expect(modal.getByLabel("Physical")).toHaveValue(
      mockOneOffActivity.energyCost.physical.toString(),
    );
    await expect(modal.getByLabel("Social")).toHaveValue(
      mockOneOffActivity.energyCost.social.toString(),
    );
    await expect(modal.getByLabel("Executive")).toHaveValue(
      mockOneOffActivity.energyCost.executive.toString(),
    );
    await expect(modal.getByRole("listbox")).not.toBeVisible();
  });

  test("arrow key + Enter selects a suggestion and populates fields", async ({
    page,
  }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });

    const modal = await openCreateModal(page);
    const nameInput = modal.getByLabel("Activity Name");
    await nameInput.fill("Morning");
    await nameInput.press("ArrowDown");
    await nameInput.press("Enter");

    await expect(nameInput).toHaveValue(mockOneOffActivity.title);
    await expect(modal.getByLabel("Physical")).toHaveValue(
      mockOneOffActivity.energyCost.physical.toString(),
    );
    await expect(modal.getByRole("listbox")).not.toBeVisible();
  });

  test("Escape closes the suggestion dropdown without clearing the input", async ({
    page,
  }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });

    const modal = await openCreateModal(page);
    const nameInput = modal.getByLabel("Activity Name");
    await nameInput.fill("Morning");
    await expect(modal.getByRole("listbox")).toBeVisible();

    await nameInput.press("Escape");

    await expect(modal.getByRole("listbox")).not.toBeVisible();
    await expect(nameInput).toHaveValue("Morning");
  });

  test("deduplicates by name and uses data from the most recent activity", async ({
    page,
  }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [olderActivity, newerDuplicateActivity],
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });

    const modal = await openCreateModal(page);
    await modal.getByLabel("Activity Name").fill("morning");

    // Only one suggestion despite two activities sharing the same name
    await expect(modal.getByRole("option")).toHaveCount(1);

    // Selecting it should populate with the newer activity's data
    await modal.getByRole("option").click();
    await expect(modal.getByLabel("Physical")).toHaveValue(
      newerDuplicateActivity.energyCost.physical.toString(),
    );
    await expect(modal.getByLabel("Social")).toHaveValue(
      newerDuplicateActivity.energyCost.social.toString(),
    );
    await expect(modal.getByLabel("Executive")).toHaveValue(
      newerDuplicateActivity.energyCost.executive.toString(),
    );
  });

  test("does not show suggestions when editing an existing activity", async ({
    page,
  }) => {
    const instance = mockPlannedInstance(mockOneOffActivity.id);
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: { [TODAY]: mockStoredDayPlan([instance]) },
    });

    const selectedActivities = page.getByTestId("selected-activities");
    const card = selectedActivities
      .getByRole("article")
      .filter({ hasText: mockOneOffActivity.title });
    await card.getByText(mockOneOffActivity.title).click();

    const editModal = page.getByRole("dialog", { name: "Edit Activity" });
    await expect(editModal).toBeVisible();

    await editModal.getByLabel("Activity Name").fill("Morning");
    await expect(editModal.getByRole("listbox")).not.toBeVisible();
  });
});
