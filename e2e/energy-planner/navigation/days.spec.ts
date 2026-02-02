import { expect, test } from "../../utils/accessibility-test";

test.describe("Navigation - Days", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should allow navigating between days", async ({
    page,
    makeAxeBuilder,
  }) => {
    // Verify "Today" indicator is visible
    await expect(page.getByText("Today", { exact: true })).toBeVisible();

    // Navigate to previous day
    await page.getByRole("button", { name: "Previous day" }).click();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // "Today" should no longer be visible, "Go to Today" button should appear
    await expect(page.getByText("Today", { exact: true })).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Go to Today" }),
    ).toBeVisible();

    // Navigate back to today
    await page.getByRole("button", { name: "Go to Today" }).click();
    await expect(page.getByText("Today", { exact: true })).toBeVisible();

    // Navigate to next day
    await page.getByRole("button", { name: "Next day" }).click();
    await expect(page.getByText("Today", { exact: true })).not.toBeVisible();
  });
});
