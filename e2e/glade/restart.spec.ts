import { expect, test } from "@playwright/test";
import { goToGladeWithSeed } from "../utils/seed-glade";

// Eleven residents: every common and four uncommons.
const RESIDENTS = [
  "robin",
  "rabbit",
  "squirrel",
  "hedgehog",
  "mouse",
  "wren",
  "mole",
  "fox",
  "deer",
  "owl",
  "badger",
].map((speciesId, i) => ({ speciesId, x: 10 + i * 7, y: 70 }));

test.describe("Glade restarts", () => {
  test("restarting trades the residents for a points multiplier", async ({
    page,
  }) => {
    await goToGladeWithSeed(page, { residents: RESIDENTS });

    await page.getByRole("button", { name: "Restart the glade…" }).click();
    const dialog = page.getByRole("dialog");
    // Seven commons at 3% and four uncommons at 5%.
    await expect(dialog).toContainText("from ×1 to ×1.41");
    await dialog.getByRole("button", { name: "Restart the glade" }).click();

    await expect(page.getByText(/worth ×1.41 right now/)).toBeVisible();
    await expect(page.locator("[data-points-display]:visible")).toContainText(
      "×1.41",
    );
    await expect(page.getByText(/Tame 11 more creatures/)).toBeVisible();
  });
});
