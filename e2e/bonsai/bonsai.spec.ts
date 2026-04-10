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
    await expect(
      page.getByRole("link", { name: "Bonsai", exact: true }),
    ).toBeVisible();
  });

  test("D key advances day when tree is watered", async ({ page }) => {
    // Start at day 10, already watered
    await goToBonsaiWithSeed(page, {
      activeDaysCount: 10,
      lastWateredDay: 10,
    });

    // Press D from the garden — tree should grow to day 11
    await page.keyboard.press("d");

    await expect(
      page.getByRole("img", { name: /bonsai tree, day 11/i }).first(),
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

  test("garden water tool waters a tree without opening the modal", async ({
    page,
  }) => {
    await goToBonsaiWithSeed(page, { ownedToolIds: ["watering-can"] });

    // Switch garden tool to Water
    await page.getByRole("button", { name: "Water", exact: true }).click();

    // Click the tree in water mode
    await page.getByRole("button", { name: /pine.*click to water/i }).click();

    // No dialog should have opened
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Switch back to tend mode and open modal to verify watered status
    await page.getByRole("button", { name: "Tend" }).click();
    await page.getByRole("button", { name: /pine.*click to tend/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Watered today")).toBeVisible();
  });

  test("dragging a tree in water mode does not move it", async ({ page }) => {
    await goToBonsaiWithSeed(page, { ownedToolIds: ["watering-can"] });

    await page.getByRole("button", { name: "Water", exact: true }).click();

    const tree = page.getByRole("button", { name: /pine.*click to water/i });
    const before = await tree.boundingBox();
    if (!before) throw new Error("tree not found");

    // Drag the tree a significant distance
    await page.mouse.move(
      before.x + before.width / 2,
      before.y + before.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(before.x + 200, before.y + 100, { steps: 10 });
    await page.mouse.up();

    const after = await tree.boundingBox();
    if (!after) throw new Error("tree not found after drag");

    expect(Math.abs(after.x - before.x)).toBeLessThan(10);
    expect(Math.abs(after.y - before.y)).toBeLessThan(10);
  });

  test("D key advances day from inside the tending modal", async ({ page }) => {
    await goToBonsaiWithSeed(page, {
      activeDaysCount: 3,
      lastWateredDay: 3,
    });

    await openTendingModal(page);

    // Press D while the modal is open
    await page.keyboard.press("d");

    await expect(
      page.getByRole("img", { name: /bonsai tree, day 4/i }).first(),
    ).toBeVisible();
  });

  test("D key does nothing when tree has not been watered", async ({
    page,
  }) => {
    await goToBonsaiWithSeed(page, { activeDaysCount: 5 });

    // Press D without watering — tree should stay at day 5
    await page.keyboard.press("d");

    await expect(
      page.getByRole("img", { name: /bonsai tree, day 5/i }).first(),
    ).toBeVisible();
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
    // Day 20 ensures several branch pairs are visible; pruning shears must be owned
    await goToBonsaiWithSeed(page, {
      activeDaysCount: 20,
      ownedToolIds: ["pruning-shears"],
    });

    await openTendingModal(page);

    // Select the pruning shears tool (watering can is the default now)
    await page.getByRole("button", { name: /pruning shears/i }).click();

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
      page.getByText("Maple 1", { exact: true }).first(),
    ).toBeVisible();
  });

  test("clicking a tree card in the collection opens the tending modal", async ({
    page,
  }) => {
    await goToBonsaiWithSeed(page, { activeDaysCount: 5 });

    await page.getByRole("tab", { name: "Collection" }).click();

    // Click the Pine tree card in the Your Trees section
    await page.getByRole("button", { name: /pine/i }).first().click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Watering Can/i)).toBeVisible();
  });

  test("pot dropdown equips a different pot", async ({ page }) => {
    // Two simple-clay-small (one on tree, one spare) plus a glazed-ceramic-small
    await goToBonsaiWithSeed(page, {
      ownedPotIds: [
        "simple-clay-small",
        "simple-clay-small",
        "glazed-ceramic-small",
      ],
    });

    await openTendingModal(page);

    const dialog = page.getByRole("dialog");

    // Open the pot dropdown
    await dialog.getByRole("button", { name: /^pot$/i }).click();

    // Both pots should be listed; simple-clay should be currently equipped
    await expect(
      page.getByRole("menuitem", { name: /simple clay pot \(small\)/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: /glazed ceramic pot \(small\)/i }),
    ).toBeVisible();

    // Select the glazed ceramic pot
    await page
      .getByRole("menuitem", { name: /glazed ceramic pot \(small\)/i })
      .click();

    // Re-open the dropdown to verify the new pot is equipped
    await dialog.getByRole("button", { name: /^pot$/i }).click();
    const glazedItem = page.getByRole("menuitem", {
      name: /glazed ceramic pot \(small\)/i,
    });
    await expect(glazedItem.getByText("Equipped")).toBeVisible();
  });

  test("stand dropdown equips a stand", async ({ page }) => {
    await goToBonsaiWithSeed(page, {
      ownedStandIds: ["bamboo-mat-small"],
    });

    await openTendingModal(page);

    const dialog = page.getByRole("dialog");

    // Open the stand dropdown
    await dialog.getByRole("button", { name: /^stand$/i }).click();

    await expect(
      page.getByRole("menuitem", { name: /bamboo mat \(small\)/i }),
    ).toBeVisible();

    // Equip the stand
    await page.getByRole("menuitem", { name: /bamboo mat \(small\)/i }).click();

    // Re-open to verify it is now equipped
    await dialog.getByRole("button", { name: /^stand$/i }).click();
    const standItem = page.getByRole("menuitem", {
      name: /bamboo mat \(small\)/i,
    });
    await expect(standItem.getByText("Equipped")).toBeVisible();
  });

  test("fertiliser dropdown applies fertiliser and shows active status", async ({
    page,
  }) => {
    await goToBonsaiWithSeed(page, {
      ownedFertiliserIds: ["growth-tonic-small"],
    });

    await openTendingModal(page);

    const dialog = page.getByRole("dialog");

    // Open the fertiliser dropdown
    await dialog.getByRole("button", { name: /^fertilise$/i }).click();

    await expect(
      page.getByRole("menuitem", { name: /growth tonic \(small\)/i }),
    ).toBeVisible();

    // Apply it
    await page
      .getByRole("menuitem", { name: /growth tonic \(small\)/i })
      .click();

    // Active fertiliser status should now be visible in the modal
    await expect(dialog.getByText(/growth tonic/i)).toBeVisible();
    await expect(dialog.getByText(/days left/i)).toBeVisible();
  });

  test("pot dropdown 'Buy more in shop' navigates to shop Pots tab", async ({
    page,
  }) => {
    await goToBonsaiWithSeed(page);

    await openTendingModal(page);

    // Open the pot dropdown
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /^pot$/i })
      .click();

    // Click "Buy more in shop"
    await page.getByRole("menuitem", { name: /buy more in shop/i }).click();

    // Modal should close and shop Pots tab should be active
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(
      page
        .getByRole("tab", { name: "Pots" })
        .and(page.locator("[data-state='active']")),
    ).toBeVisible();
  });

  test("locked stand button navigates to shop Stands tab", async ({ page }) => {
    // No stands in inventory — button should show locked state
    await goToBonsaiWithSeed(page, { ownedStandIds: [] });

    await openTendingModal(page);

    const dialog = page.getByRole("dialog");

    // The stand button shows price (locked state) — click it
    await dialog.getByRole("button", { name: /stand/i }).click();

    // Modal closes, shop opens on Stands tab
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(
      page
        .getByRole("tab", { name: "Stands" })
        .and(page.locator("[data-state='active']")),
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
