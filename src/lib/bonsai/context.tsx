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
  PotId,
  ShopItemId,
  SpeciesId,
  StandId,
  ToolId,
} from "./schema";
import { SHOP_CATALOG, SPECIES_CONFIG } from "./schema";
import {
  createInitialState,
  loadBonsaiState,
  saveBonsaiState,
} from "./storage";
import { BRANCH_GROW_DURATION } from "./treeGenerator";

// ─── Context Type ─────────────────────────────────────────────────────────────

export interface BonsaiContextType {
  state: BonsaiGameState;
  activePlantedTree: BonsaiTree | null;
  plantTree: (speciesId: SpeciesId) => void;
  switchActiveTree: (treeId: string) => void;
  buyItem: (itemId: ShopItemId) => boolean;
  equipPot: (treeId: string, potId: PotId) => void;
  equipStand: (treeId: string, standId: StandId) => void;
  pruneBranch: (treeId: string, branchId: string) => void;
  advanceDay: () => void;
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

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BonsaiProvider({ children }: { children: ReactNode }) {
  const { spendPoints } = usePoints();
  const [state, setStateRaw] = useState<BonsaiGameState>(() => {
    const loaded = loadBonsaiState();
    return loaded ?? createInitialState();
  });

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

  // Growth check on mount
  useEffect(() => {
    const lastActiveDateEP =
      typeof window !== "undefined"
        ? localStorage.getItem(LAST_ACTIVE_DATE_KEY)
        : null;
    const todayStr = today();

    setState((prev) => {
      // Clean regrown branches first
      let next = cleanRegrownBranches(prev);

      // Apply daily growth if energy planner was used today and we haven't grown yet
      if (
        lastActiveDateEP === todayStr &&
        next.lastGrowthCheckDate !== todayStr &&
        next.activePlantedTreeId
      ) {
        next = {
          ...next,
          trees: next.trees.map((tree) =>
            tree.id === next.activePlantedTreeId
              ? {
                  ...tree,
                  activeDaysCount: tree.activeDaysCount + 1,
                  lastGrownDate: todayStr,
                }
              : tree,
          ),
          lastGrowthCheckDate: todayStr,
        };
      }

      return next;
    });
  }, [setState]); // eslint-disable-line react-hooks/exhaustive-deps

  const activePlantedTree = state.activePlantedTreeId
    ? (state.trees.find((t) => t.id === state.activePlantedTreeId) ?? null)
    : null;

  // ─── Actions ──────────────────────────────────────────────────────────────

  const plantTree = useCallback(
    (speciesId: SpeciesId) => {
      setState((prev) => {
        if (!prev.inventory.ownedSpeciesIds.includes(speciesId)) return prev;
        const newTree: BonsaiTree = {
          id: uuidv4(),
          speciesId,
          activeDaysCount: 0,
          acquiredAt: today(),
          prunedBranches: [],
        };
        const ownedSpeciesIds = [...prev.inventory.ownedSpeciesIds];
        const idx = ownedSpeciesIds.indexOf(speciesId);
        ownedSpeciesIds.splice(idx, 1);
        return {
          ...prev,
          trees: [newTree, ...prev.trees],
          activePlantedTreeId: newTree.id,
          inventory: { ...prev.inventory, ownedSpeciesIds },
        };
      });
    },
    [setState],
  );

  const switchActiveTree = useCallback(
    (treeId: string) => {
      setState((prev) => ({ ...prev, activePlantedTreeId: treeId }));
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
                  { branchId, prunedAtDay: t.activeDaysCount },
                ],
              }
            : t,
        ),
      }));
    },
    [setState],
  );

  const advanceDay = useCallback(() => {
    const todayStr = today();
    setState((prev) => {
      if (!prev.activePlantedTreeId) return prev;
      return {
        ...prev,
        trees: prev.trees.map((t) =>
          t.id === prev.activePlantedTreeId
            ? {
                ...t,
                activeDaysCount: t.activeDaysCount + 1,
                lastGrownDate: todayStr,
              }
            : t,
        ),
        lastGrowthCheckDate: todayStr,
      };
    });
  }, [setState]);

  return (
    <BonsaiContext.Provider
      value={{
        state,
        activePlantedTree,
        plantTree,
        switchActiveTree,
        buyItem,
        equipPot,
        equipStand,
        pruneBranch,
        advanceDay,
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
