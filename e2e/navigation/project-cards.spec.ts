import { expect, test } from "@playwright/test";

const MOBILE_VIEWPORT = { width: 390, height: 844 };

const PROJECT_DESCRIPTIONS = [
  "An extended spoon theory tool for managing daily energy and activities",
  "A bonsai growing simulation with realistic procedural tree generation, gamification providing rewards for Energy Planner interaction",
  "A multilingual song of unity created in response to the invasion of Ukraine",
  "A WordPress site for a Wind Energy Storage startup — still live today",
];

test.describe("Project cards", () => {
  test("descriptions are visible on mobile without hover", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/");

    // No hover/interaction is simulated — descriptions must be visible at rest.
    for (const description of PROJECT_DESCRIPTIONS) {
      await expect(page.getByText(description, { exact: true })).toBeVisible();
    }
  });
});
