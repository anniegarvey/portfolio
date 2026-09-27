import type { Page } from "@playwright/test";
import {
  expect,
  test,
  violationFingerprints,
} from "../utils/accessibility-test";

const water = (page: Page) => page.getByRole("img", { name: /water to stir/i });

/** How many of the canvas's pixels carry visible dye. */
function inkedPixels(page: Page) {
  return water(page).evaluate((canvas: HTMLCanvasElement) => {
    const context = canvas.getContext("2d");
    if (!context) return 0;
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let count = 0;
    for (let k = 3; k < data.length; k += 4) if (data[k] > 20) count++;
    return count;
  });
}

test.describe("Drift", () => {
  test("is listed in the Playground menu and marked current there", async ({
    page,
  }) => {
    await page.goto("/drift");
    await expect(page.getByRole("heading", { name: "Drift" })).toBeVisible();
    // Mega-menu links live in the DOM whether or not the menu is open.
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(nav.locator('a[href="/drift"]')).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("stirring with the pointer drops dye into cleared water", async ({
    page,
  }) => {
    await page.goto("/drift");
    await page.getByRole("checkbox", { name: "Gentle currents" }).uncheck();
    await page.getByRole("button", { name: "Clear water" }).click();
    await expect.poll(() => inkedPixels(page)).toBe(0);

    const box = await water(page).boundingBox();
    if (!box) throw new Error("The water has no box");
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2, {
      steps: 12,
    });
    await expect.poll(() => inkedPixels(page)).toBeGreaterThan(100);
  });

  test("remembers settings across a reload", async ({ page }) => {
    await page.goto("/drift");
    await page.getByText("Ember", { exact: true }).click();
    await page.getByRole("checkbox", { name: "Gentle currents" }).uncheck();
    await page.reload();

    await expect(page.getByRole("radio", { name: "Ember" })).toBeChecked();
    await expect(
      page.getByRole("checkbox", { name: "Gentle currents" }),
    ).not.toBeChecked();
  });

  test("goes calm when the reader asks for reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/drift");
    await expect(
      page.getByRole("checkbox", { name: "Gentle currents" }),
    ).toBeDisabled();
    await expect(page.getByText(/asks for reduced motion/)).toBeVisible();
  });

  test("has no automatically detectable accessibility issues", async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.goto("/drift");
    await expect(water(page)).toBeVisible();
    const results = await makeAxeBuilder().analyze();
    expect(violationFingerprints(results)).toEqual("[]");
  });

  test("has no automatically detectable accessibility issues in dark mode", async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/drift");
    await expect(water(page)).toBeVisible();
    const results = await makeAxeBuilder().analyze();
    expect(violationFingerprints(results)).toEqual("[]");
  });
});
