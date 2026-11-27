import { FRIENDSHIP_BOOST_PER_LEVEL, SPECIES } from "./catalog";
import type { BenefitRole, GladeState, Resident } from "./schema";

/**
 * Friendship with residents: greeting a resident counts once a day, and
 * enough greets raise its friendship level. Each level makes the resident's
 * role a little stronger, and a restart turns every level into a share of
 * the points multiplier (ADR 0009).
 */

/** Counted greets needed to go from `level` to the next: 2, 4, 8, 16, … */
export function greetsForNextLevel(level: number): number {
  return 2 ** (level + 1);
}

/** A resident's friendship level, and its progress towards the next. */
export function friendshipOf(resident: Resident): {
  level: number;
  /** Greets counted since reaching this level. */
  progress: number;
  /** Greets this level takes in all. */
  needed: number;
} {
  let remaining = resident.friendship ?? 0;
  let level = 0;
  while (remaining >= greetsForNextLevel(level)) {
    remaining -= greetsForNextLevel(level);
    level += 1;
  }
  return { level, progress: remaining, needed: greetsForNextLevel(level) };
}

/** How much stronger friendship makes a resident's role: 1 at level 0. */
export function strengthOf(resident: Resident): number {
  return 1 + friendshipOf(resident).level * FRIENDSHIP_BOOST_PER_LEVEL;
}

/** Every resident with a role, each counted by its strength. */
export function roleStrength(state: GladeState, role: BenefitRole): number {
  return state.residents
    .filter((r) => SPECIES[r.speciesId].benefitRole === role)
    .reduce((sum, r) => sum + strengthOf(r), 0);
}

/**
 * A fractional amount as a whole one: the whole part always, and one more
 * with the chance of the part left over. Whole amounts never roll.
 */
export function rollAmount(amount: number, rng: () => number): number {
  const whole = Math.floor(amount);
  const extra = amount - whole;
  if (extra <= 0) return whole;
  return whole + (rng() < extra ? 1 : 0);
}

export function wasGreetedToday(resident: Resident, today: string): boolean {
  return resident.lastGreetedDate === today;
}

export interface GreetResult {
  state: GladeState;
  /** Whether this greet counted towards friendship (the first of the day). */
  counted: boolean;
  /** The resident's new level when this greet raised it, else null. */
  levelUp: number | null;
}

/** Greets a resident. Only the first greet of the day counts. */
export function greetResident(
  state: GladeState,
  residentId: string,
  today: string,
): GreetResult {
  const resident = state.residents.find((r) => r.id === residentId);
  if (!resident || wasGreetedToday(resident, today)) {
    return { state, counted: false, levelUp: null };
  }
  const greeted: Resident = {
    ...resident,
    friendship: (resident.friendship ?? 0) + 1,
    lastGreetedDate: today,
  };
  const before = friendshipOf(resident).level;
  const after = friendshipOf(greeted).level;
  return {
    state: {
      ...state,
      residents: state.residents.map((r) =>
        r.id === residentId ? greeted : r,
      ),
    },
    counted: true,
    levelUp: after > before ? after : null,
  };
}

/** Every resident's friendship level, added up. */
export function totalFriendshipLevels(state: GladeState): number {
  return state.residents.reduce((sum, r) => sum + friendshipOf(r).level, 0);
}
