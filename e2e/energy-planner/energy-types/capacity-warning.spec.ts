import { expect, test } from "../../utils/accessibility-test";
import {
  createTask,
  planTaskForToday,
  type TaskData,
  testTask,
} from "../../utils/task-test-helpers";

test.describe("Energy Types - Capacity Warning", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should show warning when energy capacity is exceeded", async ({
    page,
    makeAxeBuilder,
  }) => {
    // 1. Create a task with high energy cost
    const highEnergyTask: TaskData = {
      ...testTask,
      name: "High Energy Task",
      physical: "20",
    };
    await createTask(page, highEnergyTask);

    // 2. Set daily capacity lower than task cost
    // The physical slider is the first one
    const physicalSlider = page.getByLabel("Physical").first();
    await physicalSlider.fill("10");

    // 3. Plan the task for today
    await planTaskForToday(page, highEnergyTask.name);

    // 4. Verify warning appears
    await expect(
      page.getByText(
        "Warning: You have exceeded your Physical energy capacity!",
      ),
    ).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
