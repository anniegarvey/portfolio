import { expect, test } from "@playwright/test";
import { createTask, repeatingTask } from "../../utils/task-test-helpers";

test.describe("Repeating Tasks - Future Projection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should project repeating task on future dates", async ({ page }) => {
    await createTask(page, repeatingTask);

    // Check Today
    await expect(
      page.getByTestId("selected-tasks").getByText(repeatingTask.name),
    ).toBeVisible();

    // Navigate to Tomorrow
    await page.getByRole("button", { name: "Next day" }).click();

    // Should be visible on Tomorrow (Daily task)
    await expect(
      page.getByTestId("selected-tasks").getByText(repeatingTask.name),
    ).toBeVisible();
  });
});
