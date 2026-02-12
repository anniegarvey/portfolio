import { expect, test } from "../../utils/accessibility-test";
import {
  createActivity,
  repeatingActivity,
} from "../../utils/activity-test-helpers";

test.describe("Repeating Activities - Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should manage repeating activities via Available Activities modal", async ({
    page,
    makeAxeBuilder,
  }) => {
    await createActivity(page, repeatingActivity);

    // Open Manage Activities
    await page.getByRole("button", { name: "Manage Activities" }).click();
    const modal = page.getByRole("dialog", { name: "Available Activities" });

    // Switch to Repeating Tab
    await modal.getByRole("button", { name: "Repeating Activities" }).click();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // Verify activity is listed
    await expect(modal.getByText(repeatingActivity.name)).toBeVisible();

    // Click Edit
    await modal.getByRole("button", { name: "Edit activity" }).click();
    const editModal = page.getByRole("dialog", { name: "Edit Activity" });
    await expect(editModal).toBeVisible();

    // Change frequency to 2 days
    await editModal.getByRole("spinbutton", { name: "Frequency" }).fill("2");
    await editModal.getByRole("button", { name: "Update Activity" }).click();

    // Verify update
    // Check Today (should still be there as it was due today)
    await page.getByRole("button", { name: "Close modal" }).click();
    await expect(page.getByTestId("selected-activities")).toBeVisible(); // Wait for main view

    // Navigating: Today = Instance. Next instance = Today + 2 days.
    // Today is visible.
    await expect(
      page.getByTestId("selected-activities").getByText(repeatingActivity.name),
    ).toBeVisible();

    // Tomorrow (Today+1) should NOT have it anymore
    await page.getByRole("button", { name: "Next day" }).click();
    await expect(
      page.getByTestId("selected-activities").getByText(repeatingActivity.name),
    ).not.toBeVisible();

    // Day after Tomorrow (Today+2) SHOULD have it
    await page.getByRole("button", { name: "Next day" }).click();
    await expect(
      page.getByTestId("selected-activities").getByText(repeatingActivity.name),
    ).toBeVisible();
  });
});
