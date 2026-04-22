import { v4 as uuidv4 } from "uuid";
import { type BonsaiGameState, BonsaiGameStateSchema } from "./schema";

const BONSAI_STORAGE_KEY = "bonsai-game-state";

// ─── Branch ID Migration ──────────────────────────────────────────────────────
// Phase 3 renamed primary-branch IDs from L{i}/R{i} to p{n} (sequential).
// Mapping: L{i} → p{2i}, R{i} → p{2i+1}. Child segments are preserved.
// Example: "L0-a-b" → "p0-a-b", "R1-a" → "p3-a".
function migrateBranchId(id: string): string {
  const dashIdx = id.indexOf("-");
  const root = dashIdx === -1 ? id : id.slice(0, dashIdx);
  const rest = dashIdx === -1 ? "" : id.slice(dashIdx); // includes leading "-"

  const leftMatch = root.match(/^L(\d+)$/);
  if (leftMatch) return `p${2 * parseInt(leftMatch[1], 10)}${rest}`;

  const rightMatch = root.match(/^R(\d+)$/);
  if (rightMatch) return `p${2 * parseInt(rightMatch[1], 10) + 1}${rest}`;

  return id; // already new format (e.g., "p0", "apex-L")
}

export function loadBonsaiState(): BonsaiGameState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(BONSAI_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const result = BonsaiGameStateSchema.safeParse(parsed);
    if (!result.success) return null;
    // Migrate any saved branch IDs written before Phase 3
    for (const tree of result.data.trees) {
      tree.prunedBranches = tree.prunedBranches.map((pb) => ({
        ...pb,
        branchId: migrateBranchId(pb.branchId),
      }));
    }
    return result.data;
  } catch {
    return null;
  }
}

export function saveBonsaiState(state: BonsaiGameState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BONSAI_STORAGE_KEY, JSON.stringify(state));
}

export function createInitialState(): BonsaiGameState {
  return {
    trees: [
      {
        id: uuidv4(),
        speciesId: "pine",
        name: "Pine 1",
        activeDaysCount: 0,
        acquiredAt: new Date().toISOString().split("T")[0],
        prunedBranches: [],
        gardenPosition: { x: 50, y: 50 },
        equippedPotId: "simple-clay-small",
      },
    ],
    inventory: {
      ownedSpeciesIds: [],
      ownedToolIds: [],
      ownedFertiliserIds: [],
      ownedPotIds: ["simple-clay-small"],
      ownedStandIds: [],
      ownedBackgroundIds: [],
    },
  };
}
