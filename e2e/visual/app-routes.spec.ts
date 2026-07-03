import { expect, test } from "@playwright/test";
import {
  DEFAULT_CAPACITY,
  mockOneOffActivity,
  mockPlannedInstance,
  mockRepeatingActivity,
  TODAY,
} from "../utils/mocks";
import { makeBonsaiGameState } from "../utils/seed-bonsai";
import { makeGladeGameState } from "../utils/seed-glade";
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
