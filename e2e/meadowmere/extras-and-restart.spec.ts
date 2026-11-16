import { expect, test } from "@playwright/test";
import { goToMeadowmereWithSeed } from "../utils/seed-meadowmere";

const QUESTS_DONE = [
  "a-bed-for-parsnips",
  "down-to-the-riverbank",
  "clay-for-the-kiln",
];

test.describe("Meadowmere extras and restarts", () => {
  test("another forage trip can be bought once the day's are spent", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page, { foragesToday: 3, points: 50 });

    await page
      .getByRole("button", { name: "Buy another forage trip for 20 points" })
      .click();

    await expect(page.getByText("1 forage trips left")).toBeVisible();
    await expect(page.locator("[data-points-display]:visible")).toContainText(
      "30",
    );
  });

  test("the restart panel says what a restart is worth", async ({ page }) => {
    await goToMeadowmereWithSeed(page, { completedQuestIds: QUESTS_DONE });

    await expect(
      page.getByRole("heading", { name: "Start afresh" }),
    ).toBeVisible();
    await expect(page.getByText(/Complete 10 more quests/)).toBeVisible();
  });
});
