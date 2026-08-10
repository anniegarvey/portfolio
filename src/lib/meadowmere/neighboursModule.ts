import {
  FRIENDSHIP_TIERS,
  LIKED_GIFT_FRIENDSHIP,
  MAX_FRIENDSHIP,
  NEIGHBOURS,
  NEUTRAL_GIFT_FRIENDSHIP,
} from "./catalog";
import { itemCount, removeItems } from "./inventory";
import type {
  ItemId,
  MeadowmereState,
  NeighbourId,
  NeighbourState,
} from "./schema";

const UNMET: NeighbourState = { friendship: 0 };

/** Reads a neighbour's state, defaulting so a save predating them still works. */
export function neighbourState(
  state: MeadowmereState,
  neighbourId: NeighbourId,
): NeighbourState {
  return state.neighbours[neighbourId] ?? UNMET;
}

export function friendshipOf(
  state: MeadowmereState,
  neighbourId: NeighbourId,
): number {
  return neighbourState(state, neighbourId).friendship;
}

/** The highest tier this friendship value has reached. */
export function friendshipTier(friendship: number): {
  name: string;
  index: number;
} {
  let index = 0;
  for (let i = 0; i < FRIENDSHIP_TIERS.length; i++) {
    if (friendship >= FRIENDSHIP_TIERS[i].threshold) index = i;
  }
  return { name: FRIENDSHIP_TIERS[index].name, index };
}

/**
 * The tier this friendship is climbing towards, or null once at the top. Both
 * halves of it: what it is called and what it costs are only ever wanted
 * together, and looking the name up from the number a second time is how the
 * two drift apart.
 */
export function nextTier(
  friendship: number,
): { threshold: number; name: string } | null {
  return FRIENDSHIP_TIERS.find((t) => friendship < t.threshold) ?? null;
}

export function likesItem(neighbourId: NeighbourId, itemId: ItemId): boolean {
  return NEIGHBOURS[neighbourId].likedItemIds.includes(itemId);
}

export function canGift(
  state: MeadowmereState,
  neighbourId: NeighbourId,
  itemId: ItemId,
  today: string,
): boolean {
  if (neighbourState(state, neighbourId).lastGiftDate === today) return false;
  return itemCount(state, itemId) > 0;
}

/** Adds friendship to a neighbour, clamped to MAX_FRIENDSHIP. */
export function addFriendship(
  state: MeadowmereState,
  neighbourId: NeighbourId,
  amount: number,
): MeadowmereState {
  const current = neighbourState(state, neighbourId);
  return {
    ...state,
    neighbours: {
      ...state.neighbours,
      [neighbourId]: {
        ...current,
        friendship: Math.min(MAX_FRIENDSHIP, current.friendship + amount),
      },
    },
  };
}

/** How a gift landed, for the neighbour card's reaction. */
export interface GiftResult {
  state: MeadowmereState;
  neighbourId: NeighbourId;
  itemId: ItemId;
  liked: boolean;
  /**
   * What the friendship actually went up by, which is not always what the gift
   * was worth: the last few points before the cap earn less than the gift
   * nominally offers, and at the cap a gift earns nothing at all. Reported as
   * the difference so nothing downstream promises a number the neighbour
   * didn't get.
   */
  friendshipGained: number;
  /** Set when the gift pushed the neighbour into a new friendship tier. */
  newTierName: string | null;
}

/**
 * Gives one item to a neighbour, once per neighbour per calendar day. A liked
 * item earns more friendship; nothing a neighbour receives ever loses them any.
 * Returns null when the gift isn't allowed.
 */
export function giveGift(
  state: MeadowmereState,
  neighbourId: NeighbourId,
  itemId: ItemId,
  today: string,
): GiftResult | null {
  if (!canGift(state, neighbourId, itemId, today)) return null;

  const liked = likesItem(neighbourId, itemId);
  const offered = liked ? LIKED_GIFT_FRIENDSHIP : NEUTRAL_GIFT_FRIENDSHIP;
  const before = friendshipOf(state, neighbourId);
  const beforeTier = friendshipTier(before).index;

  const given = addFriendship(
    removeItems(state, { [itemId]: 1 }),
    neighbourId,
    offered,
  );
  const after = friendshipOf(given, neighbourId);
  const afterTier = friendshipTier(after);

  return {
    state: {
      ...given,
      neighbours: {
        ...given.neighbours,
        [neighbourId]: {
          ...neighbourState(given, neighbourId),
          lastGiftDate: today,
        },
      },
    },
    neighbourId,
    itemId,
    liked,
    friendshipGained: after - before,
    newTierName: afterTier.index > beforeTier ? afterTier.name : null,
  };
}
