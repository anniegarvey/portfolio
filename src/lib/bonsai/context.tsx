"use client";

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { usePoints } from "@/lib/points/context";
import { LAST_ACTIVE_DATE_KEY } from "@/lib/points/keys";
import type {
  BonsaiGameState,
  BonsaiTree,
  FertiliserId,
  GardenPosition,
  PotId,
  ShopItemId,
  SpeciesId,
  StandId,
  ToolId,
} from "./schema";
import { FERTILISER_EFFECTS, SHOP_CATALOG, SPECIES_CONFIG } from "./schema";
import {
  createInitialState,
  loadBonsaiState,
  saveBonsaiState,
} from "./storage";
import { BRANCH_GROW_DURATION } from "./treeGenerator";

// ─── Context Type ─────────────────────────────────────────────────────────────

export interface BonsaiContextType {
  state: BonsaiGameState;
  /** The species being placed right now, or null when not in placement mode. */
  placingSpeciesId: SpeciesId | null;
  beginPlanting: (speciesId: SpeciesId) => void;
  cancelPlanting: () => void;
  confirmPlantAt: (speciesId: SpeciesId, position: GardenPosition) => void;
  updateTreePosition: (treeId: string, position: GardenPosition) => void;
  buyItem: (itemId: ShopItemId) => boolean;
  equipPot: (treeId: string, potId: PotId) => void;
  equipStand: (treeId: string, standId: StandId) => void;
  unequipStand: (treeId: string) => void;
  applyFertiliser: (treeId: string, fertiliserId: FertiliserId) => boolean;
  pruneBranch: (treeId: string, branchId: string) => void;
  waterTree: (treeId: string) => void;
  advanceDay: () => void;
  /** Count of owned pots not currently equipped to any tree. */
  availablePotCount: (excludeTreeId?: string) => number;
}

const BonsaiContext = createContext<BonsaiContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Remove pruned-branch entries only once the regrowth *animation* has finished
 * (regrowthDays to start regrowing + BRANCH_GROW_DURATION to fully regrow).
 * Keeping entries during the animation lets the generator compute staged progress.
 */
function cleanRegrownBranches(state: BonsaiGameState): BonsaiGameState {
  const trees = state.trees.map((tree) => {
    const regrowthDays = SPECIES_CONFIG[tree.speciesId].regrowthDays;
    const prunedBranches = tree.prunedBranches.filter(
      (p) =>
        tree.activeDaysCount <
        p.prunedAtDay + regrowthDays + BRANCH_GROW_DURATION,
    );
    return prunedBranches.length === tree.prunedBranches.length
      ? tree
      : { ...tree, prunedBranches };
  });
  return { ...state, trees };
}

/** Returns true if this tree qualifies for growth (watered recently enough). */
function isTreeWatered(tree: BonsaiTree): boolean {
  if (tree.lastWateredDay === undefined) return false;
  const mk = tree.activeFertilisers?.moistureKeeper;
  const retentionDays =
    mk && tree.activeDaysCount < mk.expiresAtDay ? mk.retentionDays : 0;
  return tree.activeDaysCount - tree.lastWateredDay <= retentionDays;
}

/** Remove fertiliser effects that have expired. */
function cleanExpiredFertilisers(tree: BonsaiTree): BonsaiTree {
  if (!tree.activeFertilisers) return tree;
  const { growthTonic, moistureKeeper } = tree.activeFertilisers;
  const nextGT =
    growthTonic && tree.activeDaysCount < growthTonic.expiresAtDay
      ? growthTonic
      : undefined;
  const nextMK =
    moistureKeeper && tree.activeDaysCount < moistureKeeper.expiresAtDay
      ? moistureKeeper
      : undefined;
  if (nextGT === growthTonic && nextMK === moistureKeeper) return tree;
  const next =
    nextGT || nextMK
      ? { growthTonic: nextGT, moistureKeeper: nextMK }
      : undefined;
  return { ...tree, activeFertilisers: next };
}

/** Grow all trees that qualify (watered or moisture keeper active). */
function growWateredTrees(
  state: BonsaiGameState,
  todayStr: string,
): BonsaiGameState {
  return {
    ...state,
    trees: state.trees.map((tree) => {
      if (!isTreeWatered(tree)) return tree;
      const gt = tree.activeFertilisers?.growthTonic;
      const bonus =
        gt && tree.activeDaysCount < gt.expiresAtDay ? gt.bonusPerTick : 0;
      const grown = {
        ...tree,
        activeDaysCount: tree.activeDaysCount + 1 + bonus,
        lastGrownDate: todayStr,
      };
      return cleanExpiredFertilisers(grown);
    }),
    lastGrowthCheckDate: todayStr,
  };
}

/** Compute count of owned pots not currently equipped to any tree (optionally excluding one tree). */
function computeAvailablePotCount(
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

/** Find the cheapest available pot ID from inventory. */
function cheapestAvailablePot(state: BonsaiGameState): PotId | null {
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

// ─── Empty state used for the initial SSR render ──────────────────────────────
// This constant is the same on both server and client, so there is no
// hydration mismatch.  The real state (from localStorage) is loaded in the
// mount effect below.

const EMPTY_STATE: BonsaiGameState = {
  trees: [],
  inventory: {
    ownedSpeciesIds: [],
    ownedToolIds: [],
    ownedFertiliserIds: [],
    ownedPotIds: [],
    ownedStandIds: [],
  },
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BonsaiProvider({ children }: { children: ReactNode }) {
  const { spendPoints } = usePoints();
  const [state, setStateRaw] = useState<BonsaiGameState>(EMPTY_STATE);
  const [placingSpeciesId, setPlacingSpeciesId] = useState<SpeciesId | null>(
    null,
  );

  // Persist every state change
  const setState = useCallback(
    (updater: (prev: BonsaiGameState) => BonsaiGameState) => {
      setStateRaw((prev) => {
        const next = updater(prev);
        saveBonsaiState(next);
        return next;
      });
    },
    [],
  );

  // Load from localStorage and apply growth check on mount (client-only).
  // Using useEffect instead of the useState initialiser avoids a hydration
  // mismatch between the server render (no localStorage) and the client.
  useEffect(() => {
    const loaded = loadBonsaiState();
    const lastActiveDateEP = localStorage.getItem(LAST_ACTIVE_DATE_KEY);
    const todayStr = today();

    setState((_prev) => {
      // Clean regrown branches first
      let next = cleanRegrownBranches(loaded ?? createInitialState());

      // Apply daily growth if energy planner was used today and we haven't
      // grown yet today. All trees that were watered grow independently.
      if (
        lastActiveDateEP === todayStr &&
        next.lastGrowthCheckDate !== todayStr
      ) {
        next = growWateredTrees(next, todayStr);
      }

      return next;
    });
  }, [setState]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Actions ──────────────────────────────────────────────────────────────

  const beginPlanting = useCallback((speciesId: SpeciesId) => {
    setPlacingSpeciesId(speciesId);
  }, []);

  const cancelPlanting = useCallback(() => {
    setPlacingSpeciesId(null);
  }, []);

  const confirmPlantAt = useCallback(
    (speciesId: SpeciesId, position: GardenPosition) => {
      setState((prev) => {
        if (!prev.inventory.ownedSpeciesIds.includes(speciesId)) return prev;
        const potId = cheapestAvailablePot(prev);
        if (!potId) return prev; // no available pot — UI should have prevented this
        const sameSp = prev.trees.filter(
          (t) => t.speciesId === speciesId,
        ).length;
        const newTree: BonsaiTree = {
          id: uuidv4(),
          speciesId,
          name: `${SPECIES_CONFIG[speciesId].label} ${sameSp + 1}`,
          activeDaysCount: 0,
          acquiredAt: today(),
          prunedBranches: [],
          gardenPosition: position,
          equippedPotId: potId,
        };
        const ownedSpeciesIds = [...prev.inventory.ownedSpeciesIds];
        const idx = ownedSpeciesIds.indexOf(speciesId);
        ownedSpeciesIds.splice(idx, 1);
        return {
          ...prev,
          trees: [newTree, ...prev.trees],
          inventory: { ...prev.inventory, ownedSpeciesIds },
        };
      });
      setPlacingSpeciesId(null);
    },
    [setState],
  );

  const updateTreePosition = useCallback(
    (treeId: string, position: GardenPosition) => {
      setState((prev) => ({
        ...prev,
        trees: prev.trees.map((t) =>
          t.id === treeId ? { ...t, gardenPosition: position } : t,
        ),
      }));
    },
    [setState],
  );

  const buyItem = useCallback(
    (itemId: ShopItemId): boolean => {
      const item = SHOP_CATALOG.find((i) => i.id === itemId);
      if (!item) return false;
      if (!spendPoints(item.cost)) return false;

      setState((prev) => {
        const inv = { ...prev.inventory };
        switch (item.category) {
          case "species":
            inv.ownedSpeciesIds = [...inv.ownedSpeciesIds, itemId as SpeciesId];
            break;
          case "tool":
            inv.ownedToolIds = [...inv.ownedToolIds, itemId as ToolId];
            break;
          case "fertiliser":
            inv.ownedFertiliserIds = [
              ...inv.ownedFertiliserIds,
              itemId as FertiliserId,
            ];
            break;
          case "pot":
            inv.ownedPotIds = [...inv.ownedPotIds, itemId as PotId];
            break;
          case "stand":
            inv.ownedStandIds = [...inv.ownedStandIds, itemId as StandId];
            break;
        }
        return { ...prev, inventory: inv };
      });
      return true;
    },
    [setState, spendPoints],
  );

  const equipPot = useCallback(
    (treeId: string, potId: PotId) => {
      setState((prev) => ({
        ...prev,
        trees: prev.trees.map((t) =>
          t.id === treeId ? { ...t, equippedPotId: potId } : t,
        ),
      }));
    },
    [setState],
  );

  const equipStand = useCallback(
    (treeId: string, standId: StandId) => {
      setState((prev) => ({
        ...prev,
        trees: prev.trees.map((t) =>
          t.id === treeId ? { ...t, equippedStandId: standId } : t,
        ),
      }));
    },
    [setState],
  );

  const unequipStand = useCallback(
    (treeId: string) => {
      setState((prev) => ({
        ...prev,
        trees: prev.trees.map((t) =>
          t.id === treeId ? { ...t, equippedStandId: undefined } : t,
        ),
      }));
    },
    [setState],
  );

  const applyFertiliser = useCallback(
    (treeId: string, fertiliserId: FertiliserId): boolean => {
      let applied = false;
      setState((prev) => {
        const idx = prev.inventory.ownedFertiliserIds.indexOf(fertiliserId);
        if (idx === -1) return prev;
        const tree = prev.trees.find((t) => t.id === treeId);
        if (!tree) return prev;

        applied = true;
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

        const ownedFertiliserIds = [...prev.inventory.ownedFertiliserIds];
        ownedFertiliserIds.splice(idx, 1);

        return {
          ...prev,
          inventory: { ...prev.inventory, ownedFertiliserIds },
          trees: prev.trees.map((t) =>
            t.id === treeId ? { ...t, activeFertilisers: newFertilisers } : t,
          ),
        };
      });
      return applied;
    },
    [setState],
  );

  const pruneBranch = useCallback(
    (treeId: string, branchId: string) => {
      setState((prev) => ({
        ...prev,
        trees: prev.trees.map((t) =>
          t.id === treeId
            ? {
                ...t,
                prunedBranches: [
                  ...t.prunedBranches.filter((p) => p.branchId !== branchId),
                  { branchId, prunedAtDay: Math.floor(t.activeDaysCount) },
                ],
              }
            : t,
        ),
      }));
    },
    [setState],
  );

  const waterTree = useCallback(
    (treeId: string) => {
      setState((prev) => {
        const hasWateringTool =
          prev.inventory.ownedToolIds.includes("watering-can") ||
          prev.inventory.ownedToolIds.includes("garden-hose");
        if (!hasWateringTool) return prev;
        return {
          ...prev,
          trees: prev.trees.map((t) =>
            t.id === treeId ? { ...t, lastWateredDay: t.activeDaysCount } : t,
          ),
        };
      });
    },
    [setState],
  );

  const advanceDay = useCallback(() => {
    const todayStr = today();
    setState((prev) => growWateredTrees(prev, todayStr));
  }, [setState]);

  const availablePotCount = useCallback(
    (excludeTreeId?: string) => computeAvailablePotCount(state, excludeTreeId),
    [state],
  );

  return (
    <BonsaiContext.Provider
      value={{
        state,
        placingSpeciesId,
        beginPlanting,
        cancelPlanting,
        confirmPlantAt,
        updateTreePosition,
        buyItem,
        equipPot,
        equipStand,
        unequipStand,
        applyFertiliser,
        pruneBranch,
        waterTree,
        advanceDay,
        availablePotCount,
      }}
    >
      {children}
    </BonsaiContext.Provider>
  );
}

// biome-ignore lint/style/useComponentExportOnlyModules: Standard pattern for Context + Hook
export function useBonsai() {
  const ctx = use(BonsaiContext);
  if (ctx === undefined) {
    throw new Error("useBonsai must be used within a BonsaiProvider");
  }
  return ctx;
}
