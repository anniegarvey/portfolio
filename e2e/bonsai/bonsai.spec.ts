import type { Page } from "@playwright/test";
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

  test("D key advances day when tree is watered", async ({ page }) => {
    // Start at day 10, already watered
    await goToBonsaiWithSeed(page, {
      activeDaysCount: 10,
      lastWateredDay: 10,
      demoMode: true,
    });

    // Press D from the garden — tree should grow to day 11
    await page.keyboard.press("d");

    await expect(
      page.getByRole("img", { name: /bonsai tree, day 11/i }).first(),
    ).toBeVisible();
  });

  test("Advance day button advances day from the garden toolbar", async ({
    page,
  }) => {
    await goToBonsaiWithSeed(page, {
      activeDaysCount: 10,
      lastWateredDay: 10,
      demoMode: true,
    });

    await page.getByRole("button", { name: /advance day/i }).click();

    await expect(
      page.getByRole("img", { name: /bonsai tree, day 11/i }).first(),
    ).toBeVisible();
  });

  test("Advance day button advances day from inside the tending modal", async ({
    page,
  }) => {
    await goToBonsaiWithSeed(page, {
      activeDaysCount: 3,
      lastWateredDay: 3,
      demoMode: true,
    });

    await openTendingModal(page);

    await page
      .getByRole("dialog")
      .getByRole("button", { name: /advance day/i })
      .click();

    await expect(
      page.getByRole("img", { name: /bonsai tree, day 4/i }).first(),
    ).toBeVisible();
  });

  test("Advance day control is hidden and D key inert without demo mode", async ({
    page,
  }) => {
    await goToBonsaiWithSeed(page, {
      activeDaysCount: 10,
      lastWateredDay: 10,
    });

    await expect(
      page.getByRole("button", { name: /advance day/i }),
    ).toHaveCount(0);

    // The D shortcut is also gated off, so the tree stays at day 10
    await page.keyboard.press("d");
    await expect(
      page.getByRole("img", { name: /bonsai tree, day 10/i }).first(),
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

  test("garden water tool waters on press, before the pointer is released", async ({
    page,
  }) => {
    await goToBonsaiWithSeed(page, { ownedToolIds: ["watering-can"] });

    await page.getByRole("button", { name: "Water", exact: true }).click();

    const tree = page.getByRole("button", { name: /pine.*click to water/i });
    const box = await tree.boundingBox();
    if (!box) throw new Error("tree not found");

    // #7a4f2a is the watered-soil fill; nothing else in the SVG uses it.
    const wateredSoil = page.locator('ellipse[fill="#7a4f2a"]');
    await expect(wateredSoil).toHaveCount(0);

    // Press and hold — deliberately no mouse.up(). The soil must already be
    // dark while the pointer is still down; a pointerup-based handler would
    // leave it light here. `.click()` dispatches both events so it cannot
    // tell the two implementations apart, which is why this test exists.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();

    await expect(wateredSoil.first()).toBeVisible();

    await page.mouse.up();
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
      demoMode: true,
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
    await goToBonsaiWithSeed(page, { activeDaysCount: 5, demoMode: true });

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

  // The saved game lives in localStorage, so the server render and the first
  // client render can only show a placeholder. Disabling JavaScript freezes the
  // page in exactly that pre-hydration state, which is what a user sees for the
  // first moments after landing on the page.
  test.describe("before the saved game loads", () => {
    test.use({ javaScriptEnabled: false });

    test("shows a loading state instead of claiming the garden is empty", async ({
      page,
    }) => {
      await page.goto("/bonsai");

      await expect(
        page.getByRole("region", { name: "Loading garden…" }),
      ).toBeVisible();
      await expect(
        page.getByRole("region", { name: "Loading tree collection…" }),
      ).toBeVisible();

      await expect(page.getByText(/your garden is empty/i)).toHaveCount(0);
      await expect(page.getByText(/don.t have any trees yet/i)).toHaveCount(0);
      // No garden tools either — rendering them would show the locked "buy a
      // watering can" state before we know whether one has been bought.
      await expect(page.getByRole("main").getByRole("button")).toHaveCount(0);
    });
  });

  // The skeleton's dimensions are hand-tuned to the loaded page, so nothing but
  // this test stops an unrelated style tweak (a tool button's padding, a tree
  // card's font size) from reintroducing the layout jump.
  test("loading skeleton reserves the space the loaded page uses", async ({
    page,
    browser,
  }) => {
    // Section heights, top to bottom: garden toolbar, garden, tab list, and the
    // active tab panel. Every one of these is font-metric dependent, so wait for
    // Lexend rather than measuring a fallback face on one side of the comparison.
    const heights = (target: Page) =>
      target.evaluate(async () => {
        await document.fonts.ready;
        const layout = document.querySelector("main")
          ?.lastElementChild as HTMLElement;
        const garden = layout.firstElementChild as HTMLElement;
        const h = (el: Element | null | undefined) =>
          el ? Math.round(el.getBoundingClientRect().height) : null;
        return {
          toolbar: h(garden.firstElementChild),
          garden: h(garden.lastElementChild),
          tabList: h(layout.querySelector('[role="tablist"]')),
          panel: h(layout.querySelector('[role="tabpanel"]:not([hidden])')),
          // Each pill against its real button. Row count alone is too coarse —
          // a drifted width only changes it at the widths where it happens to
          // tip a wrap.
          toolWidths: [...(garden.firstElementChild?.children ?? [])].map(
            (el) => Math.round(el.getBoundingClientRect().width),
          ),
        };
      });

    // 480px sits in the band where the toolbar wraps onto a second row, which
    // is where a mismatch would cost a whole 52px row. Demo mode adds a fifth
    // toolbar button, and it is the entry point the case study links to.
    for (const demoMode of [false, true]) {
      for (const width of [375, 480, 1280]) {
        const label = `viewport ${width}px${demoMode ? " (demo)" : ""}`;
        await page.setViewportSize({ width, height: 900 });
        // The default seed owns no tools — the state a first-time visitor lands in.
        await goToBonsaiWithSeed(page, { demoMode, ownedToolIds: [] });
        await expect(
          page.getByRole("img", { name: /bonsai tree/i }).first(),
        ).toBeVisible();
        const loaded = await heights(page);

        const noJs = await browser.newContext({
          javaScriptEnabled: false,
          viewport: { width, height: 900 },
        });
        const skeletonPage = await noJs.newPage();
        await skeletonPage.goto(new URL(page.url()).toString());
        const skeleton = await heights(skeletonPage);
        await noJs.close();

        const { panel: skeletonPanel, ...skeletonChrome } = skeleton;
        const { panel: loadedPanel, ...loadedChrome } = loaded;
        expect(skeletonChrome, label).toEqual(loadedChrome);

        // A tree card's name and "Needs water" badge wrap onto a second line on
        // narrow phones, which the skeleton can't predict — so allow one line of
        // downward settle, but no more, and never a shrink.
        const drift = (loadedPanel ?? 0) - (skeletonPanel ?? 0);
        expect(drift, `${label} panel drift`).toBeGreaterThanOrEqual(0);
        expect(drift, `${label} panel drift`).toBeLessThanOrEqual(24);
      }
    }
  });

  // The skeleton pins Water/Hose pill widths to the locked variant (wider,
  // and what every new visitor sees), but the real toolbar's unlocked pills
  // used to be narrower — so buying either tool mid-session reflowed the
  // toolbar. Confirms both variants render at the same width, at the same
  // viewports the skeleton-parity test above pins against the skeleton, so
  // the loaded toolbar can't drift from the reserved size in either state.
  test("Water and Hose toolbar pills keep their width once unlocked", async ({
    page,
  }) => {
    // Named by accessible name rather than DOM position: the locked and
    // unlocked pills both contain "Water"/"Hose" in their text (see the
    // `title`s in GardenView.tsx), so this fails loudly if either button
    // goes missing instead of silently comparing two empty reads. `.first()`
    // disambiguates from the "Needs water" tree card in the Collection tab —
    // the toolbar renders first in document order.
    const pillWidth = async (name: RegExp) => {
      const box = await page
        .getByRole("button", { name })
        .first()
        .boundingBox();
      if (!box) throw new Error(`no bounding box for ${name}`);
      return Math.round(box.width);
    };

    for (const width of [375, 480, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await goToBonsaiWithSeed(page, { points: 5000 });

      const lockedWater = await pillWidth(/water/i);
      const lockedHose = await pillWidth(/hose/i);

      await page.getByRole("tab", { name: "Shop" }).click();
      await page.getByRole("tab", { name: "Tools" }).click();
      for (const item of ["Watering Can", "Garden Hose"]) {
        const card = page.getByRole("tabpanel").locator(`text=${item}`).first();
        await card
          .locator("xpath=ancestor::*[2]")
          .getByRole("button", { name: "Buy" })
          .click();
      }

      const unlockedWater = await pillWidth(/water/i);
      const unlockedHose = await pillWidth(/hose/i);

      expect(unlockedWater, `width ${width}px`).toBe(lockedWater);
      expect(unlockedHose, `width ${width}px`).toBe(lockedHose);
    }
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
