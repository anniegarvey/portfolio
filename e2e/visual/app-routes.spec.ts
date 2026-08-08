import { expect, type Page, test } from "@playwright/test";
import {
  DEFAULT_CAPACITY,
  mockOneOffActivity,
  mockPlannedInstance,
  mockRepeatingActivity,
  TODAY,
} from "../utils/mocks";
import { makeBonsaiGameState } from "../utils/seed-bonsai";
import { makeGladeGameState } from "../utils/seed-glade";
import { makeMeadowmereGameState } from "../utils/seed-meadowmere";
import { seedEnergyPlannerStorage } from "../utils/seed-storage";
import { getDevToolsMask } from "./reveal-all";

// Visual snapshot tests are sensitive to concurrent server load; run this
// file sequentially so renders are stable across the full suite.
test.describe.configure({ mode: "serial" });

const EP_SEED = {
  activities: [mockOneOffActivity, mockRepeatingActivity],
  dayPlans: {
    [TODAY]: {
      dailyCapacity: DEFAULT_CAPACITY,
      plannedInstances: [
        mockPlannedInstance(mockOneOffActivity.id),
        mockPlannedInstance(mockRepeatingActivity.id),
      ],
    },
  },
};

const BONSAI_STATE = JSON.stringify(
  makeBonsaiGameState({ activeDaysCount: 15 }),
);
const BONSAI_KEY = "bonsai-game-state-v2";

const GLADE_STATE = JSON.stringify(makeGladeGameState());
const GLADE_KEY = "glade-game-state";

// A farm mid-run: crops at three different stages, a stocked larder, and the
// riverbank opened, so the snapshot covers most of what the Vale can draw.
interface MeadowmerePlotSeed {
  cropId: string;
  plantedDaysAgo: number;
  wateredToday?: boolean;
}

const MEADOWMERE_PLOTS: (MeadowmerePlotSeed | null)[] = [
  { cropId: "parsnip", plantedDaysAgo: 2 },
  { cropId: "cornflower", plantedDaysAgo: 1, wateredToday: true },
  { cropId: "strawberry", plantedDaysAgo: 0 },
  null,
  { cropId: "pumpkin", plantedDaysAgo: 5 },
  null,
];

const MEADOWMERE_STATE = JSON.stringify(
  makeMeadowmereGameState({
    plots: MEADOWMERE_PLOTS,
    seeds: { parsnip: 3, cornflower: 1 },
    inventory: { acorn: 2, "river-clay": 1 },
    unlockedCropIds: ["parsnip", "cornflower", "strawberry", "pumpkin"],
    unlockedSiteIds: ["hedgerow", "riverbank"],
    completedQuestIds: ["a-bed-for-parsnips"],
  }),
);
const MEADOWMERE_KEY = "meadowmere-game-state";

/**
 * The Vale draws one thing that depends on the calendar rather than on the save:
 * the barn cat takes a new perch each morning, chosen from the date the day last
 * advanced. So the clock is pinned before the page renders, or this snapshot
 * would only match on about one day in seven.
 */
const MEADOWMERE_PINNED_DAY = new Date("2026-06-20T10:00:00");

/**
 * Pins the clock, seeds the farm and loads the Vale. Planting dates are redone
 * against the pinned day: they are seeded relative to the real today, which is
 * months away from it, and a crop planted in the future has no growth stage.
 */
async function goToValeAtPinnedTime(page: Page, theme: "light" | "dark") {
  await page.clock.setFixedTime(MEADOWMERE_PINNED_DAY);
  await page.goto("/meadowmere", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ stateJson, key, plots, themeValue }) => {
      const stamp = (date: Date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const state = JSON.parse(stateJson);
      // Stamped with the pinned today, so the daily advance doesn't fire and pop
      // a digest over the page — and so the cat's perch is the same every run.
      state.lastAdvanceDate = stamp(new Date());
      for (const [index, seed] of plots.entries()) {
        if (seed === null || state.plots[index].planting === null) continue;
        const planted = new Date();
        planted.setDate(planted.getDate() - seed.plantedDaysAgo);
        state.plots[index].planting.plantedDate = stamp(planted);
        if (state.plots[index].planting.lastWateredDate !== undefined) {
          state.plots[index].planting.lastWateredDate = stamp(new Date());
        }
      }
      localStorage.setItem(key, JSON.stringify(state));
      localStorage.setItem("theme", themeValue);
    },
    {
      stateJson: MEADOWMERE_STATE,
      key: MEADOWMERE_KEY,
      plots: MEADOWMERE_PLOTS,
      themeValue: theme,
    },
  );
  await page.reload();
  await page
    .getByRole("application", { name: "The Vale — Meadowmere's map" })
    .waitFor({ state: "visible" });
}

// ─── Energy Planner ────────────────────────────────────────────────────────────

test.describe("Energy Planner", () => {
  test.beforeEach(async ({ page }) => {
    // seedEnergyPlannerStorage navigates to "/" to establish origin before writing IDB
    await seedEnergyPlannerStorage(page, EP_SEED);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`${theme} theme`, async ({ page }) => {
      await page.evaluate((t) => localStorage.setItem("theme", t), theme);
      await page.goto("/energy-planner");
      await page
        .getByTestId("selected-activities")
        .waitFor({ state: "visible" });
      await page.waitForLoadState("networkidle");

      // Mask the date selector (changes daily) and the Next.js dev toolbar
      // (issue count varies between server restarts).
      const dateSelector = page
        .getByRole("button", { name: "Previous day" })
        .locator("xpath=..");
      // maxDiffPixels: the EP page renders under varying server load when
      // other e2e suites run concurrently; 200px (≈0.003% of image area)
      // absorbs sub-pixel font-hinting noise without hiding real regressions.
      await expect(page).toHaveScreenshot(`energy-planner-${theme}.png`, {
        fullPage: true,
        mask: [dateSelector, ...getDevToolsMask(page)],
        maxDiffPixels: 200,
      });
    });
  }
});

// ─── Bonsai ────────────────────────────────────────────────────────────────────

test.describe("Bonsai", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`${theme} theme`, async ({ page }) => {
      // Navigate first to establish the correct origin for localStorage
      await page.goto("/bonsai", { waitUntil: "domcontentloaded" });
      await page.evaluate(
        ({ stateJson, bonsaiKey, themeKey, themeValue }) => {
          localStorage.setItem(bonsaiKey, stateJson);
          localStorage.setItem(themeKey, themeValue);
        },
        {
          stateJson: BONSAI_STATE,
          bonsaiKey: BONSAI_KEY,
          themeKey: "theme",
          themeValue: theme,
        },
      );
      await page.reload();
      await page
        .getByRole("img", { name: /bonsai tree/i })
        .first()
        .waitFor({ state: "visible" });
      await expect(page).toHaveScreenshot(`bonsai-${theme}.png`, {
        fullPage: true,
        mask: getDevToolsMask(page),
      });
    });
  }
});

// ─── Glade ─────────────────────────────────────────────────────────────────────

test.describe("Glade", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`${theme} theme`, async ({ page }) => {
      await page.goto("/glade", { waitUntil: "domcontentloaded" });
      await page.evaluate(
        ({ gladeStateJson, gladeKey, themeKey, themeValue }) => {
          const state = JSON.parse(gladeStateJson);
          // Mirror the lastAdvanceDate logic from goToGladeWithSeed so the
          // daily advance doesn't fire on load and spawn random visitors.
          const now = new Date();
          state.lastAdvanceDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
          localStorage.setItem(gladeKey, JSON.stringify(state));
          localStorage.setItem(themeKey, themeValue);
        },
        {
          gladeStateJson: GLADE_STATE,
          gladeKey: GLADE_KEY,
          themeKey: "theme",
          themeValue: theme,
        },
      );
      await page.reload();
      await page
        .getByRole("region", { name: "Glade ecosystem" })
        .waitFor({ state: "visible" });
      await expect(page).toHaveScreenshot(`glade-${theme}.png`, {
        fullPage: true,
        mask: getDevToolsMask(page),
      });
    });
  }
});

// ─── Meadowmere ───────────────────────────────────────────────────────────────

test.describe("Meadowmere", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`${theme} theme`, async ({ page }) => {
      await goToValeAtPinnedTime(page, theme);
      await expect(page).toHaveScreenshot(`meadowmere-${theme}.png`, {
        fullPage: true,
        mask: getDevToolsMask(page),
      });
    });
  }

  // The Vale is the one page whose layout changes shape on a phone: the map
  // scrolls sideways behind an edge cue, and the prompt moves onto the map so
  // it survives a viewport the map is taller than.
  test("phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goToValeAtPinnedTime(page, "light");
    // What the player sees once they have scrolled to play, and viewport-only:
    // a full-page shot stretches the viewport, which moves the sticky prompt.
    // Scrolled to the very bottom rather than to the map — clamping to the
    // page's own limit is the one scroll position that doesn't move when a
    // font metric shifts the page's height by a few pixels.
    await page.evaluate(async () => {
      await document.fonts.ready;
      window.scrollTo(0, document.documentElement.scrollHeight);
    });

    await expect(page).toHaveScreenshot("meadowmere-phone.png", {
      mask: getDevToolsMask(page),
    });
  });
});
