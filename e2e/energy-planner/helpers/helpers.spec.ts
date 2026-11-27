import { expect, test } from "../../utils/accessibility-test";
import {
  fillActivityForm,
  testActivity,
} from "../../utils/activity-test-helpers";
import { DEFAULT_CAPACITY, TODAY } from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

test.describe("Activity helpers", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });
  });

  test("chosen helpers show on the day plan and are offered next time", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: /Add activity to/i })
      .first()
      .click();
    const availableModal = page.getByRole("dialog", {
      name: "Available Activities",
    });
    await availableModal.getByRole("button", { name: "New Activity" }).click();
    const createModal = page.getByRole("dialog", {
      name: "Create New Activity",
    });
    await fillActivityForm(createModal, testActivity);

    await createModal
      .getByRole("button", { name: /What would help you start\?/ })
      .click();
    const menu = page.getByRole("menu");
    await menu.getByRole("menuitemcheckbox", { name: "Audiobook" }).click();
    await menu.getByRole("menuitemcheckbox", { name: "Coffee" }).click();
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
    // Escape closes only the menu, not the form
    await expect(createModal).toBeVisible();

    await createModal.getByLabel("Add your own helper").fill("Podcast");
    await createModal.getByRole("button", { name: "Add", exact: true }).click();
    await expect(
      createModal.getByRole("button", { name: /What would help you start\?/ }),
    ).toContainText("Audiobook, Coffee, Podcast");

    await page.getByRole("button", { name: "Add Activity" }).click();
    await expect(createModal).not.toBeVisible();

    const card = page
      .getByTestId("selected-activities")
      .getByRole("article")
      .filter({ hasText: testActivity.name });
    await expect(card).toContainText("Helpers:AudiobookCoffeePodcast");

    // A helper you added yourself becomes one of the options
    await page.getByRole("button", { name: "Manage Activities" }).click();
    await page
      .getByRole("dialog", { name: "Available Activities" })
      .getByRole("button", { name: "New Activity" })
      .click();
    await page
      .getByRole("dialog", { name: "Create New Activity" })
      .getByRole("button", { name: /What would help you start\?/ })
      .click();
    await expect(
      page.getByRole("menu").getByRole("menuitemcheckbox", { name: "Podcast" }),
    ).toBeVisible();
  });
});
