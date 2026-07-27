import {
  expect,
  test,
  violationFingerprints,
} from "../utils/accessibility-test";
import { goToMeadowmereWithSeed } from "../utils/seed-meadowmere";

test.describe("Meadowmere", () => {
  test("page loads on the farm with bare plots and a seed tray", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page);

    await expect(
      page.getByRole("heading", { name: "Meadowmere", level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Farm" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      page.getByRole("button", { name: "Parsnip, 6 seeds" }),
    ).toBeVisible();
    await expect(page.getByText("Bare soil").first()).toBeVisible();
  });

  test("planting a chosen seed fills a plot and spends a packet", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page, { seeds: { parsnip: 2 } });

    await page.getByRole("button", { name: "Parsnip, 2 seeds" }).click();
    await page.getByRole("button", { name: "Plant Parsnip" }).first().click();

    await expect(
      page.getByRole("button", { name: "Parsnip, 1 seed" }),
    ).toBeVisible();
    await expect(page.getByText("Seed", { exact: true })).toBeVisible();
  });

  test("watering raises the yield and is capped to once a day", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page, {
      plots: [{ cropId: "pumpkin", plantedDaysAgo: 1 }],
    });

    await expect(page.getByText("Yields 2 · watered 0×")).toBeVisible();

    await page.getByRole("button", { name: "Water" }).click();

    await expect(page.getByText("Yields 3 · watered 1×")).toBeVisible();
    await expect(page.getByRole("button", { name: "Watered" })).toBeDisabled();
  });

  test("a crop left for days is ripe rather than withered, and harvests to the larder", async ({
    page,
  }) => {
    // Parsnip matures in 2 days — this one was left for 9.
    await goToMeadowmereWithSeed(page, {
      plots: [{ cropId: "parsnip", plantedDaysAgo: 9, wateredDays: 2 }],
    });

    await expect(page.getByText("Ready to harvest")).toBeVisible();

    await page.getByRole("button", { name: "Harvest" }).click();
    await expect(page.getByText("Bare soil")).toBeVisible();

    await page.getByRole("tab", { name: "Wilds" }).click();
    await expect(page.getByText("Parsnip ×3")).toBeVisible();
  });

  test("foraging an unlocked site spends a trip and stocks the larder", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page);

    await page.getByRole("tab", { name: "Wilds" }).click();
    await expect(page.getByText("3 forage trips left today.")).toBeVisible();
    await expect(
      page.getByText("Locked — a neighbour will show you the way."),
    ).toHaveCount(2);

    await page.getByRole("button", { name: "Forage" }).click();

    await expect(page.getByText("2 forage trips left today.")).toBeVisible();
    await expect(page.getByText(/^Foraged \d × /)).toBeVisible();
  });

  test("gifting a liked item raises friendship and locks out a second gift", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page, {
      inventory: { "wild-honey": 2 },
      neighbours: { marigold: { friendship: 10 } },
    });

    await page.getByRole("tab", { name: "Neighbours" }).click();

    const marigold = page.getByRole("article", { name: "Marigold" });
    await marigold.getByRole("combobox").click();
    await page.getByRole("option", { name: /Wild Honey/ }).click();
    await marigold.getByRole("button", { name: "Give gift" }).click();

    await expect(
      page.getByText(
        "Marigold loved the wild honey (+12 friendship) — now an Acquaintance!",
      ),
    ).toBeVisible();
    await expect(
      page.getByText("You’ve already given Marigold something today."),
    ).toBeVisible();
  });

  test("handing in a quest pays its reward and unlocks the next one", async ({
    page,
  }) => {
    await goToMeadowmereWithSeed(page, {
      inventory: { "parsnip-root": 3 },
    });

    await page.getByRole("tab", { name: "Quests" }).click();
    await expect(page.getByText("A Bed for Parsnips")).toBeVisible();
    await expect(page.getByText("3/3")).toBeVisible();

    await page.getByRole("button", { name: "Hand in" }).click();

    await expect(page.getByText("Completed")).toBeVisible();
    // Reward: the next quest opens, and cornflower becomes plantable.
    await expect(page.getByText("Down to the Riverbank")).toBeVisible();

    await page.getByRole("tab", { name: "Farm" }).click();
    await expect(
      page.getByRole("button", { name: "Cornflower, 3 seeds" }),
    ).toBeVisible();
  });

  test("a quest that is not ready cannot be handed in", async ({ page }) => {
    await goToMeadowmereWithSeed(page, { inventory: { "parsnip-root": 1 } });

    await page.getByRole("tab", { name: "Quests" }).click();

    await expect(page.getByText("1/3")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Not ready" }),
    ).toBeDisabled();
  });

  test("seeds can only be bought with enough points", async ({ page }) => {
    await goToMeadowmereWithSeed(page, { seeds: { parsnip: 1 }, points: 20 });

    const buyParsnip = page.getByRole("button", { name: /Buy seed/ }).first();
    await buyParsnip.click();

    await expect(
      page.getByRole("button", { name: "Parsnip, 2 seeds" }),
    ).toBeVisible();
  });

  test("has no automatically detectable accessibility issues", async ({
    page,
    makeAxeBuilder,
  }) => {
    await goToMeadowmereWithSeed(page, {
      plots: [
        { cropId: "parsnip", plantedDaysAgo: 3 },
        { cropId: "pumpkin", plantedDaysAgo: 1 },
        null,
      ],
      inventory: { acorn: 2 },
    });

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toEqual("[]");
  });

  test("has no automatically detectable accessibility issues in dark mode", async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await goToMeadowmereWithSeed(page, {
      plots: [{ cropId: "parsnip", plantedDaysAgo: 3 }, null],
      inventory: { acorn: 2 },
    });

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toEqual("[]");
  });
});
