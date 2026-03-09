import {
  expect,
  test,
  violationFingerprints,
} from "../../utils/accessibility-test";
import {
  mockOneOffActivity,
  mockStoredDayPlan,
  TODAY,
} from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

test.describe("One-off Activities - Delete", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: { [TODAY]: mockStoredDayPlan([]) },
    });
  });

  test("should allow deleting a one-off activity", async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.getByRole("button", { name: "Manage Activities" }).click();
    const modal = page.getByRole("dialog", { name: "Available Activities" });
    await expect(modal).toBeVisible();
    await expect(modal.getByText(mockOneOffActivity.title)).toBeVisible();

    await modal.getByLabel("Delete activity").click();

    const confirmModal = page.getByRole("dialog", { name: "Delete Activity?" });
    await expect(confirmModal).toBeVisible();
    await expect(
      confirmModal.getByText("Are you sure you want to delete"),
    ).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();

    await confirmModal.getByRole("button", { name: "Delete" }).click();
    await expect(confirmModal).not.toBeVisible();

    await expect(modal.getByText(mockOneOffActivity.title)).not.toBeVisible();
  });
});
