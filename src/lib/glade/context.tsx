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
import { INGREDIENTS } from "./catalog";
import { addIngredient, cookTreat } from "./cookingModule";
import { advanceGladeDay } from "./gladeEngine";
import type {
  GladeState,
  IngredientId,
  PetSpot,
  Posture,
  SkillId,
  TreatId,
} from "./schema";
import { buyLesson, canBuyLesson, nextLessonCost } from "./skillsModule";
import { createInitialState, loadGladeState, saveGladeState } from "./storage";
import {
  type ActionResult,
  approachVisitor,
  offerTreat,
  petVisitor,
} from "./tamingModule";

// ─── Context Type ─────────────────────────────────────────────────────────────

export interface GladeContextType {
  state: GladeState;
  /** Result of the most recent taming action, for feedback UI. */
  lastAction: ActionResult | null;
  offerTreat: (visitorId: string, treatId: TreatId) => void;
  approachVisitor: (visitorId: string, posture: Posture) => void;
  petVisitor: (visitorId: string, spot: PetSpot) => void;
  cookTreat: (treatId: TreatId) => void;
  buyIngredient: (ingredientId: IngredientId) => boolean;
  buyLesson: (skillId: SkillId) => boolean;
  advanceDay: () => void;
}

const GladeContext = createContext<GladeContextType | undefined>(undefined);

// Empty state used for the initial SSR render — identical on server and
// client, so there is no hydration mismatch. The real state (localStorage)
// is loaded in the mount effect below.
const EMPTY_STATE: GladeState = {
  visitors: [],
  residents: [],
  skills: {
    "treat-cooking": { tier: 1, xp: 0 },
    "body-language": { tier: 1, xp: 0 },
    "petting-technique": { tier: 1, xp: 0 },
  },
  pantry: { ingredients: {}, treats: {} },
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GladeProvider({ children }: { children: ReactNode }) {
  const { spendPoints } = usePoints();
  const [state, setStateRaw] = useState<GladeState>(EMPTY_STATE);
  const [lastAction, setLastAction] = useState<ActionResult | null>(null);

  // Persist every state change
  const setState = useCallback((updater: (prev: GladeState) => GladeState) => {
    setStateRaw((prev) => {
      const next = updater(prev);
      saveGladeState(next);
      return next;
    });
  }, []);

  // Load from localStorage and run the daily advance on mount (client-only).
  useEffect(() => {
    const todayStr = getTodayDateString();
    setState(() =>
      advanceGladeDay(loadGladeState() ?? createInitialState(), todayStr),
    );
  }, [setState]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  // Taming handlers compute from the current state value (not a functional
  // updater) so the ActionResult can be stored for feedback UI without side
  // effects inside the updater.
  const handleOfferTreat = useCallback(
    (visitorId: string, treatId: TreatId) => {
      const result = offerTreat(
        state,
        visitorId,
        treatId,
        getTodayDateString(),
      );
      setLastAction(result);
      setState(() => result.state);
    },
    [state, setState],
  );

  const handleApproachVisitor = useCallback(
    (visitorId: string, posture: Posture) => {
      const result = approachVisitor(
        state,
        visitorId,
        posture,
        getTodayDateString(),
      );
      setLastAction(result);
      setState(() => result.state);
    },
    [state, setState],
  );

  const handlePetVisitor = useCallback(
    (visitorId: string, spot: PetSpot) => {
      const result = petVisitor(state, visitorId, spot, getTodayDateString());
      setLastAction(result);
      setState(() => result.state);
    },
    [state, setState],
  );

  const handleCookTreat = useCallback(
    (treatId: TreatId) => {
      setState((prev) => cookTreat(prev, treatId));
    },
    [setState],
  );

  const handleBuyIngredient = useCallback(
    (ingredientId: IngredientId): boolean => {
      if (!spendPoints(INGREDIENTS[ingredientId].cost)) return false;
      setState((prev) => addIngredient(prev, ingredientId));
      return true;
    },
    [setState, spendPoints],
  );

  const handleBuyLesson = useCallback(
    (skillId: SkillId): boolean => {
      if (!canBuyLesson(state, skillId)) return false;
      const cost = nextLessonCost(state, skillId);
      if (cost === null || !spendPoints(cost)) return false;
      setState((prev) => buyLesson(prev, skillId));
      return true;
    },
    [state, setState, spendPoints],
  );

  const advanceDay = useCallback(() => {
    setState((prev) => advanceGladeDay(prev, getTodayDateString()));
  }, [setState]);

  return (
    <GladeContext.Provider
      value={{
        state,
        lastAction,
        offerTreat: handleOfferTreat,
        approachVisitor: handleApproachVisitor,
        petVisitor: handlePetVisitor,
        cookTreat: handleCookTreat,
        buyIngredient: handleBuyIngredient,
        buyLesson: handleBuyLesson,
        advanceDay,
      }}
    >
      {children}
    </GladeContext.Provider>
  );
}

// biome-ignore lint/style/useComponentExportOnlyModules: Standard pattern for Context + Hook
export function useGlade() {
  const ctx = use(GladeContext);
  if (ctx === undefined) {
    throw new Error("useGlade must be used within a GladeProvider");
  }
  return ctx;
}
