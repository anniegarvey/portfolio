import { expect, test } from "@playwright/test";

const MOBILE_VIEWPORT = { width: 390, height: 844 };

test.describe("Active nav link", () => {
  test("desktop Home link has aria-current=page at /", async ({ page }) => {
    await page.goto("/");

    const nav = page.getByRole("navigation", { name: "Main navigation" });
    const homeLink = nav.getByRole("link", { name: /^home$/i });
    await expect(homeLink).toHaveAttribute("aria-current", "page");
  });

  test("mobile drawer Home link has aria-current=page at /", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/");

    await page.getByRole("button", { name: "Toggle navigation menu" }).click();

    const dialog = page.getByRole("dialog");
    const homeLink = dialog.getByRole("link", { name: /^home$/i });
    await expect(homeLink).toHaveAttribute("aria-current", "page");
  });

  test("no nav link shows the active style away from its route", async ({
    page,
  }) => {
    await page.goto("/energy-planner");

    const nav = page.getByRole("navigation", { name: "Main navigation" });
    const homeLink = nav.getByRole("link", { name: /^home$/i });
    await expect(homeLink).not.toHaveAttribute("aria-current", "page");
  });

  test("desktop Projects menu link is active on its route", async ({
    page,
  }) => {
    // Static case-study route — fast to render and no first-visit app modal.
    await page.goto("/projects/energy-planner");

    const nav = page.getByRole("navigation", { name: "Main navigation" });
    // Mega-menu links live in the DOM whether or not the menu is open;
    // aria-current is the semantic active state asserted here.
    const caseLink = nav.locator('a[href="/projects/energy-planner"]');
    await expect(caseLink).toHaveAttribute("aria-current", "page");

    // A non-current menu link (the matching live app) stays inactive.
    const liveLink = nav.locator('a[href="/energy-planner"]');
    await expect(liveLink).not.toHaveAttribute("aria-current", "page");
  });

  test("mobile drawer project sublink is active on its route", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    // Use a static case-study route — the app routes show a first-visit modal
    // that would intercept the drawer toggle.
    await page.goto("/projects/energy-planner");

    await page.getByRole("button", { name: "Toggle navigation menu" }).click();
    const dialog = page.getByRole("dialog");

    const caseLink = dialog.locator('a[href="/projects/energy-planner"]');
    await expect(caseLink).toHaveAttribute("aria-current", "page");
  });
});
