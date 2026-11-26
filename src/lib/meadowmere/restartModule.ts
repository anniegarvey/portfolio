import { RESTART_BONUS_PER_QUEST, RESTART_MIN_QUESTS } from "./catalog";
import type { MeadowmereState, NeighbourId } from "./schema";

/**
 * Restarting the farm: progress is traded for a lasting bonus on the points
 * the Energy Planner awards (ADR 0009). What the farmer has learned stays:
 * every neighbour's gift hints survive, so favourites found stay found.
 */

/** Quests still to complete before a restart is offered. Zero when it is. */
export function questsUntilRestart(state: MeadowmereState): number {
  return Math.max(0, RESTART_MIN_QUESTS - state.completedQuestIds.length);
}

export function canRestart(state: MeadowmereState): boolean {
  return questsUntilRestart(state) === 0;
}

/** What restarting now adds to the points multiplier, in percent. */
export function restartBonusPercent(state: MeadowmereState): number {
  return state.completedQuestIds.length * RESTART_BONUS_PER_QUEST;
}

/**
 * A fresh farm that remembers which gifts each neighbour has been given.
 * `fresh` is a brand-new smallholding, passed in to keep this pure.
 */
export function restartedState(
  state: MeadowmereState,
  fresh: MeadowmereState,
): MeadowmereState {
  const neighbours = { ...fresh.neighbours };
  for (const id of Object.keys(neighbours) as NeighbourId[]) {
    const giftedItemIds = state.neighbours[id]?.giftedItemIds;
    if (giftedItemIds !== undefined) {
      neighbours[id] = { friendship: 0, giftedItemIds };
    }
  }
  return { ...fresh, neighbours };
}
