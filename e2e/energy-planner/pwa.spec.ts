import { expect, test } from "@playwright/test";

test.describe("PWA Metadata and Offline Capabilities", () => {
  test("should inject PWA metadata into the document head", async ({
    page,
  }) => {
    await page.goto("/energy-planner");

    // Check for Web App Manifest link
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute("href", "/manifest.json");

    // Check for Theme Color meta tag
    const themeColorMeta = page.locator('meta[name="theme-color"]');
    await expect(themeColorMeta).toHaveAttribute("content", "#1e293b");

    // Check for Apple Touch Icon link
    const appleTouchIconLink = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleTouchIconLink).toHaveAttribute("href", "/icon-192.png");
  });

  test("should serve a valid web app manifest", async ({ request }) => {
    const response = await request.get("/manifest.json");
    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();
    expect(manifest.name).toBe("Annie Garvey");
    expect(manifest.short_name).toBe("Annie Garvey");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/energy-planner");
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});
