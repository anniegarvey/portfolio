import { devices } from "@playwright/test";
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

test.describe("Meadowmere on a phone", () => {
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
