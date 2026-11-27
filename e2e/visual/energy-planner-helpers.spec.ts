import { expect, type Page, test } from "@playwright/test";
import type { Activity } from "@/lib/energy-planner/schema";
import { mockPlannedInstance, mockStoredDayPlan, TODAY } from "../utils/mocks";
import { seedEnergyPlannerStorage } from "../utils/seed-storage";

test.describe.configure({ mode: "serial" });

const activity = (
  n: number,
  title: string,
  zone: string,
  helpers?: string[],
): Activity => ({
  id: `dddddddd-0000-0000-0000-00000000000${n}`,
  title,
  energyCost: { physical: 10, social: 0, executive: 15 },
  factors: {
    initiationDifficulty: 3,
    terminationDifficulty: 2,
    isRestorative: false,
  },
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  defaultZoneId: zone,
  helpers,
});

const ACTIVITIES = [
  activity(1, "Tidy the kitchen", "morning", ["Audiobook"]),
  activity(2, "Fold laundry", "morning", ["Audiobook", "Coffee", "Podcast"]),
  activity(3, "Answer emails", "afternoon", ["Upbeat music"]),
  activity(4, "Call the dentist", "afternoon"),
];

async function openPlanner(page: Page, theme: "light" | "dark") {
  await seedEnergyPlannerStorage(page, {
    activities: ACTIVITIES,
    dayPlans: {
      [TODAY]: mockStoredDayPlan(
        ACTIVITIES.map((a) =>
          mockPlannedInstance(a.id, { zoneId: a.defaultZoneId }),
        ),
      ),
    },
  });
  await page.evaluate((t) => localStorage.setItem("theme", t), theme);
  await page.goto("/energy-planner");
  await page.getByText("Fold laundry").waitFor();
  await page.waitForLoadState("networkidle");
}

for (const theme of ["light", "dark"] as const) {
  test(`helpers on the day plan, ${theme}`, async ({ page }) => {
    await openPlanner(page, theme);
    await expect(page.getByTestId("selected-activities")).toHaveScreenshot(
      `helpers-day-plan-${theme}.png`,
    );
  });

  test(`helpers in the activity form, ${theme}`, async ({ page }) => {
    await openPlanner(page, theme);
    await page
      .getByRole("button", { name: "Fold laundry", exact: true })
      .click();
    const trigger = page
      .getByRole("dialog", { name: "Edit Activity" })
      .getByRole("button", { name: /What would help you start\?/ });
    await trigger.scrollIntoViewIfNeeded();
    // The label, prompt, dropdown and "add your own" row
    await expect(trigger.locator("xpath=..")).toHaveScreenshot(
      `helpers-field-${theme}.png`,
    );

    await trigger.click();
    const menu = page.getByRole("menu");
    await menu.waitFor();
    await expect(menu).toHaveScreenshot(`helpers-menu-${theme}.png`);
  });
}
