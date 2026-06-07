import { expect, test } from "../utils/accessibility-test";

const GITHUB_URL = "https://github.com/anniegarvey";
const LINKEDIN_URL = "https://www.linkedin.com/in/annie-garvey-208895110/";

test.describe("Contact CTA footer section", () => {
  test("appears at the bottom of the homepage with working CTAs", async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.goto("/");

    const section = page.getByRole("region", { name: "Get in touch" });
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
    await expect(
      section.getByRole("heading", {
        name: "Let's build something worth talking about",
      }),
    ).toBeVisible();

    const github = section.getByRole("link", { name: "GitHub profile" });
    const linkedin = section.getByRole("link", { name: "LinkedIn profile" });

    await expect(github).toHaveAttribute("href", GITHUB_URL);
    await expect(linkedin).toHaveAttribute("href", LINKEDIN_URL);

    // Both CTAs are reachable in the tab order.
    await github.focus();
    await expect(github).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(linkedin).toBeFocused();

    // Wait for the FadeIn opacity transition to settle so the axe colour-contrast
    // check measures the resting (fully opaque) state, not a mid-fade blend.
    await expect
      .poll(() =>
        section
          .locator(".fade-in-element")
          .evaluate((el) => getComputedStyle(el).opacity),
      )
      .toBe("1");

    const results = await makeAxeBuilder()
      .include('[aria-label="Get in touch"]')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
