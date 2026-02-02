import { expect, test } from "../../utils/accessibility-test";
import {
  createTask,
  planTaskForToday,
  testTask,
} from "../../utils/task-test-helpers";

test.describe("Uncompleted Tasks Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
    // Create a task and plan it for yesterday
    await createTask(page, testTask);

    // Navigate to yesterday
    await page
      .getByRole("button", {
        name: "Previous day",
      })
      .click();

    // Plan the task for yesterday
    await planTaskForToday(page, testTask.name);

    // Return to today - task should appear as uncompleted
    await page
      .getByRole("button", {
        name: "Go to Today",
      })
      .click();
  });

  test("should show uncompleted tasks from previous days", async ({
    page,
    makeAxeBuilder,
  }) => {
    // Verify uncompleted section is visible
    await expect(page.getByText("Uncompleted Tasks (1)")).toBeVisible();
    const uncompletedSection = page.getByTestId("uncompleted-tasks");
    await expect(uncompletedSection.getByText(testTask.name)).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should mark uncompleted task as complete", async ({ page }) => {
    const uncompletedSection = page.getByTestId("uncompleted-tasks");
    await expect(uncompletedSection.getByText(testTask.name)).toBeVisible();

    // Mark as complete
    await uncompletedSection
      .getByRole("button", {
        name: "Mark as complete",
        exact: true,
      })
      .click();

    // Task should disappear from uncompleted section
    await expect(uncompletedSection.getByText(testTask.name)).not.toBeVisible();
  });

  test("should move uncompleted task to today", async ({ page }) => {
    const uncompletedSection = page.getByTestId("uncompleted-tasks");
    await expect(uncompletedSection.getByText(testTask.name)).toBeVisible();

    // Move to today
    await uncompletedSection
      .getByRole("button", {
        name: "Move to today",
        exact: true,
      })
      .click();

    // Task should disappear from uncompleted and appear in selected
    await expect(uncompletedSection.getByText(testTask.name)).not.toBeVisible();
    await expect(
      page.getByTestId("selected-tasks").getByText(testTask.name),
    ).toBeVisible();
  });

  test("should return uncompleted task to unplanned", async ({ page }) => {
    const uncompletedSection = page.getByTestId("uncompleted-tasks");
    await expect(uncompletedSection.getByText(testTask.name)).toBeVisible();

    // Return to unplanned
    await uncompletedSection
      .getByRole("button", {
        name: "Return to unplanned",
        exact: true,
      })
      .click();

    // Task should disappear from uncompleted section
    await expect(uncompletedSection.getByText(testTask.name)).not.toBeVisible();

    // Verify task is now available (not planned anywhere)
    await page
      .getByRole("button", {
        name: "Manage Tasks",
      })
      .click();
    const modal = page.getByRole("dialog", {
      name: "Available Tasks",
    });
    await expect(modal.getByText(testTask.name)).toBeVisible();
  });
});
