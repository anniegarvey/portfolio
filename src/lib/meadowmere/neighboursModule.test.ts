import { describe, expect, it } from "vitest";
import { FRIENDSHIP_TIERS, MAX_FRIENDSHIP } from "./catalog";
import {
  addFriendship,
  canGift,
  friendshipOf,
  friendshipTier,
  giftsTried,
  giftWorth,
  giveGift,
  likesItem,
  neighbourState,
  nextTier,
} from "./neighboursModule";
import { makeMeadowmereState } from "./testFixtures";

const TODAY = "2026-06-11";

describe("neighbourState", () => {
  it("reads a stored neighbour", () => {
    const state = makeMeadowmereState({
      neighbours: { nessa: { friendship: 30 } },
    });
    expect(neighbourState(state, "nessa").friendship).toBe(30);
  });

  it("defaults an unmet neighbour to zero friendship", () => {
    const state = makeMeadowmereState({ neighbours: {} });
    expect(friendshipOf(state, "bram")).toBe(0);
  });
});

describe("friendshipTier", () => {
  it.each([
    [0, "Stranger"],
    [19, "Stranger"],
    [20, "Acquaintance"],
    [40, "Friend"],
    [60, "Confidant"],
    [85, "Dear Friend"],
    [100, "Dear Friend"],
  ])("reports %i as %s", (friendship, name) => {
    expect(friendshipTier(friendship).name).toBe(name);
  });
});

describe("nextTier", () => {
  it("reports the next rung up, and what it is called", () => {
    expect(nextTier(25)).toEqual({ threshold: 40, name: "Friend" });
  });

  it("is null at the top tier", () => {
    expect(nextTier(90)).toBeNull();
  });
});

describe("likesItem", () => {
  it("knows a neighbour's favourites", () => {
    expect(likesItem("marigold", "wild-honey")).toBe(true);
  });

  it("knows what leaves them unmoved", () => {
    expect(likesItem("marigold", "pumpkin")).toBe(false);
  });
});

describe("addFriendship", () => {
  it("clamps at the maximum", () => {
    const state = makeMeadowmereState({
      neighbours: { nessa: { friendship: 95 } },
    });
    expect(friendshipOf(addFriendship(state, "nessa", 50), "nessa")).toBe(
      MAX_FRIENDSHIP,
    );
  });

  it("creates an entry for a neighbour with no state yet", () => {
    const state = makeMeadowmereState({ neighbours: {} });
    expect(friendshipOf(addFriendship(state, "bram", 5), "bram")).toBe(5);
  });
});

describe("what a gift was actually worth", () => {
  it("reports the whole gift when there is room for it", () => {
    const state = makeMeadowmereState({
      neighbours: { marigold: { friendship: 10 } },
      inventory: { "wild-honey": 1 },
    });
    const result = giveGift(state, "marigold", "wild-honey", TODAY);

    expect(result?.friendshipGained).toBe(giftWorth(true, 10));
  });

  it("reports only the part that fitted under the cap", () => {
    // One short of the top, given something worth more than one.
    const state = makeMeadowmereState({
      neighbours: { marigold: { friendship: MAX_FRIENDSHIP - 1 } },
      inventory: { "wild-honey": 1 },
    });
    const result = giveGift(state, "marigold", "wild-honey", TODAY);

    expect(giftWorth(true, MAX_FRIENDSHIP - 1)).toBeGreaterThan(1);
    expect(result?.friendshipGained).toBe(1);
    expect(friendshipOf(result?.state ?? state, "marigold")).toBe(
      MAX_FRIENDSHIP,
    );
  });

  it("reports nothing gained once a neighbour is as close as they get", () => {
    const state = makeMeadowmereState({
      neighbours: { marigold: { friendship: MAX_FRIENDSHIP } },
      inventory: { "wild-honey": 1 },
    });
    const result = giveGift(state, "marigold", "wild-honey", TODAY);

    // Still a gift: the item is spent and the day is used up. It just doesn't
    // claim to have earned anything.
    expect(result?.friendshipGained).toBe(0);
    expect(result?.liked).toBe(true);
  });
});

describe("canGift", () => {
  it("allows a gift the player holds", () => {
    const state = makeMeadowmereState({ inventory: { "wild-honey": 1 } });
    expect(canGift(state, "marigold", "wild-honey", TODAY)).toBe(true);
  });

  it("refuses an item the player does not hold", () => {
    expect(
      canGift(makeMeadowmereState(), "marigold", "wild-honey", TODAY),
    ).toBe(false);
  });

  it("refuses a second gift to the same neighbour the same day", () => {
    const state = makeMeadowmereState({
      inventory: { "wild-honey": 3 },
      neighbours: { marigold: { friendship: 0, lastGiftDate: TODAY } },
    });
    expect(canGift(state, "marigold", "wild-honey", TODAY)).toBe(false);
  });
});

describe("giveGift", () => {
  it("earns more friendship for a liked item", () => {
    const state = makeMeadowmereState({ inventory: { "wild-honey": 1 } });
    const result = giveGift(state, "marigold", "wild-honey", TODAY);

    expect(result?.liked).toBe(true);
    expect(result?.friendshipGained).toBe(giftWorth(true, 0));
    expect(result?.friendshipGained).toBeGreaterThan(giftWorth(false, 0));
    expect(result?.state.neighbours.marigold?.friendship).toBe(
      giftWorth(true, 0),
    );
  });

  it("still earns friendship for an item they are neutral about", () => {
    const state = makeMeadowmereState({ inventory: { pumpkin: 1 } });
    const result = giveGift(state, "marigold", "pumpkin", TODAY);

    expect(result?.liked).toBe(false);
    expect(result?.friendshipGained).toBe(giftWorth(false, 0));
    expect(result?.friendshipGained).toBeGreaterThan(0);
  });

  it("consumes the gifted item and stamps the day", () => {
    const state = makeMeadowmereState({ inventory: { "wild-honey": 2 } });
    const result = giveGift(state, "marigold", "wild-honey", TODAY);

    expect(result?.state.inventory["wild-honey"]).toBe(1);
    expect(result?.state.neighbours.marigold?.lastGiftDate).toBe(TODAY);
  });

  it("reports crossing into a new friendship tier", () => {
    const state = makeMeadowmereState({
      inventory: { "wild-honey": 1 },
      neighbours: { marigold: { friendship: 18 } },
    });
    const result = giveGift(state, "marigold", "wild-honey", TODAY);
    expect(result?.newTierName).toBe("Acquaintance");
  });

  it("reports no new tier when the gift stays inside one", () => {
    const state = makeMeadowmereState({
      inventory: { "wild-honey": 1 },
      neighbours: { marigold: { friendship: 0 } },
    });
    expect(giveGift(state, "marigold", "wild-honey", TODAY)?.newTierName).toBe(
      null,
    );
  });

  it("returns null when the gift is not allowed", () => {
    expect(
      giveGift(makeMeadowmereState(), "marigold", "wild-honey", TODAY),
    ).toBeNull();
  });

  it("allows a gift again the next day", () => {
    const state = makeMeadowmereState({ inventory: { "wild-honey": 2 } });
    const first = giveGift(state, "marigold", "wild-honey", TODAY);
    const second =
      first && giveGift(first.state, "marigold", "wild-honey", "2026-06-12");
    expect(second).not.toBeNull();
  });
});

describe("friendship pacing", () => {
  /** Days of one liked gift a day, and nothing else, to reach `target`. */
  function daysOfLikedGifts(target: number): number {
    let friendship = 0;
    let days = 0;
    while (friendship < target) {
      friendship = Math.min(
        MAX_FRIENDSHIP,
        friendship + giftWorth(true, friendship),
      );
      days += 1;
    }
    return days;
  }

  it("earns less from a gift the closer a neighbour already is", () => {
    const worth = FRIENDSHIP_TIERS.map((tier) =>
      giftWorth(true, tier.threshold),
    );
    expect([...worth].sort((a, b) => b - a)).toEqual(worth);
    expect(worth[0]).toBeGreaterThan(worth[worth.length - 1]);
  });

  it("always earns something, even from a gift they don't care for", () => {
    for (const tier of FRIENDSHIP_TIERS) {
      expect(giftWorth(false, tier.threshold)).toBeGreaterThan(0);
      expect(giftWorth(true, tier.threshold)).toBeGreaterThan(
        giftWorth(false, tier.threshold),
      );
    }
  });

  it("takes a few days of favourites to make an acquaintance", () => {
    expect(daysOfLikedGifts(20)).toBeGreaterThanOrEqual(3);
  });

  it("takes weeks of favourites to make a dear friend", () => {
    expect(daysOfLikedGifts(85)).toBeGreaterThanOrEqual(21);
  });
});

describe("giftsTried", () => {
  it("starts empty for a neighbour who has had nothing yet", () => {
    expect(giftsTried(makeMeadowmereState(), "marigold")).toEqual({
      favourites: [],
      others: [],
    });
  });

  it("remembers each gift, sorted into favourites and the rest", () => {
    const state = makeMeadowmereState({
      inventory: { "wild-honey": 1, pumpkin: 1 },
    });
    const first = giveGift(state, "marigold", "pumpkin", TODAY);
    if (first === null) throw new Error("not given");
    const second = giveGift(
      first.state,
      "marigold",
      "wild-honey",
      "2026-06-12",
    );
    if (second === null) throw new Error("not given");

    expect(giftsTried(second.state, "marigold")).toEqual({
      favourites: ["wild-honey"],
      others: ["pumpkin"],
    });
  });

  it("records an item once however often it is given", () => {
    const state = makeMeadowmereState({ inventory: { "wild-honey": 2 } });
    const first = giveGift(state, "marigold", "wild-honey", TODAY);
    if (first === null) throw new Error("not given");
    const second = giveGift(
      first.state,
      "marigold",
      "wild-honey",
      "2026-06-12",
    );

    expect(second?.state.neighbours.marigold?.giftedItemIds).toEqual([
      "wild-honey",
    ]);
  });

  it("keeps each neighbour's record to themselves", () => {
    const state = makeMeadowmereState({ inventory: { "wild-honey": 1 } });
    const given = giveGift(state, "marigold", "wild-honey", TODAY);
    if (given === null) throw new Error("not given");

    expect(giftsTried(given.state, "nessa").favourites).toEqual([]);
  });

  it("lists them in catalog order, not the order they were given", () => {
    const state = makeMeadowmereState({
      neighbours: {
        marigold: { friendship: 0, giftedItemIds: ["reed", "wild-honey"] },
      },
    });
    expect(giftsTried(state, "marigold").favourites).toEqual([
      "reed",
      "wild-honey",
    ]);
  });
});
