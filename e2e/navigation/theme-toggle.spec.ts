import { expect, test } from "../utils/accessibility-test";

test.describe("Theme Toggle", () => {
  test.beforeEach(async ({ page }) => {
    // Start with a clean slate — no saved theme preference
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("theme"));
    await page.goto("/");
  });

  test("defaults to system theme with no data-theme attribute", async ({
    page,
  }) => {
    const dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(dataTheme).toBeNull();
  });

  test("cycles through system → light → dark → system", async ({ page }) => {
    const toggle = page.getByRole("button", { name: /Theme: System/i }).first();
    await expect(toggle).toBeVisible();

    // system → light
    await toggle.click();
    await expect(
      page.getByRole("button", { name: /Theme: Light/i }).first(),
    ).toBeVisible();
    expect(
      await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme"),
      ),
    ).toBe("light");

    // light → dark
    await page
      .getByRole("button", { name: /Theme: Light/i })
      .first()
      .click();
    await expect(
      page.getByRole("button", { name: /Theme: Dark/i }).first(),
    ).toBeVisible();
    expect(
      await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme"),
      ),
    ).toBe("dark");

    // dark → system
    await page
      .getByRole("button", { name: /Theme: Dark/i })
      .first()
      .click();
    await expect(
      page.getByRole("button", { name: /Theme: System/i }).first(),
    ).toBeVisible();
    expect(
      await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme"),
      ),
    ).toBeNull();
  });

  test("persists theme choice across page reloads", async ({ page }) => {
    await page
      .getByRole("button", { name: /Theme: System/i })
      .first()
      .click();
    await page
      .getByRole("button", { name: /Theme: Light/i })
      .first()
      .click();

    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(
      "dark",
    );

    await page.reload();

    // FOUC script should apply data-theme before React hydrates
    expect(
      await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme"),
      ),
    ).toBe("dark");
    await expect(
      page.getByRole("button", { name: /Theme: Dark/i }).first(),
    ).toBeVisible();
  });

  test("clears localStorage when switching back to system", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: /Theme: System/i })
      .first()
      .click();

    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(
      "light",
    );

    await page
      .getByRole("button", { name: /Theme: Light/i })
      .first()
      .click();
    await page
      .getByRole("button", { name: /Theme: Dark/i })
      .first()
      .click();

    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBeNull();
  });

  test("toggle is accessible via mobile hamburger menu", async ({ page }) => {
    // Set a narrow viewport to trigger mobile layout
    await page.setViewportSize({ width: 375, height: 812 });

    // The desktop toggle is hidden on mobile, open the drawer
    await page.getByRole("button", { name: "Toggle navigation menu" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Theme toggle should be inside the dialog
    const mobileToggle = dialog.getByRole("button", { name: /Theme:/i });
    await expect(mobileToggle).toBeVisible();

    await mobileToggle.click();
    await expect(
      dialog.getByRole("button", { name: /Theme: Light/i }),
    ).toBeVisible();
  });

  test("meets accessibility standards", async ({ page, makeAxeBuilder }) => {
    await page.waitForTimeout(1000); // Wait for loading animations to complete
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("meets accessibility standards in dark mode", async ({
    page,
    makeAxeBuilder,
  }) => {
    // Switch to dark
    await page
      .getByRole("button", { name: /Theme: System/i })
      .first()
      .click();
    await page
      .getByRole("button", { name: /Theme: Light/i })
      .first()
      .click();

    await page.waitForTimeout(1000); // Wait for loading animations to complete
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
