import { describe, expect, it } from "vitest";
import { describeGrowth, diffGrowth } from "./growthEvents";
import type { BonsaiGameState, BonsaiTree } from "./schema";

function makeTree(id: string, activeDaysCount: number): BonsaiTree {
  return {
    id,
    speciesId: "pine",
    activeDaysCount,
    acquiredAt: "2025-01-01",
    prunedBranches: [],
  };
}

function makeState(trees: BonsaiTree[]): BonsaiGameState {
  return {
    trees,
    inventory: {
      ownedSpeciesIds: [],
      ownedToolIds: [],
      ownedFertiliserIds: [],
      ownedPotIds: [],
      ownedStandIds: [],
      ownedBackgroundIds: [],
    },
  };
}

describe("diffGrowth", () => {
  it("reports nothing when no tree gained a day", () => {
    const state = makeState([makeTree("a", 4), makeTree("b", 12)]);
    expect(diffGrowth(state, state)).toEqual([]);
  });

  it("reports the days a tree gained", () => {
    const before = makeState([makeTree("a", 4)]);
    const after = makeState([makeTree("a", 5)]);
    expect(diffGrowth(before, after)).toEqual([
      { treeId: "a", daysGained: 1, newStage: null },
    ]);
  });

  it("counts a multi-day tonic jump as one event", () => {
    const before = makeState([makeTree("a", 4)]);
    const after = makeState([makeTree("a", 7)]);
    expect(diffGrowth(before, after)).toEqual([
      { treeId: "a", daysGained: 3, newStage: null },
    ]);
  });

  it("names the new stage when growth crosses a boundary", () => {
    const before = makeState([makeTree("a", 9)]);
    const after = makeState([makeTree("a", 10)]);
    expect(diffGrowth(before, after)).toEqual([
      { treeId: "a", daysGained: 1, newStage: "Sapling" },
    ]);
  });

  it("names the new stage when a jump lands past the boundary without hitting it", () => {
    // Day 25 is the Young Tree threshold; a tonic can step 24 → 27 straight
    // over it, which a "count equals a threshold" check would miss.
    const before = makeState([makeTree("a", 24)]);
    const after = makeState([makeTree("a", 27)]);
    expect(diffGrowth(before, after)).toEqual([
      { treeId: "a", daysGained: 3, newStage: "Young Tree" },
    ]);
  });

  it("reports each grown tree and skips the ones that stood still", () => {
    const before = makeState([
      makeTree("a", 4),
      makeTree("b", 12),
      makeTree("c", 49),
    ]);
    const after = makeState([
      makeTree("a", 5),
      makeTree("b", 12),
      makeTree("c", 50),
    ]);
    expect(diffGrowth(before, after)).toEqual([
      { treeId: "a", daysGained: 1, newStage: null },
      { treeId: "c", daysGained: 1, newStage: "Mature Tree" },
    ]);
  });

  it("treats a tree the earlier state never held as planted, not grown", () => {
    const before = makeState([]);
    const after = makeState([makeTree("a", 30)]);
    expect(diffGrowth(before, after)).toEqual([]);
  });

  it("ignores a tree whose day count went backwards", () => {
    const before = makeState([makeTree("a", 8)]);
    const after = makeState([makeTree("a", 6)]);
    expect(diffGrowth(before, after)).toEqual([]);
  });
});

describe("describeGrowth", () => {
  const nameOf = (treeId: string) => `Tree ${treeId.toUpperCase()}`;

  it("says nothing when nothing grew", () => {
    expect(describeGrowth([], nameOf)).toBe("");
  });

  it("names the tree and the days it gained", () => {
    expect(
      describeGrowth([{ treeId: "a", daysGained: 1, newStage: null }], nameOf),
    ).toBe("Tree A grew 1 day.");
  });

  it("pluralises a multi-day gain", () => {
    expect(
      describeGrowth([{ treeId: "a", daysGained: 3, newStage: null }], nameOf),
    ).toBe("Tree A grew 3 days.");
  });

  it("adds the milestone for a single tree", () => {
    expect(
      describeGrowth(
        [{ treeId: "a", daysGained: 1, newStage: "Sapling" }],
        nameOf,
      ),
    ).toBe("Tree A grew 1 day. It is now a Sapling.");
  });

  // Five trees growing overnight is one piece of news, not five.
  it("summarises a whole garden and calls out only the milestones", () => {
    expect(
      describeGrowth(
        [
          { treeId: "a", daysGained: 1, newStage: null },
          { treeId: "b", daysGained: 1, newStage: "Mature Tree" },
          { treeId: "c", daysGained: 2, newStage: null },
        ],
        nameOf,
      ),
    ).toBe("3 trees grew today. Tree B is now a Mature Tree.");
  });
});
