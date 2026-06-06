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
});
