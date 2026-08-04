import { v4 as uuidv4 } from "uuid";
import { getTodayDateString } from "@/lib/date";
import { STARTING_PLOTS } from "./catalog";
import { type MeadowmereState, MeadowmereStateSchema } from "./schema";

const MEADOWMERE_STORAGE_KEY = "meadowmere-game-state";

export function loadMeadowmereState(): MeadowmereState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(MEADOWMERE_STORAGE_KEY);
  if (raw === null) return null;
  try {
    const result = MeadowmereStateSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function saveMeadowmereState(state: MeadowmereState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MEADOWMERE_STORAGE_KEY, JSON.stringify(state));
}

export function makeEmptyPlots(count: number): MeadowmereState["plots"] {
  return Array.from({ length: count }, () => ({
    id: uuidv4(),
    planting: null,
  }));
}

/** A fresh smallholding: six bare plots, a handful of parsnip seeds, the hedgerow. */
export function createInitialState(): MeadowmereState {
  return {
    plots: makeEmptyPlots(STARTING_PLOTS),
    seeds: { parsnip: 6 },
    inventory: {},
    neighbours: {
      nessa: { friendship: 0 },
      bram: { friendship: 0 },
      marigold: { friendship: 0 },
    },
    unlockedCropIds: ["parsnip"],
    unlockedSiteIds: ["hedgerow"],
    completedQuestIds: [],
    foragesToday: 0,
    // Day one is already spent — the first advance happens tomorrow.
    lastAdvanceDate: getTodayDateString(),
  };
}

/** The pre-hydration state rendered on the server; identical on both sides. */
export const EMPTY_STATE: MeadowmereState = {
  plots: [],
  seeds: {},
  inventory: {},
  neighbours: {},
  unlockedCropIds: [],
  unlockedSiteIds: [],
  completedQuestIds: [],
  foragesToday: 0,
};
