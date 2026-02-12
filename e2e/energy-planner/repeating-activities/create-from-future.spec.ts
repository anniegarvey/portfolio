import { expect, test } from "../../utils/accessibility-test";
import {
  fillActivityForm,
  repeatingActivity,
} from "../../utils/activity-test-helpers";

test.describe("Repeating Activities - Create From Future", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should start repeating activity on selected date when created from future date", async ({
    page,
    makeAxeBuilder,
  }) => {
    // Navigate to next day
    await page.getByRole("button", { name: "Next day" }).click();

    const firstZone = page
      .getByTestId("selected-activities")
      .locator("> div")
      .first(); // First child is first zone usually
    const addBtn = firstZone.getByRole("button", { name: "Add Activity" });
    await addBtn.click();

    const availableModal = page.getByRole("dialog", {
      name: "Available Activities",
    });
    await expect(availableModal).toBeVisible();

    await page.getByRole("button", { name: "New Activity" }).click();
    const createModal = page.getByRole("dialog", {
      name: "Create New Activity",
    });
    await expect(createModal).toBeVisible();

    await fillActivityForm(createModal, {
      ...repeatingActivity,
      name: "Future Repeated Activity",
    });
    await page.getByRole("button", { name: "Add Activity" }).click();
    await page.getByRole("button", { name: "Close modal" }).click();

    // Should be visible on THIS future day
    await expect(
      page
        .getByTestId("selected-activities")
        .getByText("Future Repeated Activity"),
    ).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // Verify it is NOT on Today
    await page.getByRole("button", { name: "Previous day" }).click();
    await expect(
      page
        .getByTestId("selected-activities")
        .getByText("Future Repeated Activity"),
    ).not.toBeVisible();
  });
});
