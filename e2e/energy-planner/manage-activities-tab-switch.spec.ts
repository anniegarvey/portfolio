import { expect, test } from "../utils/accessibility-test";
import {
  fillActivityForm,
  repeatingActivity,
  testActivity,
} from "../utils/activity-test-helpers";
import { DEFAULT_CAPACITY, mockOneOffActivity, TODAY } from "../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../utils/seed-storage";

test.describe("Manage Activities modal - tab auto-switch after creation", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });
  });

  test("should stay on one-off tab after creating a one-off activity", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Manage Activities" }).click();
    const availableModal = page.getByRole("dialog", {
      name: "Available Activities",
    });
    await expect(availableModal).toBeVisible();

    // Switch to repeating tab first to prove the tab switches back
    await availableModal
      .getByRole("button", { name: "Repeating Activities" })
      .click();
    await expect(
      availableModal.getByText(/No repeating activities/i),
    ).toBeVisible();

    // Create a one-off activity
    await availableModal.getByRole("button", { name: "New Activity" }).click();
    const createModal = page.getByRole("dialog", {
      name: "Create New Activity",
    });
    await expect(createModal).toBeVisible();
    await fillActivityForm(createModal, testActivity);
    await page.getByRole("button", { name: "Add Activity" }).click();
    await expect(createModal).not.toBeVisible();

    // Should have switched to one-off tab — new activity visible, repeating empty state gone
    await expect(availableModal.getByText(testActivity.name)).toBeVisible();
    await expect(
      availableModal.getByText(/No repeating activities/i),
    ).not.toBeVisible();
  });

  test("should switch to repeating tab after creating a repeating activity", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Manage Activities" }).click();
    const availableModal = page.getByRole("dialog", {
      name: "Available Activities",
    });
    await expect(availableModal).toBeVisible();

    // We start on one-off tab
    await expect(
      availableModal.getByText(/No one-off activities/i),
    ).toBeVisible();

    // Create a repeating activity
    await availableModal.getByRole("button", { name: "New Activity" }).click();
    const createModal = page.getByRole("dialog", {
      name: "Create New Activity",
    });
    await expect(createModal).toBeVisible();
    await fillActivityForm(createModal, repeatingActivity);
    await page.getByRole("button", { name: "Add Activity" }).click();
    await expect(createModal).not.toBeVisible();

    // Should have switched to repeating tab — new activity visible, one-off empty state gone
    await expect(
      availableModal.getByText(repeatingActivity.name),
    ).toBeVisible();
    await expect(
      availableModal.getByText(/No one-off activities/i),
    ).not.toBeVisible();
  });
});

test.describe("Manage Activities modal - newest one-off at top", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });
  });

  test("should show the newest one-off activity at the top of the list", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Manage Activities" }).click();
    const availableModal = page.getByRole("dialog", {
      name: "Available Activities",
    });
    await expect(availableModal).toBeVisible();
    await expect(
      availableModal.getByText(mockOneOffActivity.title),
    ).toBeVisible();

    // Create a new one-off activity
    const newActivity = { ...testActivity, name: "Brand New Activity" };
    await availableModal.getByRole("button", { name: "New Activity" }).click();
    const createModal = page.getByRole("dialog", {
      name: "Create New Activity",
    });
    await expect(createModal).toBeVisible();
    await fillActivityForm(createModal, newActivity);
    await page.getByRole("button", { name: "Add Activity" }).click();
    await expect(createModal).not.toBeVisible();

    // Both activities should be visible on the one-off tab
    await expect(availableModal.getByText(newActivity.name)).toBeVisible();
    await expect(
      availableModal.getByText(mockOneOffActivity.title),
    ).toBeVisible();

    // The newly created activity should appear above the older seeded one
    const newBounds = await availableModal
      .getByText(newActivity.name)
      .boundingBox();
    const oldBounds = await availableModal
      .getByText(mockOneOffActivity.title)
      .boundingBox();
    expect(newBounds?.y).toBeLessThan(oldBounds?.y ?? Number.POSITIVE_INFINITY);
  });
});
