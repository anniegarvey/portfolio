import { expect, test } from "@playwright/test";
import { createTask, repeatingTask } from "../../utils/task-test-helpers";

test.describe("Repeating Tasks - Create", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should create a repeating task and project it on today", async ({
    page,
  }) => {
    await createTask(page, repeatingTask);

    // It should appear in Selected Tasks automatically (projected)
    await expect(
      page.getByTestId("selected-tasks").getByText(repeatingTask.name),
    ).toBeVisible();

    // Verify Repeat Icon is present (title="Repeating Task")
    await expect(page.locator("div[title='Repeating Task']")).toBeVisible();
  });
});
