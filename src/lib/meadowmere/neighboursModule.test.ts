import { describe, expect, it } from "vitest";
import {
  LIKED_GIFT_FRIENDSHIP,
  MAX_FRIENDSHIP,
  NEUTRAL_GIFT_FRIENDSHIP,
} from "./catalog";
import {
  addFriendship,
  canGift,
  friendshipOf,
  friendshipTier,
  giveGift,
  likesItem,
  neighbourState,
  nextTierThreshold,
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

describe("nextTierThreshold", () => {
  it("reports the next rung up", () => {
    expect(nextTierThreshold(25)).toBe(40);
  });

  it("is null at the top tier", () => {
    expect(nextTierThreshold(90)).toBeNull();
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
    expect(result?.friendshipGained).toBe(LIKED_GIFT_FRIENDSHIP);
    expect(result?.state.neighbours.marigold?.friendship).toBe(
      LIKED_GIFT_FRIENDSHIP,
    );
  });

  it("still earns friendship for an item they are neutral about", () => {
    const state = makeMeadowmereState({ inventory: { pumpkin: 1 } });
    const result = giveGift(state, "marigold", "pumpkin", TODAY);

    expect(result?.liked).toBe(false);
    expect(result?.friendshipGained).toBe(NEUTRAL_GIFT_FRIENDSHIP);
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
      neighbours: { marigold: { friendship: 12 } },
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
