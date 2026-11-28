import { expect, type Page, test } from "@playwright/test";
import type { Activity } from "@/lib/energy-planner/schema";
import { DEFAULT_CAPACITY, TODAY } from "../utils/mocks";
import { seedEnergyPlannerStorage } from "../utils/seed-storage";

test.describe.configure({ mode: "serial" });

const DAY = 24 * 60 * 60 * 1000;

const idea = (
  n: number,
  title: string,
  daysAgo: number,
  energyCost: Activity["energyCost"],
  helpers?: string[],
): Activity => ({
  id: `bbbbbbbb-0000-0000-0000-00000000000${n}`,
  title,
  energyCost,
  factors: {
    initiationDifficulty: 0,
    terminationDifficulty: 0,
    isRestorative: false,
  },
  // Midday, so the age reads the same whenever the test runs
  createdAt: new Date(
    new Date(`${TODAY}T12:00:00`).getTime() - daysAgo * DAY,
  ),
  helpers,
});

const IDEAS = [
  idea(1, "Ask Jo about the allotment", 0, {}),
  idea(2, "Repot the monstera", 2, { physical: 15, executive: 5 }),
  idea(3, "Research a new sketchbook", 16, { executive: 10 }, ["Audiobook"]),
  idea(4, "Sort the photo backup", 36, { executive: 25 }),
];

async function openPlanner(page: Page, theme: "light" | "dark") {
  await seedEnergyPlannerStorage(page, {
    activities: IDEAS,
    dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
  });
  await page.evaluate((t) => localStorage.setItem("theme", t), theme);
  await page.goto("/energy-planner");
  await page.getByText("Sort the photo backup").waitFor();
  await page.waitForLoadState("networkidle");
}

for (const theme of ["light", "dark"] as const) {
  test(`jot box, ${theme}`, async ({ page }) => {
    await openPlanner(page, theme);
    const box = page.getByRole("textbox", { name: "Jot down an idea" });
    await box.fill("Book the boiler service");
    await box.press("Enter");
    await expect(page.locator("form").filter({ has: box })).toHaveScreenshot(
      `jot-box-${theme}.png`,
    );
  });

  test(`ideas shelf, ${theme}`, async ({ page }) => {
    await openPlanner(page, theme);
    await expect(page.getByTestId("ideas-shelf")).toHaveScreenshot(
      `ideas-shelf-${theme}.png`,
    );
  });
}
