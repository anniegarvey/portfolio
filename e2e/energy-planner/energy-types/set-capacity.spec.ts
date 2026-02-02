import { expect, test } from "@playwright/test";

test.describe("Energy Types - Set Capacity", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should allow setting daily energy capacity", async ({ page }) => {
    // The physical slider in Daily Energy Capacity section
    // Use first() since there may be multiple "Physical" labels in forms
    const physicalSlider = page.getByLabel("Physical").first();

    // Set slider value (range inputs accept string values)
    await physicalSlider.fill("50");

    // Verify the value is displayed in the capacity section
    await expect(page.getByText("50%").first()).toBeVisible();
  });
});
