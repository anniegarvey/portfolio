import { expect, test } from "../../utils/accessibility-test";
import {
  createActivity,
  repeatingActivity,
} from "../../utils/activity-test-helpers";

test.describe("Repeating Activities - Deletion", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should allow deleting a repeating activity", async ({
    page,
    makeAxeBuilder,
  }) => {
    await createActivity(page, repeatingActivity);

    // Open Manage Activities
    await page.getByRole("button", { name: "Manage Activities" }).click();
    const modal = page.getByRole("dialog", { name: "Available Activities" });
    await expect(modal).toBeVisible();

    // Switch to Repeating Activities tab
    await modal.getByRole("button", { name: "Repeating Activities" }).click();

    // Find and click delete
    await modal.getByLabel("Delete activity").click();

    // Verify confirmation modal
    const confirmModal = page.getByRole("dialog", { name: "Delete Activity?" });
    await expect(confirmModal).toBeVisible();
    await expect(
      confirmModal.getByText("Are you sure you want to delete"),
    ).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // Confirm delete
    await confirmModal.getByRole("button", { name: "Delete" }).click();
    await expect(confirmModal).not.toBeVisible();

    // Verify removed from list
    await expect(modal.getByText(repeatingActivity.name)).not.toBeVisible();

    // Close modal and verify removed from day plan (since it was projected)
    await page.getByRole("button", { name: "Close modal" }).click();
    await expect(
      page.getByTestId("selected-activities").getByText(repeatingActivity.name),
    ).not.toBeVisible();
  });
});
