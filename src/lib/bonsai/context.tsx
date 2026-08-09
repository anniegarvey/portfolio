"use client";

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useState,
} from "react";
import { getTodayDateString } from "@/lib/date";
import { usePoints } from "@/lib/points/context";
import { LAST_ACTIVE_DATE_KEY } from "@/lib/points/keys";
import { SHOP_CATALOG } from "./catalog";
import { growWateredTrees } from "./growthEngine";
import {
  diffGrowth,
  GROWTH_CELEBRATION_MS,
  type GrowthEvent,
} from "./growthEvents";
import {
  applyFertiliser,
  computeAvailablePotCount,
  equipBackground,
  equipPot,
  equipStand,
  plantTree,
  unequipStand,
  waterTree,
} from "./inventoryModule";
import { cleanRegrownBranches, pruneBranch } from "./pruningModule";
import type {
  BackgroundId,
  BonsaiGameState,
  FertiliserId,
  GardenPosition,
  PotId,
  ShopItemId,
  SpeciesId,
  StandId,
} from "./schema";
import { buyItem } from "./shopModule";
import {
  createInitialState,
  loadBonsaiState,
  saveBonsaiState,
} from "./storage";

// ─── Context Type ─────────────────────────────────────────────────────────────

export interface BonsaiContextType {
  state: BonsaiGameState;
  /**
   * True until the saved game has been read from localStorage on mount. The
   * server render and first client render both see the empty placeholder
   * state, so consumers must show a loading state rather than claim the
   * garden and inventory are empty.
   */
  isLoading: boolean;
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
  /**
   * Trees that gained days in the growth that just ran, cleared once the
   * flourish has had time to play. Empty on every render in between.
   */
  growthEvents: GrowthEvent[];
  /**
   * When true, the manual "advance day" affordances (button + D shortcut) are
   * shown. This is a demo/testing aid — real growth happens automatically once
   * per calendar day — so it is gated behind the `?demo=1` URL parameter that
   * the case study link uses.
   */
  demoMode: boolean;
  /** Count of owned pots not currently equipped to any tree. */
  availablePotCount: (excludeTreeId?: string) => number;
  equipBackground: (backgroundId: BackgroundId) => void;
}

const BonsaiContext = createContext<BonsaiContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Empty state used for the initial SSR render ──────────────────────────────
// This constant is the same on both server and client, so there is no
// hydration mismatch. The real state (from localStorage) is loaded in the
// mount effect below.

const EMPTY_STATE: BonsaiGameState = {
  trees: [],
  inventory: {
    ownedSpeciesIds: [],
    ownedToolIds: [],
    ownedFertiliserIds: [],
    ownedPotIds: [],
    ownedStandIds: [],
    ownedBackgroundIds: [],
  },
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BonsaiProvider({
  children,
  demoMode = false,
}: {
  children: ReactNode;
  demoMode?: boolean;
}) {
  const { spendPoints } = usePoints();
  const [state, setStateRaw] = useState<BonsaiGameState>(EMPTY_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [placingSpeciesId, setPlacingSpeciesId] = useState<SpeciesId | null>(
    null,
  );
  const [growthEvents, setGrowthEvents] = useState<GrowthEvent[]>([]);

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
    const todayStr = getTodayDateString();

    const restored = cleanRegrownBranches(loaded ?? createInitialState());

    // Apply daily growth if energy planner was used today and we haven't
    // grown yet today. All trees that were watered grow independently.
    const grows =
      lastActiveDateEP === todayStr &&
      restored.lastGrowthCheckDate !== todayStr;
    const next = grows ? growWateredTrees(restored, todayStr) : restored;

    setState(() => next);
    // Diffed out here rather than inside the updater: this path rebuilds from
    // storage rather than from `prev`, so a prev/next diff would compare the
    // empty placeholder against the whole saved garden and read every tree as
    // grown. Most growth arrives this way — advancing by hand is demo-only.
    if (grows) setGrowthEvents(diffGrowth(restored, next));
    // Batched with the setState above, so the loaded game and the "ready" flag
    // land in the same commit — consumers never see the empty state unmasked.
    setIsLoading(false);
  }, [setState]); // eslint-disable-line react-hooks/exhaustive-deps

  // The flourish is one-shot. Dropping it on a timer rather than when its
  // animation ends means a tending modal opened later never replays a growth
  // the player already watched in the garden.
  useEffect(() => {
    if (growthEvents.length === 0) return;
    const timer = setTimeout(() => setGrowthEvents([]), GROWTH_CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [growthEvents]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const beginPlanting = useCallback((speciesId: SpeciesId) => {
    setPlacingSpeciesId(speciesId);
  }, []);

  const cancelPlanting = useCallback(() => {
    setPlacingSpeciesId(null);
  }, []);

  const confirmPlantAt = useCallback(
    (speciesId: SpeciesId, position: GardenPosition) => {
      setState(
        (prev) =>
          plantTree(prev, speciesId, position, getTodayDateString()) ?? prev,
      );
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

  const handleBuyItem = useCallback(
    (itemId: ShopItemId): boolean => {
      const item = SHOP_CATALOG.find((i) => i.id === itemId);
      if (!item) return false;
      if (!spendPoints(item.cost)) return false;
      setState((prev) => buyItem(prev, itemId));
      return true;
    },
    [setState, spendPoints],
  );

  const handleEquipBackground = useCallback(
    (backgroundId: BackgroundId) => {
      setState((prev) => equipBackground(prev, backgroundId));
    },
    [setState],
  );

  const handleEquipPot = useCallback(
    (treeId: string, potId: PotId) => {
      setState((prev) => equipPot(prev, treeId, potId));
    },
    [setState],
  );

  const handleEquipStand = useCallback(
    (treeId: string, standId: StandId) => {
      setState((prev) => equipStand(prev, treeId, standId));
    },
    [setState],
  );

  const handleUnequipStand = useCallback(
    (treeId: string) => {
      setState((prev) => unequipStand(prev, treeId));
    },
    [setState],
  );

  const handleApplyFertiliser = useCallback(
    (treeId: string, fertiliserId: FertiliserId): boolean => {
      let applied = false;
      setState((prev) => {
        const result = applyFertiliser(prev, treeId, fertiliserId);
        applied = result.applied;
        return result.state;
      });
      return applied;
    },
    [setState],
  );

  const handlePruneBranch = useCallback(
    (treeId: string, branchId: string) => {
      setState((prev) => pruneBranch(prev, treeId, branchId));
    },
    [setState],
  );

  const handleWaterTree = useCallback(
    (treeId: string) => {
      setState((prev) => waterTree(prev, treeId));
    },
    [setState],
  );

  const advanceDay = useCallback(() => {
    const todayStr = getTodayDateString();
    // Grown from the state in scope rather than inside the updater, so the
    // diff sees the same before/after pair React commits — updaters run twice
    // in development and are the wrong place to raise an event from.
    const next = growWateredTrees(state, todayStr);
    setState(() => next);
    setGrowthEvents(diffGrowth(state, next));
  }, [state, setState]);

  const availablePotCount = useCallback(
    (excludeTreeId?: string) => computeAvailablePotCount(state, excludeTreeId),
    [state],
  );

  return (
    <BonsaiContext.Provider
      value={{
        state,
        isLoading,
        placingSpeciesId,
        beginPlanting,
        cancelPlanting,
        confirmPlantAt,
        updateTreePosition,
        buyItem: handleBuyItem,
        equipPot: handleEquipPot,
        equipStand: handleEquipStand,
        unequipStand: handleUnequipStand,
        applyFertiliser: handleApplyFertiliser,
        pruneBranch: handlePruneBranch,
        waterTree: handleWaterTree,
        advanceDay,
        growthEvents,
        demoMode,
        availablePotCount,
        equipBackground: handleEquipBackground,
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
