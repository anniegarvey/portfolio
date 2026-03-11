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
    expect(manifest.name).toBe("Energy Planner");
    expect(manifest.short_name).toBe("Energy Planner");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/energy-planner");
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test("should render the offline fallback page correctly", async ({
    page,
  }) => {
    // Navigate directly to the offline route
    await page.goto("/~offline");

    // Check for the main heading
    await expect(
      page.getByRole("heading", { name: "You are offline" }),
    ).toBeVisible();

    // Check for the explanatory text
    await expect(
      page.getByText("It seems there's a problem with your connection."),
    ).toBeVisible();

    // Check for the Try Again button
    const tryAgainButton = page.getByRole("button", { name: "Try Again" });
    await expect(tryAgainButton).toBeVisible();

    // Check for the return navigation button
    const goBackButton = page.getByRole("button", {
      name: "Go to Energy Planner",
    });
    await expect(goBackButton).toBeVisible();
  });
});
