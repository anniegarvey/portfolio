import { v4 as uuidv4 } from "uuid";
import { type BonsaiGameState, BonsaiGameStateSchema } from "./schema";

const BONSAI_STORAGE_KEY = "bonsai-game-state";

export function loadBonsaiState(): BonsaiGameState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(BONSAI_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const result = BonsaiGameStateSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function saveBonsaiState(state: BonsaiGameState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BONSAI_STORAGE_KEY, JSON.stringify(state));
}

export function createInitialState(): BonsaiGameState {
  const treeId = uuidv4();
  return {
    trees: [
      {
        id: treeId,
        speciesId: "pine",
        activeDaysCount: 0,
        acquiredAt: new Date().toISOString().split("T")[0],
        prunedBranches: [],
      },
    ],
    activePlantedTreeId: treeId,
    inventory: {
      ownedSpeciesIds: [],
      ownedToolIds: [],
      ownedFertiliserIds: [],
      ownedPotIds: [],
      ownedStandIds: [],
    },
  };
}
