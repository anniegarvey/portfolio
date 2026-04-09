import type { Page } from "@playwright/test";

const BONSAI_KEY = "bonsai-game-state";
const POINTS_KEY = "energy-planner-points";

const FIXED_TREE_ID = "00000000-0000-4000-8000-000000000001";

export interface BonsaiSeedOptions {
  activeDaysCount?: number;
  lastWateredDay?: number;
  ownedSpeciesIds?: string[];
  ownedToolIds?: string[];
  points?: number;
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
      ownedFertiliserIds: [],
      // All trees require a pot; initial state includes one for the starter pine
      // plus a spare so new seeds can be planted without buying a pot first
      ownedPotIds: ["simple-clay-small", "simple-clay-small"],
      ownedStandIds: [],
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
  await page.goto("/bonsai", { waitUntil: "domcontentloaded" });

  await page.evaluate(
    ({ gameStateJson, pointsStr, bonsaiKey, pointsKey }) => {
      localStorage.setItem(bonsaiKey, gameStateJson);
      if (pointsStr !== null) {
        localStorage.setItem(pointsKey, pointsStr);
      }
    },
    {
      gameStateJson: JSON.stringify(makeBonsaiGameState(opts)),
      pointsStr: opts.points != null ? String(opts.points) : null,
      bonsaiKey: BONSAI_KEY,
      pointsKey: POINTS_KEY,
    },
  );

  await page.reload();
}
