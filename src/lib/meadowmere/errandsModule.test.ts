import { describe, expect, it } from "vitest";
import { ERRAND_FRIENDSHIP, ERRAND_SEEDS } from "./catalog";
import {
  claimErrand,
  errandStatus,
  obtainableItems,
  todaysErrand,
} from "./errandsModule";
import { itemCount, seedCount } from "./inventory";
import { friendshipOf, likesItem } from "./neighboursModule";
import type { MeadowmereState } from "./schema";
import { makeMeadowmereState } from "./testFixtures";

const TODAY = "2026-09-26";

/** A farm past the first quest, so errands are open. */
const open = (overrides?: Partial<MeadowmereState>) =>
  makeMeadowmereState({
    completedQuestIds: ["a-bed-for-parsnips"],
    ...overrides,
  });

/** Every date in a stretch, for properties that must hold whatever the day. */
function days(count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
  );
}

/** State holding exactly what today's errand asks for. */
function readyFor(state: MeadowmereState, today = TODAY): MeadowmereState {
  const errand = todaysErrand(state, today);
  if (errand === null) throw new Error("no errand");
  return { ...state, inventory: { [errand.itemId]: errand.amount } };
}

describe("obtainableItems", () => {
  it("offers the produce of sowable crops and the materials of open sites", () => {
    expect(obtainableItems(makeMeadowmereState())).toEqual([
      "parsnip-root",
      "acorn",
      "bramble-berry",
      "feather",
    ]);
  });

  it("grows as crops and sites are unlocked", () => {
    const state = makeMeadowmereState({
      unlockedCropIds: ["parsnip", "wheat"],
      unlockedSiteIds: ["hedgerow", "orchard"],
    });
    expect(obtainableItems(state)).toEqual(
      expect.arrayContaining(["wheat-sheaf", "crab-apple", "walnut"]),
    );
    expect(obtainableItems(state)).not.toContain("river-clay");
  });
});

describe("todaysErrand", () => {
  it("has nothing to ask until the first quest is done", () => {
    expect(todaysErrand(makeMeadowmereState(), TODAY)).toBeNull();
  });

  it("asks for the same thing all day", () => {
    expect(todaysErrand(open(), TODAY)).toEqual(todaysErrand(open(), TODAY));
  });

  it("changes from day to day", () => {
    const asks = new Set(
      days(30).map((day) => JSON.stringify(todaysErrand(open(), day))),
    );
    expect(asks.size).toBeGreaterThan(5);
  });

  it("gets round to every neighbour", () => {
    const askers = new Set(
      days(60).map((day) => todaysErrand(open(), day)?.neighbourId),
    );
    expect([...askers].sort()).toEqual(["bram", "marigold", "nessa", "wren"]);
  });

  it("only ever asks for something the player can get hold of", () => {
    const state = open();
    const pool = obtainableItems(state);
    for (const day of days(60)) {
      expect(pool).toContain(todaysErrand(state, day)?.itemId);
    }
  });

  it("asks for something the neighbour likes when there is one", () => {
    // Every neighbour likes something from the hedgerow or the parsnip bed,
    // so on a starting farm each ask should be a liked item.
    const state = open();
    for (const day of days(60)) {
      const errand = todaysErrand(state, day);
      if (errand === null) throw new Error("no errand");
      const anyLiked = obtainableItems(state).some((id) =>
        likesItem(errand.neighbourId, id),
      );
      if (anyLiked) {
        expect(likesItem(errand.neighbourId, errand.itemId)).toBe(true);
      }
    }
  });

  it("asks for two or three at a time", () => {
    for (const day of days(60)) {
      expect([2, 3]).toContain(todaysErrand(open(), day)?.amount);
    }
  });

  it("pays in seeds the player can already sow", () => {
    const state = open({ unlockedCropIds: ["parsnip", "cornflower"] });
    for (const day of days(30)) {
      expect(state.unlockedCropIds).toContain(
        todaysErrand(state, day)?.rewardCropId,
      );
    }
  });
});

describe("errandStatus", () => {
  it("is active while the larder is short", () => {
    const state = open();
    const errand = todaysErrand(state, TODAY);
    if (errand === null) throw new Error("no errand");
    expect(errandStatus(state, errand, TODAY)).toBe("active");
  });

  it("is ready once the larder holds enough", () => {
    const state = readyFor(open());
    const errand = todaysErrand(state, TODAY);
    if (errand === null) throw new Error("no errand");
    expect(errandStatus(state, errand, TODAY)).toBe("ready");
  });

  it("is done once handed in today, whatever the larder holds", () => {
    const state = readyFor(open({ lastErrandDate: TODAY }));
    const errand = todaysErrand(state, TODAY);
    if (errand === null) throw new Error("no errand");
    expect(errandStatus(state, errand, TODAY)).toBe("done");
  });

  it("opens again the next day", () => {
    const state = readyFor(open({ lastErrandDate: "2026-09-25" }));
    const errand = todaysErrand(state, TODAY);
    if (errand === null) throw new Error("no errand");
    expect(errandStatus(state, errand, TODAY)).toBe("ready");
  });
});

describe("claimErrand", () => {
  it("takes the items, pays out, and stamps the day", () => {
    const state = readyFor(open());
    const errand = todaysErrand(state, TODAY);
    if (errand === null) throw new Error("no errand");

    const next = claimErrand(state, TODAY);
    if (next === null) throw new Error("not claimed");

    expect(itemCount(next, errand.itemId)).toBe(0);
    expect(seedCount(next, errand.rewardCropId)).toBe(ERRAND_SEEDS);
    expect(friendshipOf(next, errand.neighbourId)).toBe(ERRAND_FRIENDSHIP);
    expect(next.lastErrandDate).toBe(TODAY);
  });

  it("refuses when the larder is short", () => {
    expect(claimErrand(open(), TODAY)).toBeNull();
  });

  it("refuses a second hand-in on the same day", () => {
    const once = claimErrand(readyFor(open()), TODAY);
    if (once === null) throw new Error("not claimed");
    expect(claimErrand(readyFor(once), TODAY)).toBeNull();
  });

  it("refuses before errands have opened", () => {
    expect(claimErrand(makeMeadowmereState(), TODAY)).toBeNull();
  });
});
