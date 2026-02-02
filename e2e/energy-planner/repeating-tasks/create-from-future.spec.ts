import { expect, test } from "../../utils/accessibility-test";
import { fillTaskForm, repeatingTask } from "../../utils/task-test-helpers";

test.describe("Repeating Tasks - Create From Future", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should start repeating task on selected date when created from future date", async ({
    page,
    makeAxeBuilder,
  }) => {
    // Navigate to next day
    await page.getByRole("button", { name: "Next day" }).click();

    const firstZone = page
      .getByTestId("selected-tasks")
      .locator("> div")
      .first(); // First child is first zone usually
    const addBtn = firstZone.getByRole("button", { name: "Add Task" });
    await addBtn.click();

    const availableModal = page.getByRole("dialog", {
      name: "Available Tasks",
    });
    await expect(availableModal).toBeVisible();

    await page.getByRole("button", { name: "New Task" }).click();
    const createModal = page.getByRole("dialog", { name: "Create New Task" });
    await expect(createModal).toBeVisible();

    await fillTaskForm(createModal, {
      ...repeatingTask,
      name: "Future Repeated Task",
    });
    await page.getByRole("button", { name: "Add Task" }).click();
    await page.getByRole("button", { name: "Close modal" }).click();

    // Should be visible on THIS future day
    await expect(
      page.getByTestId("selected-tasks").getByText("Future Repeated Task"),
    ).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // Verify it is NOT on Today
    await page.getByRole("button", { name: "Previous day" }).click();
    await expect(
      page.getByTestId("selected-tasks").getByText("Future Repeated Task"),
    ).not.toBeVisible();
  });
});
