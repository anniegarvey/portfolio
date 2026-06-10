import type { Page } from "@playwright/test";

const GLADE_KEY = "glade-game-state";
const POINTS_KEY = "energy-planner-points";

const FIXED_VISITOR_ID = "00000000-0000-4000-8000-000000000001";

export interface GladeSeedOptions {
  visitorSpeciesId?: string;
  visitorTrust?: number;
  ingredients?: Record<string, number>;
  treats?: Record<string, number>;
  skills?: Record<string, { tier: number; xp: number }>;
  residents?: { speciesId: string; x: number; y: number }[];
  points?: number;
}

/**
 * Build a minimal valid glade game state for use in E2E tests.
 * `lastAdvanceDate` is filled in with the browser's local date at seed time
 * so the daily advance doesn't fire (and spawn random visitors) on load.
 */
export function makeGladeGameState(opts: GladeSeedOptions = {}) {
  return {
    visitors: [
      {
        id: FIXED_VISITOR_ID,
        speciesId: opts.visitorSpeciesId ?? "robin",
        trust: opts.visitorTrust ?? 0,
        arrivedDate: "2025-01-01",
        actionsToday: { treat: false, approach: false, pet: false },
      },
    ],
    residents: (opts.residents ?? []).map((r, i) => ({
      id: `00000000-0000-4000-8000-00000000010${i}`,
      speciesId: r.speciesId,
      tamedDate: "2025-01-01",
      position: { x: r.x, y: r.y },
    })),
    skills: opts.skills ?? {
      "treat-cooking": { tier: 1, xp: 0 },
      "body-language": { tier: 1, xp: 0 },
      "petting-technique": { tier: 1, xp: 0 },
    },
    pantry: {
      ingredients: opts.ingredients ?? { berries: 4, oats: 4 },
      treats: opts.treats ?? {},
    },
  };
}

/**
 * Seeds glade localStorage and navigates to the /glade page.
 * Must be called before interacting with the page.
 */
export async function goToGladeWithSeed(
  page: Page,
  opts: GladeSeedOptions = {},
): Promise<void> {
  // Navigate first to establish the correct origin
  await page.goto("/glade", { waitUntil: "domcontentloaded" });

  await page.evaluate(
    ({ gameStateJson, pointsStr, gladeKey, pointsKey }) => {
      const state = JSON.parse(gameStateJson);
      // Same local-date format as getTodayDateString()
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      state.lastAdvanceDate = `${y}-${m}-${d}`;
      localStorage.setItem(gladeKey, JSON.stringify(state));
      if (pointsStr !== null) {
        localStorage.setItem(pointsKey, pointsStr);
      }
    },
    {
      gameStateJson: JSON.stringify(makeGladeGameState(opts)),
      pointsStr: opts.points != null ? String(opts.points) : null,
      gladeKey: GLADE_KEY,
      pointsKey: POINTS_KEY,
    },
  );

  await page.reload();
}
