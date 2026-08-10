import { expect, test } from "../utils/accessibility-test";

const MOBILE_VIEWPORT = { width: 390, height: 844 };

// Stub window.open so the test never files a real GitHub issue; the URL it
// would have opened is recorded on window.__opened for assertions.
async function stubWindowOpen(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    (window as unknown as { __opened: string[] }).__opened = [];
    window.open = (url) => {
      (window as unknown as { __opened: string[] }).__opened.push(String(url));
      return null;
    };
  });
}

test.describe("Suggestions", () => {
  test("desktop lightbulb button navigates to /suggestions", async ({
    page,
  }) => {
    await page.goto("/");

    // Lives in the desktop utility cluster beside the theme toggle, a
    // sibling of the <nav aria-label="Main navigation"> landmark.
    await page.getByRole("link", { name: "Suggest an improvement" }).click();

    await expect(page).toHaveURL("/suggestions");
    await expect(
      page.getByRole("heading", { name: "Suggest an Improvement" }),
    ).toBeVisible();
  });

  test("mobile top bar lightbulb button navigates to /suggestions", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/");

    await page.getByRole("link", { name: "Suggest an improvement" }).click();

    await expect(page).toHaveURL("/suggestions");
  });

  test("submitting the form opens a pre-filled GitHub issue URL", async ({
    page,
  }) => {
    await stubWindowOpen(page);
    await page.goto("/suggestions");

    const submit = page.getByRole("button", { name: "Continue to GitHub" });
    await expect(submit).toBeDisabled();

    await page.getByLabel("Title").fill("Add a dark mode toggle");
    await page
      .getByLabel("Description")
      .fill("It would be great to switch themes from the nav.");
    await expect(submit).toBeEnabled();
    await submit.click();

    const opened = await page.evaluate(
      () => (window as unknown as { __opened: string[] }).__opened,
    );
    expect(opened).toHaveLength(1);
    expect(opened[0]).toContain(
      "https://github.com/anniegarvey/portfolio/issues/new?",
    );
    expect(opened[0]).toContain("title=Add+a+dark+mode+toggle");
    expect(opened[0]).toContain("labels=enhancement");
  });

  test("meets accessibility standards", async ({ page, makeAxeBuilder }) => {
    await page.goto("/suggestions");
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
