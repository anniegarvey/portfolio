import { expect, test } from "@playwright/test";
import { getDevToolsMask, revealAll } from "./reveal-all";

// Visual snapshot tests are sensitive to concurrent server load; run this
// file sequentially so renders are stable across the full suite.
test.describe.configure({ mode: "serial" });

const ROUTES = [
  { name: "homepage", path: "/" },
  { name: "colour-palette", path: "/colour-palette" },
  { name: "project-energy-planner", path: "/projects/energy-planner" },
  { name: "project-bonsai", path: "/projects/bonsai" },
  { name: "project-one-anthem", path: "/projects/one-anthem" },
  { name: "project-windtp", path: "/projects/windtp" },
] as const;

for (const { name, path } of ROUTES) {
  test.describe(name, () => {
    for (const theme of ["light", "dark"] as const) {
      test(`${theme} theme`, async ({ page }) => {
        await page.goto("/");
        await page.evaluate((t) => localStorage.setItem("theme", t), theme);
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await revealAll(page);
        await expect(page).toHaveScreenshot(`${name}-${theme}.png`, {
          fullPage: true,
          mask: getDevToolsMask(page),
        });
      });
    }
  });
}
