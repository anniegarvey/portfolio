import { expect, test } from "@playwright/test";
import {
  createTask,
  planTaskForToday,
  testTask,
} from "../../utils/task-test-helpers";

test.describe("Energy Types - Stats", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should show energy usage summary when tasks are planned", async ({
    page,
  }) => {
    await createTask(page, testTask);
    await planTaskForToday(page, testTask.name);

    // Verify usage summary shows energy values
    const usageSummary = page.locator("text=Usage:");
    await expect(usageSummary).toBeVisible();
  });
});
