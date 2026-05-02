import { v4 as uuidv4 } from "uuid";
import { type BonsaiGameState, BonsaiGameStateSchema } from "./schema";

// ─── Storage Keys ─────────────────────────────────────────────────────────────
// v1: pre-Phase-9 — branch IDs use the L{i}/R{i} scheme.
// v2: Phase-9 onward — branch IDs are p{n}, and the bumped key marks data as
// already migrated so we don't re-run the L/R parser on every load.
const BONSAI_STORAGE_KEY_V1 = "bonsai-game-state";
const BONSAI_STORAGE_KEY = "bonsai-game-state-v2";

// ─── Branch ID Migration (v1 → v2) ────────────────────────────────────────────
// Phase 3 renamed primary-branch IDs from L{i}/R{i} to p{n} (sequential).
// Mapping: L{i} → p{2i}, R{i} → p{2i+1}. Child segments are preserved.
// Example: "L0-a-b" → "p0-a-b", "R1-a" → "p3-a".
const LEFT_BRANCH_RE = /^L(\d+)$/;
const RIGHT_BRANCH_RE = /^R(\d+)$/;

function migrateBranchId(id: string): string {
  const dashIdx = id.indexOf("-");
  const root = dashIdx === -1 ? id : id.slice(0, dashIdx);
  const rest = dashIdx === -1 ? "" : id.slice(dashIdx); // includes leading "-"

  const leftMatch = root.match(LEFT_BRANCH_RE);
  if (leftMatch) return `p${2 * parseInt(leftMatch[1], 10)}${rest}`;

  const rightMatch = root.match(RIGHT_BRANCH_RE);
  if (rightMatch) return `p${2 * parseInt(rightMatch[1], 10) + 1}${rest}`;

  return id; // already new format (e.g., "p0", "apex-L")
}

function migrateV1State(state: BonsaiGameState): BonsaiGameState {
  return {
    ...state,
    trees: state.trees.map((tree) => ({
      ...tree,
      prunedBranches: tree.prunedBranches.map((pb) => ({
        ...pb,
        branchId: migrateBranchId(pb.branchId),
      })),
    })),
  };
}

function parseStoredState(raw: string): BonsaiGameState | null {
  try {
    const result = BonsaiGameStateSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function loadBonsaiState(): BonsaiGameState | null {
  if (typeof window === "undefined") return null;

  const v2Raw = localStorage.getItem(BONSAI_STORAGE_KEY);
  if (v2Raw !== null) return parseStoredState(v2Raw);

  const v1Raw = localStorage.getItem(BONSAI_STORAGE_KEY_V1);
  if (v1Raw === null) return null;

  const v1State = parseStoredState(v1Raw);
  if (v1State === null) return null;

  const migrated = migrateV1State(v1State);
  localStorage.setItem(BONSAI_STORAGE_KEY, JSON.stringify(migrated));
  localStorage.removeItem(BONSAI_STORAGE_KEY_V1);
  return migrated;
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
