import type { Page } from "@playwright/test";

const BONSAI_KEY = "bonsai-game-state-v2";
const POINTS_KEY = "energy-planner-points";
const LAST_ACTIVE_KEY = "energy-planner-last-active-date";

const FIXED_TREE_ID = "00000000-0000-4000-8000-000000000001";

export interface BonsaiSeedOptions {
  activeDaysCount?: number;
  lastWateredDay?: number;
  ownedSpeciesIds?: string[];
  ownedToolIds?: string[];
  ownedPotIds?: string[];
  ownedStandIds?: string[];
  ownedFertiliserIds?: string[];
  points?: number;
  /** Navigate with `?demo=1` to enable the manual day-advance affordances. */
  demoMode?: boolean;
  /**
   * Mark the energy planner as used today, which is what makes the page apply
   * the daily growth on load. This is how real players' trees grow — the
   * day-advance affordances are a demo aid.
   */
  plannerActiveToday?: boolean;
  equippedBackgroundId?: string;
}

/**
 * Build a minimal valid bonsai game state for use in E2E tests.
 * Returns a plain object that JSON.stringify handles safely.
 */
export function makeBonsaiGameState(opts: BonsaiSeedOptions = {}) {
  return {
    trees: [
      {
        id: FIXED_TREE_ID,
        speciesId: "pine",
        name: "Pine 1",
        activeDaysCount: opts.activeDaysCount ?? 0,
        ...(opts.lastWateredDay != null
          ? { lastWateredDay: opts.lastWateredDay }
          : {}),
        acquiredAt: "2025-01-01",
        prunedBranches: [],
        gardenPosition: { x: 50, y: 50 },
        equippedPotId: "simple-clay-small",
      },
    ],
    inventory: {
      ownedSpeciesIds: opts.ownedSpeciesIds ?? [],
      ownedToolIds: opts.ownedToolIds ?? [],
      ownedFertiliserIds: opts.ownedFertiliserIds ?? [],
      // All trees require a pot; initial state includes one for the starter pine
      // plus a spare so new seeds can be planted without buying a pot first
      ownedPotIds: opts.ownedPotIds ?? [
        "simple-clay-small",
        "simple-clay-small",
      ],
      ownedStandIds: opts.ownedStandIds ?? [],
      ...(opts.equippedBackgroundId
        ? {
            equippedBackgroundId: opts.equippedBackgroundId,
            ownedBackgroundIds: [opts.equippedBackgroundId],
          }
        : {}),
    },
  };
}

/**
 * Seeds bonsai localStorage and navigates to the /bonsai page.
 * Must be called before interacting with the page.
 */
export async function goToBonsaiWithSeed(
  page: Page,
  opts: BonsaiSeedOptions = {},
): Promise<void> {
  // Navigate first to establish the correct origin
  const url = opts.demoMode ? "/bonsai?demo=1" : "/bonsai";
  await page.goto(url, { waitUntil: "domcontentloaded" });

  await page.evaluate(
    ({
      gameStateJson,
      pointsStr,
      activeDate,
      bonsaiKey,
      pointsKey,
      lastKey,
    }) => {
      localStorage.setItem(bonsaiKey, gameStateJson);
      if (pointsStr !== null) {
        localStorage.setItem(pointsKey, pointsStr);
      }
      if (activeDate !== null) {
        localStorage.setItem(lastKey, activeDate);
      }
    },
    {
      gameStateJson: JSON.stringify(makeBonsaiGameState(opts)),
      pointsStr: opts.points != null ? String(opts.points) : null,
      activeDate: opts.plannerActiveToday
        ? new Date().toISOString().split("T")[0]
        : null,
      bonsaiKey: BONSAI_KEY,
      pointsKey: POINTS_KEY,
      lastKey: LAST_ACTIVE_KEY,
    },
  );

  await page.reload();
}
