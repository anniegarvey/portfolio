import {
  expect,
  test,
  violationFingerprints,
} from "../../utils/accessibility-test";
import {
  createActivity,
  goToEnergyPlanner,
  planActivityForToday,
  testActivity,
} from "../../utils/activity-test-helpers";

test.describe("Uncompleted Activities Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlanner(page, {});
    // Create an activity and plan it for yesterday
    await createActivity(page, testActivity);

    // Navigate to yesterday
    await page
      .getByRole("button", {
        name: "Previous day",
      })
      .click();

    // Plan the activity for yesterday
    await planActivityForToday(page, testActivity.name);

    // Return to today - activity should appear as uncompleted
    await page
      .getByRole("button", {
        name: "Go to Today",
      })
      .click();
  });

  test("should show uncompleted activities from previous days", async ({
    page,
    makeAxeBuilder,
  }) => {
    // Verify uncompleted section is visible
    await expect(page.getByText("Uncompleted Activities (1)")).toBeVisible();
    const uncompletedSection = page.getByTestId("uncompleted-activities");
    await expect(uncompletedSection.getByText(testActivity.name)).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();
  });

  test("should mark uncompleted activity as complete", async ({ page }) => {
    const uncompletedSection = page.getByTestId("uncompleted-activities");
    await expect(uncompletedSection.getByText(testActivity.name)).toBeVisible();

    // Mark as complete
    await uncompletedSection
      .getByRole("button", {
        name: "Mark as complete",
        exact: true,
      })
      .click();

    // Activity should disappear from uncompleted section
    await expect(
      uncompletedSection.getByText(testActivity.name),
    ).not.toBeVisible();
  });

  test("should move uncompleted activity to today", async ({ page }) => {
    const uncompletedSection = page.getByTestId("uncompleted-activities");
    await expect(uncompletedSection.getByText(testActivity.name)).toBeVisible();

    // Move to today
    await uncompletedSection
      .getByRole("button", {
        name: "Move to today",
        exact: true,
      })
      .click();

    // Activity should disappear from uncompleted and appear in selected
    await expect(
      uncompletedSection.getByText(testActivity.name),
    ).not.toBeVisible();
    await expect(
      page.getByTestId("selected-activities").getByText(testActivity.name),
    ).toBeVisible();
  });

  test("should return uncompleted activity to unplanned", async ({ page }) => {
    const uncompletedSection = page.getByTestId("uncompleted-activities");
    await expect(uncompletedSection.getByText(testActivity.name)).toBeVisible();

    // Return to unplanned
    await uncompletedSection
      .getByRole("button", {
        name: "Return to unplanned",
        exact: true,
      })
      .click();

    // Activity should disappear from uncompleted section
    await expect(
      uncompletedSection.getByText(testActivity.name),
    ).not.toBeVisible();

    // Verify activity is now available (not planned anywhere)
    await page
      .getByRole("button", {
        name: "Manage Activities",
      })
      .click();
    const modal = page.getByRole("dialog", {
      name: "Available Activities",
    });
    await expect(modal.getByText(testActivity.name)).toBeVisible();
  });
});
