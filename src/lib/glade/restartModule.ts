import {
  RESTART_BONUS_BY_RARITY,
  RESTART_BONUS_PER_FRIENDSHIP_LEVEL,
  RESTART_MIN_RESIDENTS,
  SPECIES,
} from "./catalog";
import { totalFriendshipLevels } from "./friendshipModule";
import type { GladeState } from "./schema";

/**
 * Restarting the glade: residents and skills are traded for a lasting bonus
 * on the points the Energy Planner awards (ADR 0009). What the player has
 * learned stays: every species' discovered and tried preferences survive.
 */

/** Residents still to tame before a restart is offered. Zero when it is. */
export function residentsUntilRestart(state: GladeState): number {
  return Math.max(0, RESTART_MIN_RESIDENTS - state.residents.length);
}

export function canRestart(state: GladeState): boolean {
  return residentsUntilRestart(state) === 0;
}

/**
 * What restarting now adds to the points multiplier, in percent: each
 * resident by its rarity, plus every friendship level made with them.
 * Friendship goes with the residents, so it starts over too.
 */
export function restartBonusPercent(state: GladeState): number {
  const rarity = state.residents.reduce(
    (sum, r) => sum + RESTART_BONUS_BY_RARITY[SPECIES[r.speciesId].rarity],
    0,
  );
  return (
    rarity + totalFriendshipLevels(state) * RESTART_BONUS_PER_FRIENDSHIP_LEVEL
  );
}

/**
 * A fresh glade that remembers every preference found. `fresh` is a
 * brand-new glade, passed in to keep this pure.
 */
export function restartedState(
  state: GladeState,
  fresh: GladeState,
): GladeState {
  return {
    ...fresh,
    discoveredPreferences: state.discoveredPreferences,
    triedPreferences: state.triedPreferences,
  };
}
