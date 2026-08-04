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

/** Friendship needed for the next tier, or null once at the top. */
export function nextTierThreshold(friendship: number): number | null {
  const next = FRIENDSHIP_TIERS.find((t) => friendship < t.threshold);
  return next?.threshold ?? null;
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
  const gained = liked ? LIKED_GIFT_FRIENDSHIP : NEUTRAL_GIFT_FRIENDSHIP;
  const beforeTier = friendshipTier(friendshipOf(state, neighbourId)).index;

  const given = addFriendship(
    removeItems(state, { [itemId]: 1 }),
    neighbourId,
    gained,
  );
  const afterTier = friendshipTier(friendshipOf(given, neighbourId));

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
    friendshipGained: gained,
    newTierName: afterTier.index > beforeTier ? afterTier.name : null,
  };
}
