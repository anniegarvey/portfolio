import {
  expect,
  test,
  violationFingerprints,
} from "../../utils/accessibility-test";
import { DEFAULT_CAPACITY, TODAY } from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

test.describe("Energy Types - Set Capacity", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });
  });

  test("should allow setting daily energy capacity", async ({
    page,
    makeAxeBuilder,
  }) => {
    // Open the capacity modal
    await page.getByRole("button", { name: "Edit Capacity" }).click();

    // The physical slider in Daily Energy Capacity section
    // Use first() since there may be multiple "Physical" labels in forms
    const physicalSlider = page.getByLabel("Physical").first();

    // Set slider value (range inputs accept string values)
    await physicalSlider.fill("50");

    // Verify the value is displayed in the capacity section
    await expect(page.getByText("50%").first()).toBeVisible();

    // Close the modal
    await page.getByRole("button", { name: "Save" }).click();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();
  });
});
