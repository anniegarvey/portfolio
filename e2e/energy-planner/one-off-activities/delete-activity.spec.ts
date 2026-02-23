import {
  expect,
  test,
  violationFingerprints,
} from "../../utils/accessibility-test";
import {
  createActivity,
  goToEnergyPlanner,
  testActivity,
} from "../../utils/activity-test-helpers";

test.describe("One-off Activities - Delete", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlanner(page, {});
  });

  test("should allow deleting a one-off activity", async ({
    page,
    makeAxeBuilder,
  }) => {
    await createActivity(page, testActivity);

    // One-off activities are in "Available Activities" modal
    await page.getByRole("button", { name: "Manage Activities" }).click();
    const modal = page.getByRole("dialog", { name: "Available Activities" });
    await expect(modal).toBeVisible();

    // Find the delete button for the created activity
    await modal.getByLabel("Delete activity").click();

    // Verify confirmation modal
    const confirmModal = page.getByRole("dialog", { name: "Delete Activity?" });
    await expect(confirmModal).toBeVisible();
    await expect(
      confirmModal.getByText("Are you sure you want to delete"),
    ).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();

    // Confirm delete
    await confirmModal.getByRole("button", { name: "Delete" }).click();
    await expect(confirmModal).not.toBeVisible();

    // Verify activity is removed from list
    await expect(modal.getByText(testActivity.name)).not.toBeVisible();
  });
});
