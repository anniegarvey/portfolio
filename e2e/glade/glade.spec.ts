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
      page.getByRole("img", { name: "Glade ecosystem" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Robin/ })).toBeVisible();
    await expect(page.getByText("Trust 0/60")).toBeVisible();
  });

  test("cooking a treat and offering it raises trust (favourite = double)", async ({
    page,
  }) => {
    await goToGladeWithSeed(page);

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

  test("petting the preferred spot tames a visitor at full trust", async ({
    page,
  }) => {
    // Robin needs 60 trust; preferred spot is the back (tier 1 match = +11)
    await goToGladeWithSeed(page, { visitorTrust: 59 });

    await page.getByRole("button", { name: "Along the back" }).click();

    // Visitor card is gone; robin now lives in the glade scene
    await expect(page.getByRole("heading", { name: /^Robin/ })).toBeHidden();
    await expect(
      page.getByText("No wild creatures right now", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Glade ecosystem" }).getByText("Robin"),
    ).toBeVisible();
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

    // A representative compact (size="sm") action button on the visitor card.
    const box = await page
      .getByRole("button", { name: "Along the back" })
      .boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});
