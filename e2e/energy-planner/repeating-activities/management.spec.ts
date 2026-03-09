import {
  expect,
  test,
  violationFingerprints,
} from "../../utils/accessibility-test";
import {
  mockPlannedInstance,
  mockRepeatingActivity,
  mockStoredDayPlan,
  TODAY,
} from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

const instance = mockPlannedInstance(mockRepeatingActivity.id);

test.describe("Repeating Activities - Management", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockRepeatingActivity],
      dayPlans: { [TODAY]: mockStoredDayPlan([instance]) },
    });
  });

  test("should manage repeating activities via Available Activities modal", async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.getByRole("button", { name: "Manage Activities" }).click();
    const modal = page.getByRole("dialog", { name: "Available Activities" });

    await modal.getByRole("button", { name: "Repeating Activities" }).click();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();

    await expect(modal.getByText(mockRepeatingActivity.title)).toBeVisible();

    await modal.getByText(mockRepeatingActivity.title).click();
    const editModal = page.getByRole("dialog", { name: "Edit Activity" });
    await expect(editModal).toBeVisible();

    // Change frequency to 2 days
    await editModal.getByRole("spinbutton", { name: "Frequency" }).fill("2");
    await editModal.getByRole("button", { name: "Update Activity" }).click();

    await page.getByRole("button", { name: "Close modal" }).click();
    await expect(page.getByTestId("selected-activities")).toBeVisible();

    // Today — still visible (instance was already concrete)
    await expect(
      page
        .getByTestId("selected-activities")
        .getByText(mockRepeatingActivity.title),
    ).toBeVisible();

    // Tomorrow (Today+1) should NOT have it
    await page.getByRole("button", { name: "Next day" }).click();
    await expect(
      page
        .getByTestId("selected-activities")
        .getByText(mockRepeatingActivity.title),
    ).not.toBeVisible();

    // Day after Tomorrow (Today+2) SHOULD have it
    await page.getByRole("button", { name: "Next day" }).click();
    await expect(
      page
        .getByTestId("selected-activities")
        .getByText(mockRepeatingActivity.title),
    ).toBeVisible();
  });
});
