import { expect, test } from "@playwright/test";
import {
  mockOneOffActivity,
  mockPlannedInstance,
  mockStoredDayPlan,
  TODAY,
} from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

const activity = {
  ...mockOneOffActivity,
  description: "Supercalifragilisticexpialidociousandthensomemoreletters",
};
const instance = mockPlannedInstance(activity.id);

test.describe("One-off Activities - Long Description", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("keeps action buttons on screen when the description is one long word", async ({
    page,
  }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [activity],
      dayPlans: { [TODAY]: mockStoredDayPlan([instance]) },
    });

    const card = page
      .getByTestId("selected-activities")
      .getByRole("article")
      .filter({ hasText: activity.title });
    const moveButton = card.getByRole("button", { name: "Move activity" });
    await expect(moveButton).toBeVisible();

    const box = await moveButton.boundingBox();
    expect((box?.x ?? Infinity) + (box?.width ?? 0)).toBeLessThanOrEqual(375);
  });
});
