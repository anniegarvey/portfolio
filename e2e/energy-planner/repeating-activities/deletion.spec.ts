import {
  expect,
  test,
  violationFingerprints,
} from "../../utils/accessibility-test";
import {
  mockRepeatingActivity,
  mockStoredDayPlan,
  TODAY,
} from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

test.describe("Repeating Activities - Deletion", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockRepeatingActivity],
      dayPlans: { [TODAY]: mockStoredDayPlan([]) },
    });
  });

  test("should allow deleting a repeating activity", async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.getByRole("button", { name: "Manage Activities" }).click();
    const modal = page.getByRole("dialog", { name: "Available Activities" });
    await expect(modal).toBeVisible();

    await modal.getByRole("button", { name: "Repeating Activities" }).click();
    await expect(modal.getByText(mockRepeatingActivity.title)).toBeVisible();

    await modal.getByLabel("Delete activity").click();

    const confirmModal = page.getByRole("dialog", { name: "Delete Activity?" });
    await expect(confirmModal).toBeVisible();
    await expect(
      confirmModal.getByText("Are you sure you want to delete"),
    ).toBeVisible();

    await page.waitForTimeout(350); // wait for modal animation to settle
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();

    await confirmModal.getByRole("button", { name: "Delete" }).click();
    await expect(confirmModal).not.toBeVisible();

    await expect(
      modal.getByText(mockRepeatingActivity.title),
    ).not.toBeVisible();

    await page.getByRole("button", { name: "Close modal" }).click();
    await expect(
      page
        .getByTestId("selected-activities")
        .getByText(mockRepeatingActivity.title),
    ).not.toBeVisible();
  });
});
