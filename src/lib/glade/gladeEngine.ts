import { v4 as uuidv4 } from "uuid";
import {
  ALL_INGREDIENT_IDS,
  ALL_SPECIES_IDS,
  BEACON_RARE_BONUS,
  FORAGE_POOLS,
  MAX_VISITORS,
  RARITY_WEIGHTS,
  SPECIES,
  TRUST_VISIT_BONUS,
  tameThresholdFor,
} from "./catalog";
import { addIngredient } from "./cookingModule";
import type {
  GladeState,
  IngredientId,
  Rarity,
  SpeciesId,
  WildVisitor,
} from "./schema";

/** Trust a soother resident passively grants each wild visitor per day. */
const SOOTHE_TRUST_PER_DAY = 3;

/** One ingredient gathered by a resident during the daily advance. */
export interface ForageEvent {
  residentId: string;
  ingredientId: IngredientId;
}

/** What happened during a daily glade advance, for the daily digest UI. */
export interface DailyGladeReport {
  /** Trust each wild visitor gained from soother residents. */
  soothedTrust: number;
  /** Number of wild visitors that were soothed. */
  soothedVisitors: number;
  /** Ingredients gathered by forager and wellspring residents. */
  foraged: ForageEvent[];
  /** Today's wild visitors, in the order they were drawn. */
  visitorSpeciesIds: SpeciesId[];
}

export interface AdvanceResult {
  state: GladeState;
  /** Null when the advance already ran today. */
  report: DailyGladeReport | null;
}

function countRole(state: GladeState, role: string): number {
  return state.residents.filter(
    (r) => SPECIES[r.speciesId].benefitRole === role,
  ).length;
}

/**
 * Species eligible to visit: any species not already a resident. Yesterday's
 * visitors stay eligible — returning is how multi-day tames progress.
 */
function visitableSpecies(state: GladeState): SpeciesId[] {
  const resident = new Set<SpeciesId>(state.residents.map((r) => r.speciesId));
  return ALL_SPECIES_IDS.filter((id) => !resident.has(id));
}

/**
 * Draws today's set of wild visitors: between one and MAX_VISITORS distinct
 * species, weighted without replacement. Each rarity's weight (beacon
 * residents shift weight from common to rare) is shared evenly among its
 * untamed species, then scaled up by that species' banked taming progress —
 * so part-tamed creatures tend to come back.
 */
export function pickDailyVisitors(
  state: GladeState,
  rng: () => number,
): SpeciesId[] {
  const candidates = visitableSpecies(state);
  if (candidates.length === 0) return [];

  const beacons = countRole(state, "beacon");
  const shift = Math.min(beacons * BEACON_RARE_BONUS, RARITY_WEIGHTS.common);
  const rarityWeights: Record<Rarity, number> = {
    common: RARITY_WEIGHTS.common - shift,
    uncommon: RARITY_WEIGHTS.uncommon,
    rare: RARITY_WEIGHTS.rare + shift,
    legendary: RARITY_WEIGHTS.legendary,
    mythic: RARITY_WEIGHTS.mythic,
  };
  const rarityCounts = new Map<Rarity, number>();
  for (const id of candidates) {
    const rarity = SPECIES[id].rarity;
    rarityCounts.set(rarity, (rarityCounts.get(rarity) ?? 0) + 1);
  }
  const weightFor = (id: SpeciesId): number => {
    const { rarity } = SPECIES[id];
    const share = rarityWeights[rarity] / (rarityCounts.get(rarity) ?? 1);
    const progress = (state.speciesTrust[id] ?? 0) / tameThresholdFor(id);
    return share * (1 + TRUST_VISIT_BONUS * progress);
  };

  const count = Math.min(
    1 + Math.floor(rng() * MAX_VISITORS),
    candidates.length,
  );
  const pool = [...candidates];
  const picked: SpeciesId[] = [];
  while (picked.length < count) {
    const weights = pool.map(weightFor);
    const total = weights.reduce((sum, w) => sum + w, 0);
    // Every remaining candidate is in a zero-weight rarity — pick uniformly.
    let index = total <= 0 ? Math.floor(rng() * pool.length) : pool.length - 1;
    if (total > 0) {
      let roll = rng() * total;
      for (let i = 0; i < pool.length; i++) {
        roll -= weights[i];
        if (roll < 0) {
          index = i;
          break;
        }
      }
    }
    picked.push(pool[index]);
    pool.splice(index, 1);
  }
  return picked;
}

/**
 * The daily glade advance. Runs at most once per calendar day:
 * - yesterday's visitors depart, banking their taming progress per species
 * - a fresh set of one to MAX_VISITORS wild visitors is drawn, each arriving
 *   with its species' banked trust
 * - soother residents calm today's visitors (capped just below the tame
 *   threshold — the final step is always the player's)
 * - forager residents each gather one ingredient from their rarity's pool
 *
 * Also reports what happened so the UI can show a daily digest.
 */
export function advanceGladeDay(
  state: GladeState,
  today: string,
  rng: () => number = Math.random,
): AdvanceResult {
  if (state.lastAdvanceDate === today) return { state, report: null };

  const speciesTrust = { ...state.speciesTrust };
  for (const v of state.visitors) {
    if (v.trust > 0) speciesTrust[v.speciesId] = v.trust;
  }

  const sootheBonus = countRole(state, "soother") * SOOTHE_TRUST_PER_DAY;
  let next: GladeState = {
    ...state,
    lastAdvanceDate: today,
    speciesTrust,
    visitors: [],
  };

  const foraged: ForageEvent[] = [];
  const gather = (residentId: string, ingredientId: IngredientId) => {
    next = addIngredient(next, ingredientId);
    foraged.push({ residentId, ingredientId });
  };

  const foragers = state.residents.filter(
    (r) => SPECIES[r.speciesId].benefitRole === "forager",
  );
  for (const forager of foragers) {
    const pool = FORAGE_POOLS[SPECIES[forager.speciesId].rarity];
    gather(forager.id, pool[Math.floor(rng() * pool.length)]);
  }

  // Wellspring residents produce two ingredients per day from the full pool.
  const wellsprings = state.residents.filter(
    (r) => SPECIES[r.speciesId].benefitRole === "wellspring",
  );
  for (const wellspring of wellsprings) {
    gather(
      wellspring.id,
      ALL_INGREDIENT_IDS[Math.floor(rng() * ALL_INGREDIENT_IDS.length)],
    );
    gather(
      wellspring.id,
      ALL_INGREDIENT_IDS[Math.floor(rng() * ALL_INGREDIENT_IDS.length)],
    );
  }

  const visitorSpeciesIds = pickDailyVisitors(next, rng);
  let soothedVisitors = 0;
  const visitors: WildVisitor[] = visitorSpeciesIds.map((speciesId) => {
    const banked = speciesTrust[speciesId] ?? 0;
    const trust = Math.min(
      banked + sootheBonus,
      tameThresholdFor(speciesId) - 1,
    );
    if (trust > banked) soothedVisitors += 1;
    return {
      id: uuidv4(),
      speciesId,
      trust,
      arrivedDate: today,
      actionsToday: { treat: false, approach: false, pet: false },
    };
  });
  next = { ...next, visitors };

  return {
    state: next,
    report: {
      soothedTrust: sootheBonus,
      soothedVisitors,
      foraged,
      visitorSpeciesIds,
    },
  };
}
