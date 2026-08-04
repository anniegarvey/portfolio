import { describe, expect, it } from "vitest";
import {
  addItems,
  addSeeds,
  hasItems,
  itemCount,
  removeItems,
  seedCount,
} from "./inventory";
import { makeMeadowmereState } from "./testFixtures";

describe("itemCount / seedCount", () => {
  it("reads a stack", () => {
    const state = makeMeadowmereState({
      inventory: { acorn: 3 },
      seeds: { parsnip: 2 },
    });
    expect(itemCount(state, "acorn")).toBe(3);
    expect(seedCount(state, "parsnip")).toBe(2);
  });

  it("treats an absent stack as zero", () => {
    const state = makeMeadowmereState();
    expect(itemCount(state, "acorn")).toBe(0);
    expect(seedCount(state, "pumpkin")).toBe(0);
  });
});

describe("addItems", () => {
  it("creates a stack that did not exist", () => {
    const next = addItems(makeMeadowmereState(), { acorn: 2 });
    expect(next.inventory.acorn).toBe(2);
  });

  it("adds to an existing stack", () => {
    const state = makeMeadowmereState({ inventory: { acorn: 2 } });
    expect(addItems(state, { acorn: 3 }).inventory.acorn).toBe(5);
  });

  it("adds several items at once", () => {
    const next = addItems(makeMeadowmereState(), { acorn: 1, reed: 4 });
    expect(next.inventory).toEqual({ acorn: 1, reed: 4 });
  });

  it("does not mutate the original state", () => {
    const state = makeMeadowmereState({ inventory: { acorn: 2 } });
    addItems(state, { acorn: 3 });
    expect(state.inventory.acorn).toBe(2);
  });
});

describe("addSeeds", () => {
  it("adds to a seed packet count", () => {
    const state = makeMeadowmereState({ seeds: { parsnip: 1 } });
    expect(addSeeds(state, { parsnip: 2 }).seeds.parsnip).toBe(3);
  });

  it("creates a packet count that did not exist", () => {
    expect(addSeeds(makeMeadowmereState(), { pumpkin: 2 }).seeds.pumpkin).toBe(
      2,
    );
  });
});

describe("hasItems", () => {
  it("is true when every stack is deep enough", () => {
    const state = makeMeadowmereState({ inventory: { acorn: 3, reed: 2 } });
    expect(hasItems(state, { acorn: 2, reed: 2 })).toBe(true);
  });

  it("is false when any stack is short", () => {
    const state = makeMeadowmereState({ inventory: { acorn: 3, reed: 1 } });
    expect(hasItems(state, { acorn: 2, reed: 2 })).toBe(false);
  });

  it("is true for an empty requirement", () => {
    expect(hasItems(makeMeadowmereState(), {})).toBe(true);
  });
});

describe("removeItems", () => {
  it("takes items out of the larder", () => {
    const state = makeMeadowmereState({ inventory: { acorn: 5 } });
    expect(removeItems(state, { acorn: 2 }).inventory.acorn).toBe(3);
  });

  it("floors at zero rather than persisting a negative stack", () => {
    const state = makeMeadowmereState({ inventory: { acorn: 1 } });
    expect(removeItems(state, { acorn: 4 }).inventory.acorn).toBe(0);
  });
});
