import { v4 as uuidv4 } from "uuid";
import { FERTILISER_EFFECTS, SHOP_CATALOG } from "./catalog";
import type {
  BackgroundId,
  BonsaiGameState,
  BonsaiTree,
  FertiliserId,
  GardenPosition,
  PotId,
  SpeciesId,
  StandId,
} from "./schema";
import { SPECIES_CONFIG } from "./speciesConfig";

export function computeAvailablePotCount(
  state: BonsaiGameState,
  excludeTreeId?: string,
): number {
  const counts = new Map<PotId, number>();
  for (const potId of state.inventory.ownedPotIds) {
    counts.set(potId, (counts.get(potId) ?? 0) + 1);
  }
  for (const tree of state.trees) {
    if (tree.id === excludeTreeId || !tree.equippedPotId) continue;
    const c = counts.get(tree.equippedPotId) ?? 0;
    if (c > 0) counts.set(tree.equippedPotId, c - 1);
  }
  return [...counts.values()].reduce((sum, c) => sum + c, 0);
}

export function cheapestAvailablePot(state: BonsaiGameState): PotId | null {
  const counts = new Map<PotId, number>();
  for (const potId of state.inventory.ownedPotIds) {
    counts.set(potId, (counts.get(potId) ?? 0) + 1);
  }
  for (const tree of state.trees) {
    if (!tree.equippedPotId) continue;
    const c = counts.get(tree.equippedPotId) ?? 0;
    if (c > 0) counts.set(tree.equippedPotId, c - 1);
  }
  const available = [...counts.entries()]
    .filter(([, c]) => c > 0)
    .map(([id]) => id);
  if (available.length === 0) return null;
  return available.sort((a, b) => {
    const costA = SHOP_CATALOG.find((i) => i.id === a)?.cost ?? 0;
    const costB = SHOP_CATALOG.find((i) => i.id === b)?.cost ?? 0;
    return costA - costB;
  })[0];
}

/**
 * Plants a species from inventory at the given position.
 * Returns null if the species is not owned or no pot is available.
 * Caller supplies acquiredAt (today's date string) so this stays pure.
 */
export function plantTree(
  state: BonsaiGameState,
  speciesId: SpeciesId,
  position: GardenPosition,
  acquiredAt: string,
): BonsaiGameState | null {
  if (!state.inventory.ownedSpeciesIds.includes(speciesId)) return null;
  const potId = cheapestAvailablePot(state);
  if (!potId) return null;

  const sameSp = state.trees.filter((t) => t.speciesId === speciesId).length;
  const newTree: BonsaiTree = {
    id: uuidv4(),
    speciesId,
    name: `${SPECIES_CONFIG[speciesId].label} ${sameSp + 1}`,
    activeDaysCount: 0,
    acquiredAt,
    prunedBranches: [],
    gardenPosition: position,
    equippedPotId: potId,
  };
  const ownedSpeciesIds = [...state.inventory.ownedSpeciesIds];
  const idx = ownedSpeciesIds.indexOf(speciesId);
  ownedSpeciesIds.splice(idx, 1);
  return {
    ...state,
    trees: [newTree, ...state.trees],
    inventory: { ...state.inventory, ownedSpeciesIds },
  };
}

export function equipPot(
  state: BonsaiGameState,
  treeId: string,
  potId: PotId,
): BonsaiGameState {
  return {
    ...state,
    trees: state.trees.map((t) =>
      t.id === treeId ? { ...t, equippedPotId: potId } : t,
    ),
  };
}

export function equipStand(
  state: BonsaiGameState,
  treeId: string,
  standId: StandId,
): BonsaiGameState {
  return {
    ...state,
    trees: state.trees.map((t) =>
      t.id === treeId ? { ...t, equippedStandId: standId } : t,
    ),
  };
}

export function unequipStand(
  state: BonsaiGameState,
  treeId: string,
): BonsaiGameState {
  return {
    ...state,
    trees: state.trees.map((t) =>
      t.id === treeId ? { ...t, equippedStandId: undefined } : t,
    ),
  };
}

export function equipBackground(
  state: BonsaiGameState,
  backgroundId: BackgroundId,
): BonsaiGameState {
  return {
    ...state,
    inventory: { ...state.inventory, equippedBackgroundId: backgroundId },
  };
}

export function applyFertiliser(
  state: BonsaiGameState,
  treeId: string,
  fertiliserId: FertiliserId,
): { state: BonsaiGameState; applied: boolean } {
  const idx = state.inventory.ownedFertiliserIds.indexOf(fertiliserId);
  if (idx === -1) return { state, applied: false };
  const tree = state.trees.find((t) => t.id === treeId);
  if (!tree) return { state, applied: false };

  const effect = FERTILISER_EFFECTS[fertiliserId];
  const existing = tree.activeFertilisers ?? {};
  const newFertilisers =
    effect.type === "growth-tonic"
      ? {
          ...existing,
          growthTonic: {
            expiresAtDay: tree.activeDaysCount + effect.duration,
            bonusPerTick: effect.bonusPerTick,
          },
        }
      : {
          ...existing,
          moistureKeeper: {
            expiresAtDay: tree.activeDaysCount + effect.duration,
            retentionDays: effect.retentionDays,
          },
        };

  const ownedFertiliserIds = [...state.inventory.ownedFertiliserIds];
  ownedFertiliserIds.splice(idx, 1);

  return {
    state: {
      ...state,
      inventory: { ...state.inventory, ownedFertiliserIds },
      trees: state.trees.map((t) =>
        t.id === treeId ? { ...t, activeFertilisers: newFertilisers } : t,
      ),
    },
    applied: true,
  };
}

export function waterTree(
  state: BonsaiGameState,
  treeId: string,
): BonsaiGameState {
  const hasWateringTool =
    state.inventory.ownedToolIds.includes("watering-can") ||
    state.inventory.ownedToolIds.includes("garden-hose");
  if (!hasWateringTool) return state;
  return {
    ...state,
    trees: state.trees.map((t) =>
      t.id === treeId ? { ...t, lastWateredDay: t.activeDaysCount } : t,
    ),
  };
}
