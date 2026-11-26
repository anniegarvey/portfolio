import { describe, expect, it } from "vitest";
import { EXTRA_TRIP_COSTS, FORAGES_PER_DAY, GROW_TONIC_COSTS } from "./catalog";
import {
  buyExtraGift,
  buyExtraTrip,
  buyGrowTonic,
  canBuyExtraGift,
  canBuyExtraTrip,
  canBuyGrowTonic,
  extrasBoughtToday,
  extraTripCost,
  growTonicCost,
} from "./extrasModule";
import { foragesLeft } from "./foragingModule";
import { canGift } from "./neighboursModule";
import {
  makeMeadowmereState,
  makePlanting,
  makePlot,
  PLOT_ID_A,
  PLOT_ID_B,
} from "./testFixtures";

const TODAY = "2026-06-12";

/** Unwraps a purchase the test expects to go through. */
function bought<T>(result: T | null): T {
  if (result === null) throw new Error("expected the purchase to go through");
  return result;
}

describe("extrasBoughtToday", () => {
  it("counts nothing for a fresh save", () => {
    expect(extrasBoughtToday(makeMeadowmereState(), TODAY)).toEqual({
      date: TODAY,
      trips: 0,
      tonics: 0,
      giftNeighbourIds: [],
    });
  });

  it("forgets what was bought on an earlier day", () => {
    const state = makeMeadowmereState({
      extrasBought: {
        date: "2026-06-11",
        trips: 3,
        tonics: 1,
        giftNeighbourIds: ["bram"],
      },
    });
    expect(extrasBoughtToday(state, TODAY).trips).toBe(0);
  });
});

describe("extra trips", () => {
  const spent = makeMeadowmereState({ foragesToday: FORAGES_PER_DAY });

  it("can't be bought while free trips are left", () => {
    expect(canBuyExtraTrip(makeMeadowmereState(), TODAY)).toBe(false);
    expect(buyExtraTrip(makeMeadowmereState(), TODAY)).toBeNull();
  });

  it("hands back one trip once the day's are spent", () => {
    const next = bought(buyExtraTrip(spent, TODAY));
    expect(foragesLeft(next)).toBe(1);
    expect(next.extrasBought?.trips).toBe(1);
  });

  it("climbs in price with each one bought that day", () => {
    expect(extraTripCost(spent, TODAY)).toBe(EXTRA_TRIP_COSTS[0]);
    const once = {
      ...bought(buyExtraTrip(spent, TODAY)),
      foragesToday: FORAGES_PER_DAY,
    };
    expect(extraTripCost(once, TODAY)).toBe(EXTRA_TRIP_COSTS[1]);
  });

  it("stops at the day's cap and starts over tomorrow", () => {
    const capped = makeMeadowmereState({
      foragesToday: FORAGES_PER_DAY,
      extrasBought: {
        date: TODAY,
        trips: EXTRA_TRIP_COSTS.length,
        tonics: 0,
        giftNeighbourIds: [],
      },
    });
    expect(extraTripCost(capped, TODAY)).toBeNull();
    expect(buyExtraTrip(capped, TODAY)).toBeNull();
    expect(extraTripCost(capped, "2026-06-13")).toBe(EXTRA_TRIP_COSTS[0]);
  });
});

describe("grow tonic", () => {
  const growing = makeMeadowmereState({
    plots: [
      // Parsnip ripens in two days: planted yesterday, it's still growing.
      makePlot({ planting: makePlanting({ plantedDate: "2026-06-11" }) }),
      makePlot({
        id: PLOT_ID_B,
        planting: makePlanting({ plantedDate: "2026-06-01" }),
      }),
    ],
  });

  it("moves every growing planting a day along and leaves ripe ones be", () => {
    const next = bought(buyGrowTonic(growing, TODAY));
    const plantedDates = next.plots.map((p) => p.planting?.plantedDate);
    expect(plantedDates).toEqual(["2026-06-10", "2026-06-01"]);
    expect(next.extrasBought?.tonics).toBe(1);
  });

  it("isn't for sale with nothing growing", () => {
    const bare = makeMeadowmereState({ plots: [makePlot()] });
    expect(canBuyGrowTonic(bare, TODAY)).toBe(false);
    expect(buyGrowTonic(bare, TODAY)).toBeNull();
  });

  it("climbs in price and stops at the day's cap", () => {
    expect(growTonicCost(growing, TODAY)).toBe(GROW_TONIC_COSTS[0]);
    const capped = {
      ...growing,
      extrasBought: {
        date: TODAY,
        trips: 0,
        tonics: GROW_TONIC_COSTS.length,
        giftNeighbourIds: [],
      },
    };
    expect(growTonicCost(capped, TODAY)).toBeNull();
    expect(buyGrowTonic(capped, TODAY)).toBeNull();
  });

  it("keeps other plots' ids in place", () => {
    const next = bought(buyGrowTonic(growing, TODAY));
    expect(next.plots.map((p) => p.id)).toEqual([PLOT_ID_A, PLOT_ID_B]);
  });
});

describe("extra gifts", () => {
  const giftedBram = makeMeadowmereState({
    inventory: { "parsnip-root": 2 },
    neighbours: {
      nessa: { friendship: 0 },
      bram: { friendship: 10, lastGiftDate: TODAY },
      marigold: { friendship: 0 },
      wren: { friendship: 0 },
    },
  });

  it("can't be bought before the day's gift is given", () => {
    expect(canBuyExtraGift(giftedBram, "nessa", TODAY)).toBe(false);
    expect(buyExtraGift(giftedBram, "nessa", TODAY)).toBeNull();
  });

  it("lets a neighbour take another gift today", () => {
    expect(canGift(giftedBram, "bram", "parsnip-root", TODAY)).toBe(false);
    const next = bought(buyExtraGift(giftedBram, "bram", TODAY));
    expect(canGift(next, "bram", "parsnip-root", TODAY)).toBe(true);
    expect(next.neighbours.bram?.friendship).toBe(10);
  });

  it("is once per neighbour per day", () => {
    const once = bought(buyExtraGift(giftedBram, "bram", TODAY));
    const giftedAgain = {
      ...once,
      neighbours: {
        ...once.neighbours,
        bram: { friendship: 12, lastGiftDate: TODAY },
      },
    };
    expect(canBuyExtraGift(giftedAgain, "bram", TODAY)).toBe(false);
  });
});
