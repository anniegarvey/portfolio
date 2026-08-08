import { devices, type Page } from "@playwright/test";
import {
  expect,
  test,
  violationFingerprints,
} from "../utils/accessibility-test";
import { goToMeadowmereWithSeed } from "../utils/seed-meadowmere";

/**
 * Meadowmere on a real phone: a touch screen, no keyboard, and a viewport the
 * map is both wider and taller than. Everything here is driven by tap(), and
 * the assertions are about what actually reaches the screen — the map's own
 * feedback used to sit below a fold no amount of scrolling could bring it
 * above, which read as the game being broken.
 *
 * `use` has to be top level: a device descriptor sets defaultBrowserType, and
 * Playwright won't let a describe block force a new worker.
 */
test.use({ ...devices["Pixel 5"] });

const map = "The Vale — Meadowmere's map";

/**
 * Taps a tile of the Vale by its grid position with a real finger, wherever the
 * map happens to be scrolled to. The tiles of open ground carry no button — the
 * map works out which tile a tap landed on from its own box — so these taps
 * cannot go through a locator.
 */
async function tapTile(page: Page, x: number, y: number) {
  const view = page.getByRole("application", { name: map });
  await view.scrollIntoViewIfNeeded();
  const point = await view.evaluate(
    (el, tile) => {
      const box = (el.firstElementChild as HTMLElement).getBoundingClientRect();
      return {
        x: box.left + ((tile.x + 0.5) * box.width) / 16,
        y: box.top + ((tile.y + 0.5) * box.height) / 12,
      };
    },
    { x, y },
  );
  await page.touchscreen.tap(point.x, point.y);
}

test.describe("Meadowmere on a phone", () => {
  /**
   * The headline of walking on a phone. Only the nineteen features carried a
   * button, so every journey was a jump from one feature to the next and there
   * was no way to simply stroll. (5,2) is bare path beside the seed stall, so
   * arriving there leaves the farmer facing it — which is the proof they walked.
   */
  test("walks to a patch of open ground the player taps", async ({ page }) => {
    await goToMeadowmereWithSeed(page);

    await tapTile(page, 5, 2);

    await expect(page.getByRole("status")).toContainText(
      "Browse the seed stall",
    );
    await expect(page.getByRole("status")).toBeInViewport();
  });

  test("has the valley answer for itself when a tap can't land", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page);

    // The river, which the farmer is never going to wade into. A tap here used
    // to do nothing whatsoever — the tile has no button to say otherwise.
    await tapTile(page, 0, 3);

    await expect(page.getByRole("status")).toContainText(
      "The river runs quick",
    );
    await expect(page.getByRole("status")).toBeInViewport();
  });

  test("finds a cat somewhere in the valley and pets it", async ({ page }) => {
    await goToMeadowmereWithSeed(page);

    // Where the cat is sitting depends on the day, so it is found by name.
    const cat = page.getByRole("button", { name: "Pet the cat" });
    await cat.scrollIntoViewIfNeeded();
    await cat.tap();

    await expect(page.getByRole("status")).toContainText(/cat|Purring|rumble/);
    await expect(page.getByRole("status")).toBeInViewport();
  });

  test("says why a tap did nothing, where the player can actually see it", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page);

    const plot = page.getByRole("button", {
      name: "Plot 1 — bare soil, needs a seed in hand",
    });
    await plot.scrollIntoViewIfNeeded();
    await plot.tap();

    // The answer was in the DOM all along; the bug was that it sat under a map
    // taller than the screen, so it never reached the player.
    await expect(page.getByRole("status")).toBeInViewport();
    await expect(page.getByRole("status")).toHaveText(
      "Plot 1 — bare soil, needs a seed in hand",
    );
  });

  test("sows a seed by tapping the pouch and then the plot", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page, { seeds: { parsnip: 2 } });

    await page.getByRole("button", { name: "Parsnip, 2 seeds" }).tap();
    await page.getByRole("button", { name: "Sow Parsnip in Plot 1" }).tap();

    await expect(
      page.getByRole("button", { name: "Parsnip, 1 seed" }),
    ).toBeVisible();
    // The prompt moves on to what the plot wants next, so a tap visibly landed
    // rather than sitting on the label it was tapped under.
    await expect(page.getByRole("status")).toHaveText(
      "Water Parsnip in Plot 1",
    );
  });

  test("reaches the neighbours once the map is scrolled east", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page);

    const nessa = page.getByRole("button", { name: "Call on Nessa" });
    // Her cottage stands at x=12 of 16 — off the side of the screen to start.
    await expect(nessa).not.toBeInViewport();

    await page.getByRole("application", { name: map }).evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    await nessa.tap();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Cook at the Hollow Inn")).toBeVisible();
  });

  // The gift select is the only control in the game that isn't a plain button:
  // a Radix popover inside a Radix dialog, which is exactly the shape that
  // tends to come apart on touch.
  test("gives a neighbour a gift through the select, by tap", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page, {
      inventory: { "river-clay": 2 },
      neighbours: { marigold: { friendship: 16 } },
    });

    await page.getByRole("button", { name: "Call on Marigold" }).tap();
    const door = page.getByRole("dialog");
    await door.getByRole("combobox").tap();
    await page.getByRole("option", { name: /River Clay/ }).tap();
    await door.getByRole("button", { name: "Give gift" }).tap();

    await expect(door.getByText(/now an Acquaintance/)).toBeVisible();
  });

  test("opens the journal and the stall without a keyboard", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page, { points: 20 });

    await page.getByRole("button", { name: /Quest journal/ }).tap();
    await expect(page.getByText("A Bed for Parsnips")).toBeVisible();
    await page.getByRole("button", { name: "Close modal" }).tap();

    await page.getByRole("button", { name: "Browse the seed stall" }).tap();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /^Buy Parsnip seed/ })
      .tap();
    await page.getByRole("button", { name: "Close modal" }).tap();

    await expect(
      page.getByRole("button", { name: "Parsnip, 7 seeds" }),
    ).toBeVisible();
  });

  test("says how to sow, which is the step the map cannot show", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page);

    await expect(
      page.getByText("Pick a seed, then tap or click a bare plot to sow it."),
    ).toBeVisible();
    await expect(
      page.getByText(/^Tap or click any place on the map/),
    ).toBeVisible();
  });

  test("has no automatically detectable accessibility issues", async ({
    page,
    makeAxeBuilder,
  }) => {
    await goToMeadowmereWithSeed(page);

    const results = await makeAxeBuilder().analyze();
    expect(violationFingerprints(results)).toEqual("[]");
  });
});
