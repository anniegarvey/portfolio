import { expect, test } from "@playwright/test";

test.describe("Navigation - Days", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should allow navigating between days", async ({ page }) => {
    // Verify "Today" indicator is visible
    await expect(page.getByText("Today", { exact: true })).toBeVisible();

    // Navigate to previous day
    await page.getByRole("button", { name: "Previous day" }).click();

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
