import {
  expect,
  test,
  violationFingerprints,
} from "../../utils/accessibility-test";
import {
  mockOneOffActivity,
  mockPlannedInstance,
  mockStoredDayPlan,
  TODAY,
  YESTERDAY,
} from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

// Seed: activity was planned yesterday but left uncompleted
const yesterdayInstance = mockPlannedInstance(mockOneOffActivity.id);

test.describe("Uncompleted Activities Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: {
        [TODAY]: mockStoredDayPlan([]),
        [YESTERDAY]: mockStoredDayPlan([yesterdayInstance]),
      },
    });
  });

  test("should show uncompleted activities from previous days", async ({
    page,
    makeAxeBuilder,
  }) => {
    await expect(page.getByText("Uncompleted Activities (1)")).toBeVisible();
    const uncompletedSection = page.getByTestId("uncompleted-activities");
    await expect(
      uncompletedSection.getByText(mockOneOffActivity.title),
    ).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();
  });

  test("should mark uncompleted activity as complete", async ({ page }) => {
    const uncompletedSection = page.getByTestId("uncompleted-activities");
    await expect(
      uncompletedSection.getByText(mockOneOffActivity.title),
    ).toBeVisible();

    await uncompletedSection
      .getByRole("button", { name: "Mark as complete", exact: true })
      .click();

    await expect(
      uncompletedSection.getByText(mockOneOffActivity.title),
    ).not.toBeVisible();
  });

  test("should move uncompleted activity to today", async ({ page }) => {
    const uncompletedSection = page.getByTestId("uncompleted-activities");
    await expect(
      uncompletedSection.getByText(mockOneOffActivity.title),
    ).toBeVisible();

    await uncompletedSection
      .getByRole("button", { name: "Move to today", exact: true })
      .click();

    await expect(
      uncompletedSection.getByText(mockOneOffActivity.title),
    ).not.toBeVisible();
    await expect(
      page
        .getByTestId("selected-activities")
        .getByText(mockOneOffActivity.title),
    ).toBeVisible();
  });

  test("should return uncompleted activity to unplanned", async ({ page }) => {
    const uncompletedSection = page.getByTestId("uncompleted-activities");
    await expect(
      uncompletedSection.getByText(mockOneOffActivity.title),
    ).toBeVisible();

    await uncompletedSection
      .getByRole("button", { name: "Return to unplanned", exact: true })
      .click();

    await expect(
      uncompletedSection.getByText(mockOneOffActivity.title),
    ).not.toBeVisible();

    await page.getByRole("button", { name: "Manage Activities" }).click();
    const modal = page.getByRole("dialog", { name: "Available Activities" });
    await expect(modal.getByText(mockOneOffActivity.title)).toBeVisible();
  });
});
