import type { Activity } from "@/lib/energy-planner/schema";
import { expect, test } from "../utils/accessibility-test";
import { DEFAULT_CAPACITY, TODAY } from "../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../utils/seed-storage";

const baseActivity = (
  id: string,
  title: string,
  defaultZoneId?: string,
): Activity => ({
  id,
  title,
  energyCost: { physical: 5, social: 5, executive: 5 },
  factors: {
    initiationDifficulty: 1,
    terminationDifficulty: 1,
    isRestorative: false,
  },
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  repeatConfig: {
    frequency: 1,
    unit: "days",
    nextDueDate: TODAY,
    ...(defaultZoneId ? { defaultZoneId } : {}),
  },
});

test.describe("Ordering", () => {
  test("repeating activities in modal sort: no-zone first, then by zone order", async ({
    page,
  }) => {
    const activities: Activity[] = [
      baseActivity(
        "11111111-1111-1111-1111-111111111111",
        "Evening A",
        "evening",
      ),
      baseActivity(
        "22222222-2222-2222-2222-222222222222",
        "Morning A",
        "morning",
      ),
      baseActivity("33333333-3333-3333-3333-333333333333", "No-zone A"),
      baseActivity(
        "44444444-4444-4444-4444-444444444444",
        "Morning B",
        "morning",
      ),
      baseActivity("55555555-5555-5555-5555-555555555555", "No-zone B"),
    ];

    await goToEnergyPlannerWithSeed(page, {
      activities,
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });

    await page.getByRole("button", { name: "Manage Activities" }).click();
    const modal = page.getByRole("dialog", { name: "Available Activities" });
    await modal.getByRole("button", { name: "Repeating Activities" }).click();

    // Each card has its title as a button. Assert the visual order of the cards.
    const titleButtons = modal.getByRole("button", {
      name: /^(No-zone [AB]|Morning [AB]|Evening A)$/,
    });
    await expect(titleButtons).toHaveCount(5);
    const order = await titleButtons.allInnerTexts();

    expect(order).toEqual([
      "No-zone A",
      "No-zone B",
      "Morning A",
      "Morning B",
      "Evening A",
    ]);
  });

  test("completing a repeating activity keeps it in its current slot", async ({
    page,
  }) => {
    const activities: Activity[] = [
      baseActivity("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "Rep A"),
      baseActivity("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "Rep B"),
      baseActivity("cccccccc-cccc-cccc-cccc-cccccccccccc", "Rep C"),
    ];

    await goToEnergyPlannerWithSeed(page, {
      activities,
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });

    const planned = page.getByTestId("selected-activities");
    await expect(planned.getByText("Rep A")).toBeVisible();
    await expect(planned.getByText("Rep B")).toBeVisible();
    await expect(planned.getByText("Rep C")).toBeVisible();

    const beforeTitles = (
      await planned
        .locator("article")
        .filter({ hasText: /^Rep [ABC]/ })
        .allInnerTexts()
    ).map((t) => t.split("\n")[0].trim());
    expect(beforeTitles).toEqual(["Rep A", "Rep B", "Rep C"]);

    // Mark the middle one done — it must not jump position.
    const middleCard = planned
      .locator("article")
      .filter({ hasText: "Rep B" })
      .first();
    await middleCard.getByRole("button", { name: "Mark as done" }).click();

    const afterTitles = (
      await planned
        .locator("article")
        .filter({ hasText: /^Rep [ABC]/ })
        .allInnerTexts()
    ).map((t) => t.split("\n")[0].trim());

    expect(afterTitles).toEqual(["Rep A", "Rep B", "Rep C"]);
  });
});
