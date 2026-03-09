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
} from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

const instance = mockPlannedInstance(mockOneOffActivity.id);

test.describe("One-off Activities - Edit Description", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockOneOffActivity],
      dayPlans: {
        [TODAY]: mockStoredDayPlan([instance]),
      },
    });
  });

  test("should allow editing an activity's description while in the day plan", async ({
    page,
    makeAxeBuilder,
  }) => {
    const selectedActivities = page.getByTestId("selected-activities");
    await expect(
      selectedActivities.getByText(mockOneOffActivity.title),
    ).toBeVisible();

    const card = selectedActivities
      .getByRole("article")
      .filter({ hasText: mockOneOffActivity.title });
    await card.getByText(mockOneOffActivity.title).click();

    const editModal = page.getByRole("dialog", { name: "Edit Activity" });
    await expect(editModal).toBeVisible();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();

    const newDescription = "This is a detailed description of the activity.";
    await editModal.getByLabel("Description").fill(newDescription);
    await page.getByRole("button", { name: "Update Activity" }).click();
    await expect(editModal).not.toBeVisible();

    await expect(selectedActivities.getByText(newDescription)).toBeVisible();

    await page.reload();

    await expect(page.getByTestId("selected-activities")).toBeVisible();
    await expect(
      page.getByTestId("selected-activities").getByText(newDescription),
    ).toBeVisible();
  });
});
