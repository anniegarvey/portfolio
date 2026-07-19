import { v4 as uuidv4 } from "uuid";
import { getTodayDateString } from "@/lib/date";
import { type GladeState, GladeStateSchema } from "./schema";

const GLADE_STORAGE_KEY = "glade-game-state";

export function loadGladeState(): GladeState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(GLADE_STORAGE_KEY);
  if (raw === null) return null;
  try {
    const result = GladeStateSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function saveGladeState(state: GladeState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GLADE_STORAGE_KEY, JSON.stringify(state));
}

/** A fresh glade: one friendly robin visiting, starter ingredients, tier-1 skills. */
export function createInitialState(): GladeState {
  return {
    visitors: [
      {
        id: uuidv4(),
        speciesId: "robin",
        trust: 0,
        arrivedDate: getTodayDateString(),
        actionsToday: { treat: false, approach: false, pet: false },
      },
    ],
    residents: [],
    skills: {
      "treat-cooking": { tier: 1, xp: 0 },
      "body-language": { tier: 1, xp: 0 },
      "petting-technique": { tier: 1, xp: 0 },
    },
    pantry: {
      ingredients: { berries: 4, oats: 4 },
      treats: {},
    },
    speciesTrust: {},
    // Day one's arrival is the starter robin — no extra spawn on first mount.
    lastAdvanceDate: getTodayDateString(),
  };
}
