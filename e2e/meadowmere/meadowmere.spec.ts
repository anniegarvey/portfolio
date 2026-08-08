import {
  expect,
  test,
  violationFingerprints,
} from "../utils/accessibility-test";
import { goToMeadowmereWithSeed } from "../utils/seed-meadowmere";

/**
 * Every feature on the map carries a button named for what it offers, and
 * activating one walks the farmer there and does it. The action resolves before
 * the walk is played back, so nothing here has to wait on an animation.
 */
const map = "The Vale — Meadowmere's map";

test.describe("Meadowmere", () => {
  test("opens on a map with the farm, the wilds, the neighbours and the stall", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page);

    await expect(
      page.getByRole("heading", { name: "Meadowmere" }),
    ).toBeVisible();
    await expect(page.getByRole("application", { name: map })).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Plot 1 — bare soil, needs a seed in hand",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Forage The Hedgerow/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Call on Nessa" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Browse the seed stall" }),
    ).toBeVisible();
  });

  test("shows a site the player hasn't been shown the way to yet", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page);

    await expect(
      page.getByRole("button", {
        name: "Stonewood — you don’t know the way yet",
      }),
    ).toBeVisible();
  });

  test("says who opens a shut site, and what an open one turns up", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page);

    // Walking up to a wild place is how you find out what it is for. Both of
    // these live in the catalog and neither used to reach the player: a locked
    // site was a dead end, and a trip produced an item out of nowhere.
    await page
      .getByRole("button", { name: "Stonewood — you don’t know the way yet" })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Marigold will show you the way.",
    );

    await page.getByRole("button", { name: /^Forage The Hedgerow/ }).click();
    await expect(page.getByRole("status")).toContainText(
      "Acorn, Bramble Berry or Feather — gifts, and what quests ask for.",
    );
  });

  test("explains foraging above the map, not only how many trips are left", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page);

    await expect(
      page.getByText(/Materials are what neighbours want as gifts/),
    ).toBeVisible();
    await expect(page.getByText(/Trips refill each morning/)).toBeVisible();
  });

  test("sowing a seed spends a packet and starts the crop growing", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page, { seeds: { parsnip: 2 } });

    await page.getByRole("button", { name: "Parsnip, 2 seeds" }).click();
    await page.getByRole("button", { name: "Sow Parsnip in Plot 1" }).click();

    await expect(
      page.getByRole("button", { name: "Parsnip, 1 seed" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Water Parsnip in Plot 1" }),
    ).toBeVisible();
  });

  test("a plot can only be watered once a day", async ({ page }) => {
    await goToMeadowmereWithSeed(page, {
      plots: [{ cropId: "parsnip", plantedDaysAgo: 0 }],
    });

    await page.getByRole("button", { name: "Water Parsnip in Plot 1" }).click();

    await expect(
      page.getByRole("button", { name: "Plot 1 — Parsnip, watered today" }),
    ).toBeVisible();
  });

  test("a crop left for days ripens rather than withering, and pays the watering bonus", async ({
    page,
  }) => {
    // Parsnip matures in two days; nine days away must still be a harvest.
    await goToMeadowmereWithSeed(page, {
      plots: [{ cropId: "parsnip", plantedDaysAgo: 9, wateredDays: 2 }],
    });

    await page
      .getByRole("button", { name: "Harvest Parsnip from Plot 1" })
      .click();

    // Base yield 1 plus one per watered day.
    await expect(page.getByText("Parsnip ×3")).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Plot 1 — bare soil, needs a seed in hand",
      }),
    ).toBeVisible();
  });

  test("foraging stocks the larder and spends a trip", async ({ page }) => {
    await goToMeadowmereWithSeed(page);

    await expect(page.getByText("3 forage trips left")).toBeVisible();
    await page.getByRole("button", { name: /^Forage The Hedgerow/ }).click();

    await expect(page.getByText("2 forage trips left")).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Larder" }).getByText(/×\d/),
    ).toBeVisible();
  });

  test("the day's forage trips run out", async ({ page }) => {
    await goToMeadowmereWithSeed(page, { foragesToday: 3 });

    await expect(
      page.getByRole("button", {
        name: "The Hedgerow — no forage trips left today",
      }),
    ).toBeVisible();
  });

  test("seeds are bought with points at the stall", async ({ page }) => {
    await goToMeadowmereWithSeed(page, { points: 20, seeds: { parsnip: 0 } });

    await page.getByRole("button", { name: "Browse the seed stall" }).click();

    const stall = page.getByRole("dialog");
    await expect(
      stall.getByText(/Nothing here pays points back/),
    ).toBeVisible();
    await stall.getByRole("button", { name: /^Buy Parsnip seed/ }).click();
    await stall.getByRole("button", { name: "Close modal" }).click();

    await expect(
      page.getByRole("button", { name: "Parsnip, 1 seed" }),
    ).toBeVisible();
    await expect(page.getByText("16 points")).toBeVisible();
  });

  test("a liked gift moves a neighbour up a friendship tier", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page, {
      inventory: { "river-clay": 2 },
      neighbours: { marigold: { friendship: 16 } },
    });

    await page.getByRole("button", { name: "Call on Marigold" }).click();

    const door = page.getByRole("dialog");
    await expect(door.getByText("Stranger")).toBeVisible();
    await door.getByRole("combobox").click();
    await page.getByRole("option", { name: /River Clay/ }).click();
    await door.getByRole("button", { name: "Give gift" }).click();

    await expect(door.getByText(/now an Acquaintance/)).toBeVisible();
  });

  test("a quest is handed in at the door of whoever set it", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page, {
      inventory: { "parsnip-root": 3 },
    });

    // The journal says who to see; it never hands anything in itself.
    await page.getByRole("button", { name: /Quest journal/ }).click();
    await expect(
      page.getByText("Ready — call on Nessa to hand it in."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close modal" }).click();

    await page.getByRole("button", { name: "Call on Nessa" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Hand in/ })
      .click();

    // The reward unlocks cornflower and the next quest in the chain.
    await expect(page.getByRole("dialog").getByText("Handed in")).toBeVisible();
    await page.getByRole("button", { name: "Close modal" }).click();
    await expect(
      page.getByRole("button", { name: "Cornflower, 3 seeds" }),
    ).toBeVisible();
  });

  test("the farmer can be walked with the keyboard and act with E", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page, {
      plots: [{ cropId: "parsnip", plantedDaysAgo: 0 }],
    });

    const stage = page.getByRole("application", { name: map });
    await stage.focus();
    // From the farmhouse door at (2,2): down to (2,3), then east into Plot 1,
    // which blocks — so the farmer turns to face it instead.
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("e");

    await expect(
      page.getByRole("button", { name: "Plot 1 — Parsnip, watered today" }),
    ).toBeVisible();
  });

  test("every place on the map is a tap target of at least 24px", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page);

    const box = await page
      .getByRole("button", { name: "Call on Nessa" })
      .boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(24);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
  });

  test("the map still has usable tap targets on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await goToMeadowmereWithSeed(page);

    const box = await page
      .getByRole("button", { name: "Plot 1 — bare soil, needs a seed in hand" })
      .boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(24);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
  });

  test("has no automatically detectable accessibility issues", async ({
    page,
    makeAxeBuilder,
  }) => {
    await goToMeadowmereWithSeed(page);

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toEqual("[]");
  });

  test("has no automatically detectable accessibility issues in dark mode", async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await goToMeadowmereWithSeed(page);

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toEqual("[]");
  });
});
