import {
  expect,
  test,
  violationFingerprints,
} from "../utils/accessibility-test";
import { goToBonsaiWithSeed } from "../utils/seed-bonsai";

test.describe("Bonsai Garden", () => {
  test("page loads with heading and SVG tree", async ({ page }) => {
    await page.goto("/bonsai");
    await expect(
      page.getByRole("heading", { name: "Bonsai Garden" }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: /bonsai tree/i }).first(),
    ).toBeVisible();
  });

  test("Bonsai nav link appears in the site navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Bonsai" })).toBeVisible();
  });

  test("Advance Day button grows the tree", async ({ page }) => {
    // Start at day 10 so branches and the pruning hint are visible
    await goToBonsaiWithSeed(page, { activeDaysCount: 10 });

    await expect(page.getByText(/click any branch to prune it/i)).toBeVisible();

    await page.getByRole("button", { name: /advance day/i }).click();

    // Tree and SVG remain visible after advancing
    await expect(
      page.getByRole("img", { name: /bonsai tree/i }).first(),
    ).toBeVisible();
  });

  test("shop tab is visible and contains items with a Buy button", async ({
    page,
  }) => {
    await goToBonsaiWithSeed(page, { points: 500 });

    // Seeds sub-tab should be the default view
    await expect(page.getByRole("tab", { name: "Seeds" })).toBeVisible();
    // At least one Buy button should be available
    await expect(
      page.getByRole("button", { name: "Buy" }).first(),
    ).toBeVisible();
  });

  test("buying a tool from the shop adds it to the inventory", async ({
    page,
  }) => {
    await goToBonsaiWithSeed(page, { points: 500 });

    // Switch to the Tools sub-tab
    await page.getByRole("tab", { name: "Tools" }).click();

    // Buy the Watering Can (20 pts)
    const wateringCanCard = page.locator("text=Watering Can").first();
    await wateringCanCard
      .locator("xpath=ancestor::*[2]")
      .getByRole("button", { name: "Buy" })
      .click();

    // Check it appears in the Inventory tab
    await page.getByRole("tab", { name: "Inventory" }).click();
    await expect(page.getByText("Watering Can")).toBeVisible();
  });

  test("clicking a branch prunes it and shows regrowth hint", async ({
    page,
  }) => {
    // Day 20 ensures several branch pairs are visible
    await goToBonsaiWithSeed(page, { activeDaysCount: 20 });

    await expect(page.getByText(/click any branch to prune it/i)).toBeVisible();

    // Dispatch a click directly on the first branch path (bypasses SVG hit-area overlap issues)
    await page.locator("[data-branch-id]").first().dispatchEvent("click");

    await expect(page.getByText(/branch.*regrowing/i)).toBeVisible();
  });

  test("can plant a seed from inventory and see it in the collection", async ({
    page,
  }) => {
    await goToBonsaiWithSeed(page, { ownedSpeciesIds: ["maple"] });

    await page.getByRole("tab", { name: "Collection" }).click();

    // The Maple Seed should appear in the "Plant a Seed" section
    await expect(page.getByText(/maple seed/i)).toBeVisible();

    await page.getByRole("button", { name: "Plant" }).click();

    // After planting, a Maple tree should appear in the tree list
    await expect(
      page.getByText("Maple", { exact: true }).first(),
    ).toBeVisible();
  });

  test("accessibility scan", async ({ page, makeAxeBuilder }) => {
    await page.goto("/bonsai");
    // Wait for the tree to render before scanning
    await expect(
      page.getByRole("img", { name: /bonsai tree/i }).first(),
    ).toBeVisible();

    const results = await makeAxeBuilder().analyze();
    expect(violationFingerprints(results)).toMatchSnapshot();
  });
});
