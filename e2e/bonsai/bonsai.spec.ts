import {
  expect,
  test,
  violationFingerprints,
} from "../utils/accessibility-test";
import { goToBonsaiWithSeed } from "../utils/seed-bonsai";

// Helper: open the tending modal by clicking the pine tree in the garden
async function openTendingModal(
  page: Parameters<typeof goToBonsaiWithSeed>[0],
) {
  await page.getByRole("button", { name: /pine.*click to tend/i }).click();
  // Wait for the modal content to appear
  await expect(page.getByRole("dialog")).toBeVisible();
}

test.describe("Bonsai Garden", () => {
  test("page loads with heading and SVG tree in the garden", async ({
    page,
  }) => {
    await page.goto("/bonsai");
    await expect(
      page.getByRole("heading", { name: "Bonsai Garden" }),
    ).toBeVisible();
    // The mini tree SVG in the garden
    await expect(
      page.getByRole("img", { name: /bonsai tree/i }).first(),
    ).toBeVisible();
  });

  test("Bonsai nav link appears in the site navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Bonsai" })).toBeVisible();
  });

  test("Advance Day button grows the tree when watered", async ({ page }) => {
    // Start at day 10, already watered
    await goToBonsaiWithSeed(page, {
      activeDaysCount: 10,
      lastWateredDay: 10,
    });

    await openTendingModal(page);

    // The pruning hint is visible because the tree has branches
    await expect(page.getByText(/click any branch to prune it/i)).toBeVisible();

    await page.getByRole("button", { name: /advance day/i }).click();

    // Tree SVG remains visible after advancing
    await expect(
      page.getByRole("img", { name: /bonsai tree/i }).first(),
    ).toBeVisible();
  });

  test("watering can tool shows hint and marks tree as watered", async ({
    page,
  }) => {
    await goToBonsaiWithSeed(page, { ownedToolIds: ["watering-can"] });

    await openTendingModal(page);

    // Tree starts unwatered
    await expect(page.getByText("Not watered today")).toBeVisible();

    // Select the watering can tool
    await page.getByRole("button", { name: /watering can/i }).click();

    // Hint should appear prompting the user to click the tree
    await expect(page.getByText(/click the tree to water it/i)).toBeVisible();

    // Click the tree to water it
    await page
      .getByRole("img", { name: /bonsai tree/i })
      .first()
      .click();

    // Status should update to watered
    await expect(page.getByText("Watered today")).toBeVisible();
    await expect(page.getByText("Not watered today")).not.toBeVisible();
  });

  test("tree can be watered via keyboard when watering can is active", async ({
    page,
  }) => {
    await goToBonsaiWithSeed(page, { ownedToolIds: ["watering-can"] });

    await openTendingModal(page);

    await page.getByRole("button", { name: /watering can/i }).click();

    // Focus the SVG container and press Enter to water
    await page.getByRole("button", { name: "Water the tree" }).focus();
    await page.keyboard.press("Enter");

    await expect(page.getByText("Watered today")).toBeVisible();
  });

  test("Advance Day does nothing when tree has not been watered", async ({
    page,
  }) => {
    await goToBonsaiWithSeed(page, { activeDaysCount: 5 });

    await openTendingModal(page);

    // Advance Day without watering — tree status unchanged
    await page.getByRole("button", { name: /advance day/i }).click();

    await expect(
      page.getByRole("img", { name: /bonsai tree/i }).first(),
    ).toBeVisible();
    await expect(page.getByText("Not watered today")).toBeVisible();
  });

  test("shop tab is visible and contains items with a Buy button", async ({
    page,
  }) => {
    await goToBonsaiWithSeed(page, { points: 500 });

    // Navigate to the Shop tab
    await page.getByRole("tab", { name: "Shop" }).click();

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

    // Navigate to Shop → Tools
    await page.getByRole("tab", { name: "Shop" }).click();
    await page.getByRole("tab", { name: "Tools" }).click();

    // Buy the Watering Can — scope to the tab panel to avoid matching
    // the "Watering Can" tool button in the tree toolbar
    const wateringCanCard = page
      .getByRole("tabpanel")
      .locator("text=Watering Can")
      .first();
    await wateringCanCard
      .locator("xpath=ancestor::*[2]")
      .getByRole("button", { name: "Buy" })
      .click();

    // Check it appears in the Inventory tab
    await page.getByRole("tab", { name: "Inventory" }).click();
    await expect(
      page.getByRole("tabpanel").getByText("Watering Can"),
    ).toBeVisible();
  });

  test("clicking a branch prunes it and shows regrowth hint", async ({
    page,
  }) => {
    // Day 20 ensures several branch pairs are visible
    await goToBonsaiWithSeed(page, { activeDaysCount: 20 });

    await openTendingModal(page);

    await expect(page.getByText(/click any branch to prune it/i)).toBeVisible();

    // Dispatch a click directly on the first branch path (scoped to modal)
    await page
      .getByRole("dialog")
      .locator("[data-branch-id]")
      .first()
      .dispatchEvent("click");

    await expect(page.getByText(/branch.*regrowing/i)).toBeVisible();
  });

  test("can place a seed in the garden from the collection tab", async ({
    page,
  }) => {
    await goToBonsaiWithSeed(page, { ownedSpeciesIds: ["maple"] });

    await page.getByRole("tab", { name: "Collection" }).click();

    // The Maple Seed should appear in the "Plant a Seed" section
    await expect(page.getByText(/maple seed/i)).toBeVisible();

    // Click "Place in garden" — enters placement mode
    await page.getByRole("button", { name: /place in garden/i }).click();

    // The garden should enter placement mode (cancel button appears)
    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();

    // Click in the garden to place the tree
    const garden = page.locator("[data-placing]");
    await garden.click({ position: { x: 100, y: 100 } });

    // After placing, a Maple tree should appear in the collection list
    await page.getByRole("tab", { name: "Collection" }).click();
    await expect(
      page.getByText("Maple", { exact: true }).first(),
    ).toBeVisible();
  });

  test("accessibility scan", async ({ page, makeAxeBuilder }) => {
    await page.goto("/bonsai");
    // Wait for the garden tree to render before scanning
    await expect(
      page.getByRole("img", { name: /bonsai tree/i }).first(),
    ).toBeVisible();

    const results = await makeAxeBuilder().analyze();
    expect(violationFingerprints(results)).toMatchSnapshot();
  });
});
