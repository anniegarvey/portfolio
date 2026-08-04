"use client";

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { getTodayDateString } from "@/lib/date";
import { usePoints } from "@/lib/points/context";
import { CROPS } from "./catalog";
import * as farming from "./farmingModule";
import { forageSite } from "./foragingModule";
import { addSeeds } from "./inventory";
import { advanceMeadowmereDay, type DailyFarmReport } from "./meadowmereEngine";
import { giveGift } from "./neighboursModule";
import { claimQuest } from "./questsModule";
import type {
  CropId,
  ItemId,
  MeadowmereState,
  NeighbourId,
  QuestId,
  SiteId,
} from "./schema";
import {
  createInitialState,
  EMPTY_STATE,
  loadMeadowmereState,
  saveMeadowmereState,
} from "./storage";

/**
 * The most recent thing the player did, held until the next action replaces
 * it. Panels render the notice whose `kind` they own.
 */
export type Notice =
  | { kind: "harvest"; cropId: CropId; amount: number }
  | { kind: "forage"; siteId: SiteId; itemId: ItemId; amount: number }
  | {
      kind: "gift";
      neighbourId: NeighbourId;
      itemId: ItemId;
      liked: boolean;
      friendshipGained: number;
      newTierName: string | null;
    }
  | { kind: "quest"; questId: QuestId };

export interface MeadowmereContextType {
  state: MeadowmereState;
  notice: Notice | null;
  clearNotice: () => void;
  /** What last night's advance produced, until dismissed. Null if none ran. */
  dailyReport: DailyFarmReport | null;
  clearDailyReport: () => void;
  /** Spends points on a seed packet. False when the player can't afford it. */
  buySeed: (cropId: CropId) => boolean;
  plantSeed: (plotId: string, cropId: CropId) => void;
  waterPlot: (plotId: string) => void;
  harvestPlot: (plotId: string) => void;
  forage: (siteId: SiteId) => void;
  giveGift: (neighbourId: NeighbourId, itemId: ItemId) => void;
  claimQuest: (questId: QuestId) => void;
}

const MeadowmereContext = createContext<MeadowmereContextType | undefined>(
  undefined,
);

export function MeadowmereProvider({ children }: { children: ReactNode }) {
  const { spendPoints } = usePoints();
  const [state, setStateRaw] = useState<MeadowmereState>(EMPTY_STATE);
  const [notice, setNotice] = useState<Notice | null>(null);
  const clearNotice = useCallback(() => setNotice(null), []);
  const [dailyReport, setDailyReport] = useState<DailyFarmReport | null>(null);
  const clearDailyReport = useCallback(() => setDailyReport(null), []);

  // Persist every state change
  const setState = useCallback(
    (updater: (prev: MeadowmereState) => MeadowmereState) => {
      setStateRaw((prev) => {
        const next = updater(prev);
        saveMeadowmereState(next);
        return next;
      });
    },
    [],
  );

  // Load from localStorage and run the daily advance on mount (client-only).
  // Ref-guarded so dev strict-mode's second effect run can't advance twice or
  // overwrite the report.
  const advancedOnMount = useRef(false);
  useEffect(() => {
    if (advancedOnMount.current) return;
    advancedOnMount.current = true;
    const result = advanceMeadowmereDay(
      loadMeadowmereState() ?? createInitialState(),
      getTodayDateString(),
    );
    setState(() => result.state);
    if (result.report !== null) setDailyReport(result.report);
  }, [setState]);

  const handleBuySeed = useCallback(
    (cropId: CropId): boolean => {
      if (!spendPoints(CROPS[cropId].seedCost)) return false;
      setState((prev) => addSeeds(prev, { [cropId]: 1 }));
      return true;
    },
    [setState, spendPoints],
  );

  const handlePlantSeed = useCallback(
    (plotId: string, cropId: CropId) => {
      setState((prev) =>
        farming.plantSeed(prev, plotId, cropId, getTodayDateString()),
      );
    },
    [setState],
  );

  const handleWaterPlot = useCallback(
    (plotId: string) => {
      setState((prev) => farming.waterPlot(prev, plotId, getTodayDateString()));
    },
    [setState],
  );

  // These handlers read the current state value rather than using a functional
  // updater, so the result can be kept for the feedback notice without a side
  // effect inside the updater (which strict mode may run twice).
  const handleHarvestPlot = useCallback(
    (plotId: string) => {
      const result = farming.harvestPlot(state, plotId, getTodayDateString());
      if (result === null) return;
      setNotice({
        kind: "harvest",
        cropId: result.cropId,
        amount: result.amount,
      });
      setState(() => result.state);
    },
    [state, setState],
  );

  const handleForage = useCallback(
    (siteId: SiteId) => {
      const result = forageSite(state, siteId);
      if (result === null) return;
      setNotice({
        kind: "forage",
        siteId: result.siteId,
        itemId: result.itemId,
        amount: result.amount,
      });
      setState(() => result.state);
    },
    [state, setState],
  );

  const handleGiveGift = useCallback(
    (neighbourId: NeighbourId, itemId: ItemId) => {
      const result = giveGift(state, neighbourId, itemId, getTodayDateString());
      if (result === null) return;
      setNotice({
        kind: "gift",
        neighbourId: result.neighbourId,
        itemId: result.itemId,
        liked: result.liked,
        friendshipGained: result.friendshipGained,
        newTierName: result.newTierName,
      });
      setState(() => result.state);
    },
    [state, setState],
  );

  const handleClaimQuest = useCallback(
    (questId: QuestId) => {
      const next = claimQuest(state, questId);
      if (next === null) return;
      setNotice({ kind: "quest", questId });
      setState(() => next);
    },
    [state, setState],
  );

  return (
    <MeadowmereContext.Provider
      value={{
        state,
        notice,
        clearNotice,
        dailyReport,
        clearDailyReport,
        buySeed: handleBuySeed,
        plantSeed: handlePlantSeed,
        waterPlot: handleWaterPlot,
        harvestPlot: handleHarvestPlot,
        forage: handleForage,
        giveGift: handleGiveGift,
        claimQuest: handleClaimQuest,
      }}
    >
      {children}
    </MeadowmereContext.Provider>
  );
}

// biome-ignore lint/style/useComponentExportOnlyModules: Standard pattern for Context + Hook
export function useMeadowmere() {
  const ctx = use(MeadowmereContext);
  if (ctx === undefined) {
    throw new Error("useMeadowmere must be used within a MeadowmereProvider");
  }
  return ctx;
}
