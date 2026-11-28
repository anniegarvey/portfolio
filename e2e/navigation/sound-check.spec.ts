import { expect, test } from "../utils/accessibility-test";

test.describe("Sound check", () => {
  test("lists each group of game sounds and plays one on tap", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/sound-check");

    for (const group of [
      "Glade creatures",
      "Glade rewards",
      "Meadowmere farm",
      "Meadowmere village",
      "Points",
    ]) {
      await expect(page.getByRole("heading", { name: group })).toBeVisible();
    }

    await page.getByRole("button", { name: "Robin" }).click();
    await page.getByRole("button", { name: "Friendship level up" }).click();
    expect(errors).toEqual([]);
  });

  test("meets accessibility standards", async ({ page, makeAxeBuilder }) => {
    await page.goto("/sound-check");
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
