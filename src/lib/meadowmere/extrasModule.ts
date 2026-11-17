import { getPreviousDay } from "@/lib/date";
import { EXTRA_TRIP_COSTS, GROW_TONIC_COSTS } from "./catalog";
import { isRipe } from "./farmingModule";
import { foragesLeft } from "./foragingModule";
import { neighbourState } from "./neighboursModule";
import type { ExtrasBought, MeadowmereState, NeighbourId } from "./schema";

/**
 * Extras: small speedups bought with points — another forage trip, a grow
 * tonic, another gift for a neighbour. Each function here is pure and leaves
 * paying to the caller, which spends the points only when the purchase is
 * allowed (ADR 0009).
 */

/** What has been bought today; nothing, if the record is from another day. */
export function extrasBoughtToday(
  state: MeadowmereState,
  today: string,
): ExtrasBought {
  const bought = state.extrasBought;
  return bought?.date === today
    ? bought
    : { date: today, trips: 0, tonics: 0, giftNeighbourIds: [] };
}

/** The price of the day's next extra trip, or null once the day's run is spent. */
export function extraTripCost(
  state: MeadowmereState,
  today: string,
): number | null {
  return EXTRA_TRIP_COSTS[extrasBoughtToday(state, today).trips] ?? null;
}

/** Only offered once the day's trips are used, so a trip is never bought spare. */
export function canBuyExtraTrip(
  state: MeadowmereState,
  today: string,
): boolean {
  return foragesLeft(state) === 0 && extraTripCost(state, today) !== null;
}

/** Hands back one forage trip. Null when it can't be bought. */
export function buyExtraTrip(
  state: MeadowmereState,
  today: string,
): MeadowmereState | null {
  if (!canBuyExtraTrip(state, today)) return null;
  const bought = extrasBoughtToday(state, today);
  return {
    ...state,
    foragesToday: state.foragesToday - 1,
    extrasBought: { ...bought, trips: bought.trips + 1 },
  };
}

/** The price of the day's next grow tonic, or null once the day's run is spent. */
export function growTonicCost(
  state: MeadowmereState,
  today: string,
): number | null {
  return GROW_TONIC_COSTS[extrasBoughtToday(state, today).tonics] ?? null;
}

function hasGrowingPlanting(state: MeadowmereState, today: string): boolean {
  return state.plots.some(
    (plot) => plot.planting !== null && !isRipe(plot.planting, today),
  );
}

/** Worth buying only while something is still growing. */
export function canBuyGrowTonic(
  state: MeadowmereState,
  today: string,
): boolean {
  return (
    hasGrowingPlanting(state, today) && growTonicCost(state, today) !== null
  );
}

/**
 * Moves every growing planting a day further along. Growth is derived from
 * `plantedDate` (ADR 0007), so a day of growth is a planting date one day
 * earlier. Null when it can't be bought.
 */
export function buyGrowTonic(
  state: MeadowmereState,
  today: string,
): MeadowmereState | null {
  if (!canBuyGrowTonic(state, today)) return null;
  const bought = extrasBoughtToday(state, today);
  return {
    ...state,
    plots: state.plots.map((plot) =>
      plot.planting === null || isRipe(plot.planting, today)
        ? plot
        : {
            ...plot,
            planting: {
              ...plot.planting,
              plantedDate: getPreviousDay(plot.planting.plantedDate),
            },
          },
    ),
    extrasBought: { ...bought, tonics: bought.tonics + 1 },
  };
}

/**
 * Another gift for a neighbour already given one today, once per neighbour
 * per day.
 */
export function canBuyExtraGift(
  state: MeadowmereState,
  neighbourId: NeighbourId,
  today: string,
): boolean {
  return (
    neighbourState(state, neighbourId).lastGiftDate === today &&
    !extrasBoughtToday(state, today).giftNeighbourIds.includes(neighbourId)
  );
}

/**
 * Lets a neighbour take another gift today. The daily limit is only the
 * `lastGiftDate` stamp, so clearing it is the whole of the allowance. Null
 * when it can't be bought.
 */
export function buyExtraGift(
  state: MeadowmereState,
  neighbourId: NeighbourId,
  today: string,
): MeadowmereState | null {
  if (!canBuyExtraGift(state, neighbourId, today)) return null;
  const bought = extrasBoughtToday(state, today);
  return {
    ...state,
    neighbours: {
      ...state.neighbours,
      [neighbourId]: {
        ...neighbourState(state, neighbourId),
        lastGiftDate: undefined,
      },
    },
    extrasBought: {
      ...bought,
      giftNeighbourIds: [...bought.giftNeighbourIds, neighbourId],
    },
  };
}
