import { v4 as uuidv4 } from "uuid";
import {
  HERALD_TRUST_BONUS,
  RECIPES,
  SPECIES,
  tameThresholdFor,
} from "./catalog";
import type {
  GladeState,
  PetSpot,
  Posture,
  TreatId,
  WildVisitor,
} from "./schema";
import { gainXp } from "./skillsModule";

// ─── Trust Math ───────────────────────────────────────────────────────────────

/** Trust gained from a body-language approach at the given tier. */
export function approachTrustGain(tier: number, matched: boolean): number {
  const base = 4 + 2 * tier;
  return Math.round(base * (matched ? 1.5 : 0.5));
}

/** Trust gained from petting at the given tier. */
export function petTrustGain(tier: number, matched: boolean): number {
  const base = 5 + 2 * tier;
  return Math.round(base * (matched ? 1.5 : 0.5));
}

/** Trust gained from a treat (favourite treats count double). */
export function treatTrustGain(treatId: TreatId, favourite: boolean): number {
  return RECIPES[treatId].potency * (favourite ? 2 : 1);
}

// ─── Action Resolution ────────────────────────────────────────────────────────

export interface ActionResult {
  state: GladeState;
  /** Trust gained, or null if the action was not possible. */
  trustGained: number | null;
  /** True when full trust was reached and the visitor became a resident. */
  tamed: boolean;
  /** True when the choice matched the species' preference (always true for treats). */
  matched: boolean;
}

function noAction(state: GladeState): ActionResult {
  return { state, trustGained: null, tamed: false, matched: false };
}

/**
 * Applies a trust gain to a visitor and converts it to a resident when the
 * species' tame threshold is reached. `rng` picks the new resident's spot.
 */
function applyTrust(
  state: GladeState,
  visitor: WildVisitor,
  gain: number,
  actionKey: keyof WildVisitor["actionsToday"],
  today: string,
  rng: () => number,
): { state: GladeState; tamed: boolean } {
  const threshold = tameThresholdFor(visitor.speciesId);
  const trust = Math.min(visitor.trust + gain, threshold);

  if (trust >= threshold) {
    // The species is tamed for good — its banked visit trust is obsolete.
    const { [visitor.speciesId]: _tamed, ...speciesTrust } = state.speciesTrust;
    return {
      state: {
        ...state,
        visitors: state.visitors.filter((v) => v.id !== visitor.id),
        residents: [
          ...state.residents,
          {
            id: uuidv4(),
            speciesId: visitor.speciesId,
            tamedDate: today,
            position: { x: 10 + rng() * 80, y: 30 + rng() * 55 },
          },
        ],
        speciesTrust,
      },
      tamed: true,
    };
  }

  return {
    state: {
      ...state,
      visitors: state.visitors.map((v) =>
        v.id === visitor.id
          ? {
              ...v,
              trust,
              actionsToday: { ...v.actionsToday, [actionKey]: true },
            }
          : v,
      ),
    },
    tamed: false,
  };
}

/** Offers a treat from the pantry. One treat per visitor per day. */
export function offerTreat(
  state: GladeState,
  visitorId: string,
  treatId: TreatId,
  today: string,
  rng: () => number = Math.random,
): ActionResult {
  const visitor = state.visitors.find((v) => v.id === visitorId);
  if (!visitor || visitor.actionsToday.treat) return noAction(state);
  if ((state.pantry.treats[treatId] ?? 0) < 1) return noAction(state);

  const favourite = SPECIES[visitor.speciesId].favouriteTreat === treatId;
  const gain = treatTrustGain(treatId, favourite);

  const withSpentTreat: GladeState = {
    ...state,
    pantry: {
      ...state.pantry,
      treats: {
        ...state.pantry.treats,
        [treatId]: (state.pantry.treats[treatId] ?? 0) - 1,
      },
    },
  };
  const applied = applyTrust(
    withSpentTreat,
    visitor,
    gain,
    "treat",
    today,
    rng,
  );
  return {
    state: applied.state,
    trustGained: gain,
    tamed: applied.tamed,
    matched: favourite,
  };
}

/** Approaches a visitor with a chosen posture. One approach per visitor per day. */
export function approachVisitor(
  state: GladeState,
  visitorId: string,
  posture: Posture,
  today: string,
  rng: () => number = Math.random,
): ActionResult {
  const visitor = state.visitors.find((v) => v.id === visitorId);
  if (!visitor || visitor.actionsToday.approach) return noAction(state);

  const matched = SPECIES[visitor.speciesId].preferredPosture === posture;
  const heralds = state.residents.filter(
    (r) => SPECIES[r.speciesId].benefitRole === "herald",
  ).length;
  const gain =
    approachTrustGain(state.skills["body-language"].tier, matched) +
    (matched ? heralds * HERALD_TRUST_BONUS : 0);

  const withXp = gainXp(state, "body-language");
  const applied = applyTrust(withXp, visitor, gain, "approach", today, rng);
  return {
    state: applied.state,
    trustGained: gain,
    tamed: applied.tamed,
    matched,
  };
}

/** Pets a visitor on a chosen spot. One petting attempt per visitor per day. */
export function petVisitor(
  state: GladeState,
  visitorId: string,
  spot: PetSpot,
  today: string,
  rng: () => number = Math.random,
): ActionResult {
  const visitor = state.visitors.find((v) => v.id === visitorId);
  if (!visitor || visitor.actionsToday.pet) return noAction(state);

  const matched = SPECIES[visitor.speciesId].preferredPetSpot === spot;
  const heralds = state.residents.filter(
    (r) => SPECIES[r.speciesId].benefitRole === "herald",
  ).length;
  const gain =
    petTrustGain(state.skills["petting-technique"].tier, matched) +
    (matched ? heralds * HERALD_TRUST_BONUS : 0);

  const withXp = gainXp(state, "petting-technique");
  const applied = applyTrust(withXp, visitor, gain, "pet", today, rng);
  return {
    state: applied.state,
    trustGained: gain,
    tamed: applied.tamed,
    matched,
  };
}
