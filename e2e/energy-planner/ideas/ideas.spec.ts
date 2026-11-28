import type { Activity } from "@/lib/energy-planner/schema";
import {
  expect,
  test,
  violationFingerprints,
} from "../../utils/accessibility-test";
import { DEFAULT_CAPACITY, TODAY } from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

const DAY = 24 * 60 * 60 * 1000;

const idea = (n: number, title: string, daysAgo: number): Activity => ({
  id: `aaaaaaaa-0000-0000-0000-00000000000${n}`,
  title,
  energyCost: { physical: 10 * n },
  factors: {
    initiationDifficulty: 0,
    terminationDifficulty: 0,
    isRestorative: false,
  },
  createdAt: new Date(Date.now() - daysAgo * DAY),
});

test.describe("Jotting down and planning ideas", () => {
  test.beforeEach(async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      activities: [
        idea(1, "Repot the monstera", 2),
        idea(3, "Sort the photo backup", 36),
      ],
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });
  });

  test("a jotted idea waits on the shelf", async ({ page, makeAxeBuilder }) => {
    const box = page.getByRole("textbox", { name: "Jot down an idea" });
    await box.fill("Book the boiler service");
    await box.press("Enter");

    await expect(box).toHaveValue("");
    await expect(
      page.getByText("Saved “Book the boiler service” to your ideas"),
    ).toBeVisible();
    const shelf = page.getByTestId("ideas-shelf");
    await expect(
      shelf.getByRole("heading", { name: "Waiting to be planned (3)" }),
    ).toBeVisible();
    await expect(shelf.getByText("Book the boiler service")).toBeVisible();
    await expect(shelf.getByText("5 weeks")).toBeVisible();

    const results = await makeAxeBuilder()
      .include('[data-testid="ideas-shelf"]')
      .analyze();
    expect(violationFingerprints(results)).toBe("[]");
  });

  test("ideas can be sorted", async ({ page }) => {
    const shelf = page.getByTestId("ideas-shelf");
    const names = shelf.getByRole("button", { name: /^(Repot|Sort) / });
    await expect(names).toHaveText([
      "Repot the monstera",
      "Sort the photo backup",
    ]);

    await shelf.getByRole("combobox", { name: "Sort ideas" }).click();
    await page.getByRole("option", { name: "Most energy first" }).click();

    await expect(names).toHaveText([
      "Sort the photo backup",
      "Repot the monstera",
    ]);
  });

  test("dragging an idea into a zone plans it there", async ({ page }) => {
    const handle = page.getByRole("button", {
      name: "Drag into the day: Sort the photo backup",
    });
    await handle.scrollIntoViewIfNeeded();
    const from = await handle.boundingBox();
    const zone = page.getByTestId("zone-afternoon");
    const to = await zone.boundingBox();
    if (!(from && to)) throw new Error("Missing drag target");

    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y - 20, { steps: 5 });
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
      steps: 20,
    });
    await page.mouse.up();

    await expect(zone.getByText("Sort the photo backup")).toBeVisible();
    await expect(
      page.getByTestId("ideas-shelf").getByText("Sort the photo backup"),
    ).toHaveCount(0);
  });
});

test.describe("Opening the installed app", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const matchMedia = window.matchMedia.bind(window);
      window.matchMedia = (query) =>
        query === "(display-mode: standalone)"
          ? ({ ...matchMedia(query), matches: true } as MediaQueryList)
          : matchMedia(query);
    });
  });

  test("starts in the jot box", async ({ page }) => {
    await goToEnergyPlannerWithSeed(page, {
      dayPlans: { [TODAY]: { dailyCapacity: DEFAULT_CAPACITY } },
    });
    await expect(
      page.getByRole("textbox", { name: "Jot down an idea" }),
    ).toBeFocused();
  });

  test("goes to the jot box after the daily energy prompt", async ({
    page,
  }) => {
    await goToEnergyPlannerWithSeed(page, {});
    await page
      .getByRole("dialog", { name: "Daily Energy Capacity" })
      .getByRole("button", { name: "Save" })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Jot down an idea" }),
    ).toBeFocused();
  });
});
