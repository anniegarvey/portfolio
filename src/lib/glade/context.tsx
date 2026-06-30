"use client";

import {
  createContext,
  type ReactNode,
  type RefObject,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { getTodayDateString } from "@/lib/date";
import { usePoints } from "@/lib/points/context";
import { INGREDIENTS, SPECIES } from "./catalog";
import { addIngredient, cookTreat } from "./cookingModule";
import { advanceGladeDay } from "./gladeEngine";
import type {
  GladeState,
  IngredientId,
  PetSpot,
  Posture,
  SkillId,
  SpeciesId,
  TreatId,
  WildVisitor,
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

/** The most recent taming action, tagged with its visitor for feedback UI. */
export type VisitorActionResult = ActionResult & { visitorId: string };

/** Ephemeral (not persisted) state tracking a taming success animation. */
export type Celebration = {
  speciesId: SpeciesId;
  creatureName: string;
  fromRect: DOMRect;
  /** Pixel center of the new resident's spot in the glade (viewport coords). */
  toX: number;
  toY: number;
  newResidentId: string;
};

export interface GladeContextType {
  state: GladeState;
  lastAction: VisitorActionResult | null;
  celebration: Celebration | null;
  clearCelebration: () => void;
  /** Visitor that was tamed this session — stays visible as a success card. */
  tamedVisitor: WildVisitor | null;
  /** Original position of tamedVisitor in state.visitors before taming. */
  tamedVisitorIndex: number | null;
  clearTamedVisitor: () => void;
  /** Ref for the GladeScene container — used to calculate resident pixel positions. */
  gladeSceneRef: RefObject<HTMLDivElement | null>;
  offerTreat: (visitorId: string, treatId: TreatId, fromRect?: DOMRect) => void;
  approachVisitor: (
    visitorId: string,
    posture: Posture,
    fromRect?: DOMRect,
  ) => void;
  petVisitor: (visitorId: string, spot: PetSpot, fromRect?: DOMRect) => void;
  cookTreat: (treatId: TreatId) => void;
  buyIngredient: (ingredientId: IngredientId) => boolean;
  buyLesson: (skillId: SkillId) => boolean;
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
  const [lastAction, setLastAction] = useState<VisitorActionResult | null>(
    null,
  );
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const clearCelebration = useCallback(() => setCelebration(null), []);
  const [tamedVisitor, setTamedVisitor] = useState<WildVisitor | null>(null);
  const [tamedVisitorIndex, setTamedVisitorIndex] = useState<number | null>(
    null,
  );
  const clearTamedVisitor = useCallback(() => {
    setTamedVisitor(null);
    setTamedVisitorIndex(null);
  }, []);
  const gladeSceneRef = useRef<HTMLDivElement | null>(null);

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

  // Called when a taming action succeeds; captures the resident's pixel
  // position in the glade so the flying animation lands on the right spot.
  const onTamed = useCallback(
    (
      visitor: WildVisitor,
      originalIndex: number,
      result: ActionResult,
      fromRect: DOMRect,
    ) => {
      const newResident =
        result.state.residents[result.state.residents.length - 1];
      if (!newResident) return;
      const gladeRect = gladeSceneRef.current?.getBoundingClientRect();
      const toX = gladeRect
        ? gladeRect.left + (newResident.position.x / 100) * gladeRect.width
        : window.innerWidth / 2;
      const toY = gladeRect
        ? gladeRect.top + (newResident.position.y / 100) * gladeRect.height
        : 120;
      setTamedVisitor(visitor);
      setTamedVisitorIndex(originalIndex);
      setCelebration({
        speciesId: newResident.speciesId,
        creatureName: SPECIES[newResident.speciesId].name,
        fromRect,
        toX,
        toY,
        newResidentId: newResident.id,
      });
    },
    [],
  );

  // Taming handlers compute from the current state value (not a functional
  // updater) so the ActionResult can be stored for feedback UI without side
  // effects inside the updater.
  const handleOfferTreat = useCallback(
    (visitorId: string, treatId: TreatId, fromRect?: DOMRect) => {
      const visitorIndex = state.visitors.findIndex((v) => v.id === visitorId);
      const visitor =
        visitorIndex !== -1 ? state.visitors[visitorIndex] : undefined;
      const result = offerTreat(
        state,
        visitorId,
        treatId,
        getTodayDateString(),
      );
      setLastAction({ ...result, visitorId });
      setState(() => result.state);
      if (result.tamed && fromRect && visitor)
        onTamed(visitor, visitorIndex, result, fromRect);
    },
    [state, setState, onTamed],
  );

  const handleApproachVisitor = useCallback(
    (visitorId: string, posture: Posture, fromRect?: DOMRect) => {
      const visitorIndex = state.visitors.findIndex((v) => v.id === visitorId);
      const visitor =
        visitorIndex !== -1 ? state.visitors[visitorIndex] : undefined;
      const result = approachVisitor(
        state,
        visitorId,
        posture,
        getTodayDateString(),
      );
      setLastAction({ ...result, visitorId });
      setState(() => result.state);
      if (result.tamed && fromRect && visitor)
        onTamed(visitor, visitorIndex, result, fromRect);
    },
    [state, setState, onTamed],
  );

  const handlePetVisitor = useCallback(
    (visitorId: string, spot: PetSpot, fromRect?: DOMRect) => {
      const visitorIndex = state.visitors.findIndex((v) => v.id === visitorId);
      const visitor =
        visitorIndex !== -1 ? state.visitors[visitorIndex] : undefined;
      const result = petVisitor(state, visitorId, spot, getTodayDateString());
      setLastAction({ ...result, visitorId });
      setState(() => result.state);
      if (result.tamed && fromRect && visitor)
        onTamed(visitor, visitorIndex, result, fromRect);
    },
    [state, setState, onTamed],
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

  return (
    <GladeContext.Provider
      value={{
        state,
        lastAction,
        celebration,
        clearCelebration,
        tamedVisitor,
        tamedVisitorIndex,
        clearTamedVisitor,
        gladeSceneRef,
        offerTreat: handleOfferTreat,
        approachVisitor: handleApproachVisitor,
        petVisitor: handlePetVisitor,
        cookTreat: handleCookTreat,
        buyIngredient: handleBuyIngredient,
        buyLesson: handleBuyLesson,
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
