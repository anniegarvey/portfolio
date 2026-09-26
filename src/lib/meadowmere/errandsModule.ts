import {
  ALL_NEIGHBOUR_IDS,
  CROPS,
  ERRAND_FRIENDSHIP,
  ERRAND_SEEDS,
  ITEMS,
  SITES,
} from "./catalog";
import { addSeeds, hasItems, removeItems } from "./inventory";
import { addFriendship, likesItem } from "./neighboursModule";
import type {
  CropId,
  ItemId,
  MeadowmereState,
  NeighbourId,
  QuestId,
} from "./schema";

/**
 * A small, repeatable ask: one neighbour a day wants a few of something the
 * player can already grow or forage. Derived from the date and what is
 * unlocked, never stored — only `lastErrandDate` is, to stop a second hand-in
 * on the same day. Keeps something to aim for once the quest chain runs out.
 */
export interface Errand {
  neighbourId: NeighbourId;
  itemId: ItemId;
  amount: number;
  /** Which seed the errand pays out, `ERRAND_SEEDS` packets of it. */
  rewardCropId: CropId;
}

export type ErrandStatus = "active" | "ready" | "done";

/** Errands start once the first quest has shown the player how asks work. */
const ERRANDS_OPEN_AFTER: QuestId = "a-bed-for-parsnips";

/** A stable number for a date and a purpose, so each pick is independent. */
function dateHash(date: string, salt: string): number {
  let hash = 0;
  for (const char of `${date}:${salt}`) {
    hash = (hash * 31 + char.charCodeAt(0)) % 65521;
  }
  return hash;
}

/**
 * Every item the player could get hold of right now: the produce of each crop
 * they can sow and the materials of each site they can forage. In catalog item
 * order, so the same state always yields the same list.
 */
export function obtainableItems(state: MeadowmereState): ItemId[] {
  const reachable = new Set<ItemId>([
    ...state.unlockedCropIds.map((id) => CROPS[id].produceId),
    ...state.unlockedSiteIds.flatMap((id) => SITES[id].materials),
  ]);
  return (Object.keys(ITEMS) as ItemId[]).filter((id) => reachable.has(id));
}

/** Today's errand, or null before errands have opened up. */
export function todaysErrand(
  state: MeadowmereState,
  today: string,
): Errand | null {
  if (!state.completedQuestIds.includes(ERRANDS_OPEN_AFTER)) return null;
  const pool = obtainableItems(state);
  if (pool.length === 0 || state.unlockedCropIds.length === 0) return null;

  const neighbourId =
    ALL_NEIGHBOUR_IDS[dateHash(today, "neighbour") % ALL_NEIGHBOUR_IDS.length];
  // Ask for something they like when there is one to ask for, so an errand
  // reads as the neighbour's own wish rather than a random draw.
  const liked = pool.filter((id) => likesItem(neighbourId, id));
  const choices = liked.length > 0 ? liked : pool;
  const itemId = choices[dateHash(today, "item") % choices.length];
  const amount = 2 + (dateHash(today, "amount") % 2);
  const rewardCropId =
    state.unlockedCropIds[
      dateHash(today, "reward") % state.unlockedCropIds.length
    ];

  return { neighbourId, itemId, amount, rewardCropId };
}

export function errandStatus(
  state: MeadowmereState,
  errand: Errand,
  today: string,
): ErrandStatus {
  if (state.lastErrandDate === today) return "done";
  return hasItems(state, { [errand.itemId]: errand.amount })
    ? "ready"
    : "active";
}

/**
 * Hands in today's errand: takes the items, pays out friendship and seeds, and
 * stamps the day. Returns null when there is no errand or it isn't ready.
 */
export function claimErrand(
  state: MeadowmereState,
  today: string,
): MeadowmereState | null {
  const errand = todaysErrand(state, today);
  if (errand === null || errandStatus(state, errand, today) !== "ready") {
    return null;
  }
  const paid = addSeeds(
    addFriendship(
      removeItems(state, { [errand.itemId]: errand.amount }),
      errand.neighbourId,
      ERRAND_FRIENDSHIP,
    ),
    { [errand.rewardCropId]: ERRAND_SEEDS },
  );
  return { ...paid, lastErrandDate: today };
}
