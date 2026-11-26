import {
  RESTART_BONUS_BY_RARITY,
  RESTART_MIN_RESIDENTS,
  SPECIES,
} from "./catalog";
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

/** What restarting now adds to the points multiplier, in percent. */
export function restartBonusPercent(state: GladeState): number {
  return state.residents.reduce(
    (sum, r) => sum + RESTART_BONUS_BY_RARITY[SPECIES[r.speciesId].rarity],
    0,
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
