import type { Page } from "@playwright/test";

const MEADOWMERE_KEY = "meadowmere-game-state";
const POINTS_KEY = "energy-planner-points";

const PLOT_ID_PREFIX = "00000000-0000-4000-8000-00000000000";

function toLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dateDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toLocalDate(d);
}

export interface PlantingSeed {
  cropId: string;
  /** Days before today the seed went in; growth is derived from this. */
  plantedDaysAgo: number;
  wateredDays?: number;
  /** True to mark the planting as already watered today. */
  wateredToday?: boolean;
}

export interface MeadowmereSeedOptions {
  /** One entry per plot; null leaves the plot bare. Defaults to six bare plots. */
  plots?: (PlantingSeed | null)[];
  seeds?: Record<string, number>;
  inventory?: Record<string, number>;
  neighbours?: Record<string, { friendship: number; lastGiftDate?: string }>;
  unlockedCropIds?: string[];
  unlockedSiteIds?: string[];
  completedQuestIds?: string[];
  foragesToday?: number;
  points?: number;
}

/**
 * Builds a valid Meadowmere state for E2E tests. Plantings are dated relative
 * to today, so a crop seeded as `plantedDaysAgo: 3` is genuinely three days
 * grown when the page reads it.
 */
export function makeMeadowmereGameState(opts: MeadowmereSeedOptions = {}) {
  const plotSeeds = opts.plots ?? [null, null, null, null, null, null];

  return {
    plots: plotSeeds.map((planting, i) => ({
      id: `${PLOT_ID_PREFIX}${i}`,
      planting:
        planting === null
          ? null
          : {
              cropId: planting.cropId,
              plantedDate: dateDaysAgo(planting.plantedDaysAgo),
              wateredDays: planting.wateredDays ?? 0,
              ...(planting.wateredToday
                ? { lastWateredDate: dateDaysAgo(0) }
                : {}),
            },
    })),
    seeds: opts.seeds ?? { parsnip: 6 },
    inventory: opts.inventory ?? {},
    neighbours: opts.neighbours ?? {
      nessa: { friendship: 0 },
      bram: { friendship: 0 },
      marigold: { friendship: 0 },
    },
    unlockedCropIds: opts.unlockedCropIds ?? ["parsnip"],
    unlockedSiteIds: opts.unlockedSiteIds ?? ["hedgerow"],
    completedQuestIds: opts.completedQuestIds ?? [],
    foragesToday: opts.foragesToday ?? 0,
  };
}

/**
 * Seeds Meadowmere localStorage and navigates to /meadowmere.
 * `lastAdvanceDate` is stamped with the browser's local date so the daily
 * advance doesn't fire on load and pop a digest over the page.
 */
export async function goToMeadowmereWithSeed(
  page: Page,
  opts: MeadowmereSeedOptions = {},
): Promise<void> {
  // Navigate first to establish the correct origin
  await page.goto("/meadowmere", { waitUntil: "domcontentloaded" });

  await page.evaluate(
    ({ gameStateJson, pointsStr, key, pointsKey }) => {
      const state = JSON.parse(gameStateJson);
      // Same local-date format as getTodayDateString()
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      state.lastAdvanceDate = `${y}-${m}-${d}`;
      localStorage.setItem(key, JSON.stringify(state));
      if (pointsStr !== null) {
        localStorage.setItem(pointsKey, pointsStr);
      }
    },
    {
      gameStateJson: JSON.stringify(makeMeadowmereGameState(opts)),
      pointsStr: opts.points != null ? String(opts.points) : null,
      key: MEADOWMERE_KEY,
      pointsKey: POINTS_KEY,
    },
  );

  await page.reload();

  // The map is server-rendered from the empty state and only fills in on
  // mount, and the stall, the cottages and the sites are drawn either way — so
  // a click dispatched before hydration lands on a real button with no handler
  // behind it yet and is silently swallowed. Plots exist only once the client
  // state is in, so waiting for one is waiting for the map to be live.
  await page.getByRole("button", { name: /Plot 1/ }).waitFor();
}
