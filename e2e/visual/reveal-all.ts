import type { Locator, Page } from "@playwright/test";

/**
 * Returns locators for elements that should always be masked in visual regression
 * screenshots to prevent non-deterministic pixels. Currently: the Next.js dev
 * toolbar, whose issue-count badge changes between server restarts.
 */
export function getDevToolsMask(page: Page): Locator[] {
  return [
    page
      .getByRole("button", { name: "Open Next.js Dev Tools" })
      .locator("xpath=.."),
  ];
}

/**
 * Scrolls through the full page to trigger IntersectionObserver-based reveals
 * (FadeIn components), then returns to the top before a screenshot is taken.
 */
export async function revealAll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    const total = document.body.scrollHeight;
    let pos = 0;
    while (pos < total) {
      pos = Math.min(pos + step, total);
      window.scrollTo(0, pos);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 100));
  });
}
