import {
  expect,
  test,
  violationFingerprints,
} from "../utils/accessibility-test";
import { goToGladeWithSeed } from "../utils/seed-glade";

test.describe("Creature Glade", () => {
  test("page loads with heading, scene, and a wild visitor", async ({
    page,
  }) => {
    await goToGladeWithSeed(page);

    await expect(
      page.getByRole("heading", { name: "Creature Glade" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Glade ecosystem" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Robin/ })).toBeVisible();
    await expect(page.getByText("Trust 0/60")).toBeVisible();
  });

  test("cooking a treat and offering it raises trust (favourite = double)", async ({
    page,
  }) => {
    await goToGladeWithSeed(page, {
      skills: {
        "treat-cooking": { tier: 1, xp: 0 },
        "body-language": { tier: 1, xp: 0 },
        "petting-technique": { tier: 2, xp: 0 }, // unlocks treat-cooking
      },
    });

    // Cook Berry Bites in the kitchen (2 of the 4 seeded berries)
    await page.getByRole("tab", { name: "Kitchen" }).click();
    await page
      .getByText("Berry Bites ×0")
      .locator("..")
      .getByRole("button", { name: "Cook" })
      .click();
    // The cooked treat appears as an offer button on the robin's card
    const offerButton = page.getByRole("button", { name: "Berry Bites ×1" });
    await expect(offerButton).toBeVisible();

    // Offer it to the robin — berry bites are its favourite: 5 × 2 = 10
    await offerButton.click();
    await expect(page.getByText("Trust 10/60")).toBeVisible();
    await expect(page.getByText("Fed for today")).toBeVisible();
  });

  test("quick-buying missing ingredients unlocks cooking a recipe", async ({
    page,
  }) => {
    await goToGladeWithSeed(page, {
      skills: {
        "treat-cooking": { tier: 2, xp: 0 },
        "body-language": { tier: 1, xp: 0 },
        "petting-technique": { tier: 2, xp: 0 }, // unlocks treat-cooking
      },
      ingredients: { oats: 1 },
      points: 20,
    });

    await page.getByRole("tab", { name: "Kitchen" }).click();
    const honeyDropsCard = page.getByText("Honey Drops ×0").locator("..");

    // Missing 1 honey (cost 5) — Cook is disabled until it's bought.
    await expect(
      honeyDropsCard.getByRole("button", { name: "Cook" }),
    ).toBeDisabled();
    await honeyDropsCard.getByRole("button", { name: "Buy missing 5" }).click();

    await expect(
      honeyDropsCard.getByRole("button", { name: /^Buy missing/ }),
    ).toHaveCount(0);
    await honeyDropsCard.getByRole("button", { name: "Cook" }).click();
    await expect(
      page
        .getByRole("tabpanel", { name: "Kitchen" })
        .getByText("Honey Drops ×1"),
    ).toBeVisible();
  });

  test("petting the preferred spot tames a visitor at full trust", async ({
    page,
  }) => {
    // Robin needs 60 trust; preferred spot is the back (tier 1 match = +11)
    await goToGladeWithSeed(page, {
      visitorTrust: 59,
      skills: {
        "treat-cooking": { tier: 1, xp: 0 },
        "body-language": { tier: 2, xp: 0 }, // unlocks petting-technique
        "petting-technique": { tier: 1, xp: 0 },
      },
    });

    await page.getByRole("button", { name: "Along the back" }).click();

    // Interactive visitor card is gone — action buttons no longer present
    await expect(
      page.getByRole("button", { name: "Along the back" }),
    ).toBeHidden();
    // Tamed success card replaces it in the grid
    await expect(
      page.getByText("Joined the glade!", { exact: true }),
    ).toBeVisible();
    // Robin also appears as a resident in the glade scene
    await expect(
      page.getByRole("region", { name: "Glade ecosystem" }).getByText("Robin"),
    ).toBeVisible();
  });

  test("greeting a resident shows its benefit details", async ({ page }) => {
    await goToGladeWithSeed(page, {
      residents: [{ speciesId: "rabbit", x: 30, y: 60 }],
    });

    await page
      .getByRole("region", { name: "Glade ecosystem" })
      .getByRole("button", { name: "Rabbit" })
      .click();

    await expect(
      page.getByText("Gathers an ingredient each day"),
    ).toBeVisible();

    await page.getByRole("button", { name: "Close details" }).click();
    await expect(page.getByText("Gathers an ingredient each day")).toBeHidden();
  });

  test("skills tab shows the three taming skills", async ({ page }) => {
    await goToGladeWithSeed(page);

    await page.getByRole("tab", { name: "Skills" }).click();
    await expect(
      page.getByRole("heading", { name: "Treat Cooking" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Body Language" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Petting Technique" }),
    ).toBeVisible();
  });

  test("has no automatically detectable accessibility issues", async ({
    page,
    makeAxeBuilder,
  }) => {
    await goToGladeWithSeed(page);

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toEqual("[]");
  });

  test("has no automatically detectable accessibility issues in dark mode", async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await goToGladeWithSeed(page);

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(violationFingerprints(accessibilityScanResults)).toEqual("[]");
  });

  test("core action buttons meet the 44px touch target", async ({ page }) => {
    await goToGladeWithSeed(page);

    // A representative compact (size="sm") action button on the visitor
    // card. Approach is always unlocked, unlike Pet and Offer a treat.
    const box = await page
      .getByRole("button", { name: "Sit still" })
      .boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test("pet and offer-treat actions are locked until their skills unlock", async ({
    page,
  }) => {
    await goToGladeWithSeed(page);
    const robinCard = page.getByRole("region", { name: /^Robin/ });

    // Approach is available from the start.
    await expect(
      robinCard.getByRole("button", { name: "Sit still" }),
    ).toBeVisible();

    // Pet and Offer a treat are locked until Body Language / Petting
    // Technique reach tier 2 — scoped to the visitor card since the
    // Skills tab (mounted by default) shows identical messages.
    await expect(
      robinCard.getByRole("button", { name: "Along the back" }),
    ).toBeHidden();
    await expect(
      robinCard.getByText("Unlocks at Body Language tier 2"),
    ).toBeVisible();
    await expect(
      robinCard.getByText("Unlocks at Petting Technique tier 2"),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Skills" }).click();
    const skillsPanel = page.getByRole("tabpanel", { name: "Skills" });
    await expect(
      skillsPanel.getByRole("heading", { name: "Petting Technique" }),
    ).toBeVisible();
    await expect(
      skillsPanel.getByText("Unlocks at Body Language tier 2"),
    ).toBeVisible();
    await expect(
      skillsPanel.getByText("Unlocks at Petting Technique tier 2"),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Kitchen" }).click();
    await expect(
      page
        .getByRole("tabpanel", { name: "Kitchen" })
        .getByText("Unlocks at Petting Technique tier 2"),
    ).toBeVisible();
  });

  test("resetting the glade wipes progress back to a fresh start", async ({
    page,
  }) => {
    await goToGladeWithSeed(page, {
      residents: [{ speciesId: "rabbit", x: 30, y: 60 }],
      skills: {
        "treat-cooking": { tier: 1, xp: 0 },
        "body-language": { tier: 3, xp: 0 },
        "petting-technique": { tier: 2, xp: 0 },
      },
    });

    await page.getByRole("button", { name: "Reset glade" }).click();
    await page
      .getByRole("dialog", { name: "Reset the glade?" })
      .getByRole("button", { name: "Reset glade" })
      .click();

    // Back to a single fresh robin at zero trust and no residents.
    await expect(page.getByRole("heading", { name: /^Robin/ })).toBeVisible();
    await expect(page.getByText("Trust 0/60")).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Glade ecosystem" }).getByText("Rabbit"),
    ).toBeHidden();

    // Petting Technique is locked again, matching a brand-new save. Scoped
    // to the Skills tab (default-active) since the visitor card's Pet
    // action shows an identical message.
    await expect(
      page
        .getByRole("tabpanel", { name: "Skills" })
        .getByText("Unlocks at Body Language tier 2"),
    ).toBeVisible();
  });
});
