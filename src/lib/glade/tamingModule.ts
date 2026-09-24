import { v4 as uuidv4 } from "uuid";
import {
  HABITAT_Y_RANGE,
  HERALD_TRUST_BONUS,
  RECIPES,
  SPECIES,
  tameThresholdFor,
} from "./catalog";
import type {
  GladeState,
  PetSpot,
  Posture,
  PreferenceKind,
  SpeciesId,
  TreatId,
  WildVisitor,
} from "./schema";
import { gainXp, isSkillUnlocked } from "./skillsModule";

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

/** Unlocks one of a species' hint texts once a matching action confirms it. */
function discoverPreference(
  state: GladeState,
  speciesId: SpeciesId,
  kind: PreferenceKind,
): GladeState {
  if (state.discoveredPreferences[speciesId]?.[kind]) return state;
  return {
    ...state,
    discoveredPreferences: {
      ...state.discoveredPreferences,
      [speciesId]: {
        ...state.discoveredPreferences[speciesId],
        [kind]: true,
      },
    },
  };
}

type TriedValue<K extends PreferenceKind> = K extends "treat"
  ? TreatId
  : K extends "posture"
    ? Posture
    : PetSpot;

/**
 * Logs a specific option as tried for a species' preference type, regardless
 * of whether it matched — the elimination trail a high-tier toggletip reads
 * from to help find an undiscovered preference.
 */
function recordAttempt<K extends PreferenceKind>(
  state: GladeState,
  speciesId: SpeciesId,
  kind: K,
  value: TriedValue<K>,
): GladeState {
  const existing = state.triedPreferences[speciesId]?.[kind] ?? [];
  if ((existing as TriedValue<K>[]).includes(value)) return state;
  return {
    ...state,
    triedPreferences: {
      ...state.triedPreferences,
      [speciesId]: {
        ...state.triedPreferences[speciesId],
        [kind]: [...existing, value],
      },
    },
  };
}

/** Candidate spots sampled when placing a new resident; the best one wins. */
const PLACEMENT_CANDIDATES = 12;

/**
 * Picks a spot within the habitat band that is as far as possible from every
 * existing resident (best-candidate sampling), so the glade fills out evenly
 * instead of clumping or lining up by chance.
 */
function pickResidentPosition(
  residents: GladeState["residents"],
  band: { min: number; max: number },
  rng: () => number,
): { x: number; y: number } {
  let best = { x: 0, y: 0 };
  let bestDistance = -1;
  for (let i = 0; i < PLACEMENT_CANDIDATES; i++) {
    const candidate = {
      x: 10 + rng() * 80,
      y: band.min + rng() * (band.max - band.min),
    };
    const nearest = Math.min(
      ...residents.map((r) =>
        Math.hypot(r.position.x - candidate.x, r.position.y - candidate.y),
      ),
    );
    if (nearest > bestDistance) {
      best = candidate;
      bestDistance = nearest;
    }
  }
  return best;
}

/**
 * Applies a trust gain to a visitor and converts it to a resident when the
 * species' tame threshold is reached. `rng` picks the new resident's spot
 * within its habitat's vertical band (see HABITAT_Y_RANGE), spread away from
 * the existing residents.
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
            position: pickResidentPosition(
              state.residents,
              HABITAT_Y_RANGE[SPECIES[visitor.speciesId].habitat],
              rng,
            ),
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
  if (!isSkillUnlocked(state, "treat-cooking")) return noAction(state);
  const visitor = state.visitors.find((v) => v.id === visitorId);
  if (!visitor || visitor.actionsToday.treat) return noAction(state);
  if ((state.pantry.treats[treatId] ?? 0) < 1) return noAction(state);

  const favourite = SPECIES[visitor.speciesId].favouriteTreat === treatId;
  const gain = treatTrustGain(treatId, favourite);

  const tried = recordAttempt(state, visitor.speciesId, "treat", treatId);
  const discovered = favourite
    ? discoverPreference(tried, visitor.speciesId, "treat")
    : tried;
  const withSpentTreat: GladeState = {
    ...discovered,
    pantry: {
      ...discovered.pantry,
      treats: {
        ...discovered.pantry.treats,
        [treatId]: (discovered.pantry.treats[treatId] ?? 0) - 1,
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

  const tried = recordAttempt(state, visitor.speciesId, "posture", posture);
  const discovered = matched
    ? discoverPreference(tried, visitor.speciesId, "posture")
    : tried;
  const withXp = gainXp(discovered, "body-language");
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
  if (!isSkillUnlocked(state, "petting-technique")) return noAction(state);
  const visitor = state.visitors.find((v) => v.id === visitorId);
  if (!visitor || visitor.actionsToday.pet) return noAction(state);

  const matched = SPECIES[visitor.speciesId].preferredPetSpot === spot;
  const heralds = state.residents.filter(
    (r) => SPECIES[r.speciesId].benefitRole === "herald",
  ).length;
  const gain =
    petTrustGain(state.skills["petting-technique"].tier, matched) +
    (matched ? heralds * HERALD_TRUST_BONUS : 0);

  const tried = recordAttempt(state, visitor.speciesId, "petSpot", spot);
  const discovered = matched
    ? discoverPreference(tried, visitor.speciesId, "petSpot")
    : tried;
  const withXp = gainXp(discovered, "petting-technique");
  const applied = applyTrust(withXp, visitor, gain, "pet", today, rng);
  return {
    state: applied.state,
    trustGained: gain,
    tamed: applied.tamed,
    matched,
  };
}
