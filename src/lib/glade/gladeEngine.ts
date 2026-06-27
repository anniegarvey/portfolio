import { v4 as uuidv4 } from "uuid";
import {
  ALL_INGREDIENT_IDS,
  ALL_SPECIES_IDS,
  BEACON_RARE_BONUS,
  FORAGE_POOLS,
  MAX_VISITORS,
  RARITY_WEIGHTS,
  SPECIES,
  tameThresholdFor,
} from "./catalog";
import { addIngredient } from "./cookingModule";
import type { GladeState, Rarity, SpeciesId, WildVisitor } from "./schema";

/** Trust a soother resident passively grants each wild visitor per day. */
const SOOTHE_TRUST_PER_DAY = 3;

function countRole(state: GladeState, role: string): number {
  return state.residents.filter(
    (r) => SPECIES[r.speciesId].benefitRole === role,
  ).length;
}

/**
 * Species available to spawn: not currently visiting and not already a
 * resident — every creature in the glade is unique.
 */
function spawnableSpecies(state: GladeState): SpeciesId[] {
  const present = new Set<SpeciesId>([
    ...state.visitors.map((v) => v.speciesId),
    ...state.residents.map((r) => r.speciesId),
  ]);
  return ALL_SPECIES_IDS.filter((id) => !present.has(id));
}

/**
 * Picks a species for a new visitor: rarity is drawn from weights (beacon
 * residents shift weight from common to rare), then a species uniformly
 * within that rarity. Falls back across rarities when one is exhausted.
 */
export function pickVisitorSpecies(
  state: GladeState,
  rng: () => number,
): SpeciesId | null {
  const candidates = spawnableSpecies(state);
  if (candidates.length === 0) return null;

  const beacons = countRole(state, "beacon");
  const shift = Math.min(beacons * BEACON_RARE_BONUS, RARITY_WEIGHTS.common);
  const weights: Record<Rarity, number> = {
    common: RARITY_WEIGHTS.common - shift,
    uncommon: RARITY_WEIGHTS.uncommon,
    rare: RARITY_WEIGHTS.rare + shift,
    legendary: RARITY_WEIGHTS.legendary,
    mythic: RARITY_WEIGHTS.mythic,
  };

  // Only rarities that still have spawnable species can be drawn.
  const byRarity = (rarity: Rarity) =>
    candidates.filter((id) => SPECIES[id].rarity === rarity);
  const available = (
    ["common", "uncommon", "rare", "legendary", "mythic"] as const
  ).filter((rarity) => byRarity(rarity).length > 0);
  const totalWeight = available.reduce((sum, r) => sum + weights[r], 0);
  if (totalWeight <= 0) {
    // All remaining weight is on exhausted rarities — pick uniformly.
    return candidates[Math.floor(rng() * candidates.length)];
  }

  let roll = rng() * totalWeight;
  for (const rarity of available) {
    roll -= weights[rarity];
    if (roll < 0) {
      const pool = byRarity(rarity);
      return pool[Math.floor(rng() * pool.length)];
    }
  }
  const lastPool = byRarity(available[available.length - 1]);
  return lastPool[Math.floor(rng() * lastPool.length)];
}

/**
 * The daily glade advance. Runs at most once per calendar day:
 * - resets each visitor's daily actions
 * - soother residents passively build visitor trust (capped just below the
 *   tame threshold — the final step is always the player's)
 * - forager residents each gather one ingredient from their rarity's pool
 * - one new wild visitor may arrive (if there's room and species left)
 */
export function advanceGladeDay(
  state: GladeState,
  today: string,
  rng: () => number = Math.random,
): GladeState {
  if (state.lastAdvanceDate === today) return state;

  const sootheBonus = countRole(state, "soother") * SOOTHE_TRUST_PER_DAY;
  let next: GladeState = {
    ...state,
    lastAdvanceDate: today,
    visitors: state.visitors.map((v) => ({
      ...v,
      trust: Math.min(v.trust + sootheBonus, tameThresholdFor(v.speciesId) - 1),
      actionsToday: { treat: false, approach: false, pet: false },
    })),
  };

  const foragers = state.residents.filter(
    (r) => SPECIES[r.speciesId].benefitRole === "forager",
  );
  for (const forager of foragers) {
    const pool = FORAGE_POOLS[SPECIES[forager.speciesId].rarity];
    next = addIngredient(next, pool[Math.floor(rng() * pool.length)]);
  }

  // Wellspring residents produce two ingredients per day from the full pool.
  const wellsprings = state.residents.filter(
    (r) => SPECIES[r.speciesId].benefitRole === "wellspring",
  );
  for (const _wellspring of wellsprings) {
    next = addIngredient(
      next,
      ALL_INGREDIENT_IDS[Math.floor(rng() * ALL_INGREDIENT_IDS.length)],
    );
    next = addIngredient(
      next,
      ALL_INGREDIENT_IDS[Math.floor(rng() * ALL_INGREDIENT_IDS.length)],
    );
  }

  if (next.visitors.length < MAX_VISITORS) {
    const speciesId = pickVisitorSpecies(next, rng);
    if (speciesId !== null) {
      const visitor: WildVisitor = {
        id: uuidv4(),
        speciesId,
        trust: 0,
        arrivedDate: today,
        actionsToday: { treat: false, approach: false, pet: false },
      };
      next = { ...next, visitors: [...next.visitors, visitor] };
    }
  }

  return next;
}
