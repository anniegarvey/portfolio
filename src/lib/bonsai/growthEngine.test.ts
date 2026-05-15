import { describe, expect, it } from "vitest";
import {
  cleanExpiredFertilisers,
  growWateredTrees,
  isTreeWatered,
} from "./growthEngine";
import type { BonsaiGameState, BonsaiTree } from "./schema";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeTree(overrides: Partial<BonsaiTree> = {}): BonsaiTree {
  return {
    id: "tree-1",
    speciesId: "pine",
    activeDaysCount: 5,
    acquiredAt: "2026-01-01",
    prunedBranches: [],
    ...overrides,
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

// ─── isTreeWatered ────────────────────────────────────────────────────────────

describe("isTreeWatered", () => {
  it("returns false when lastWateredDay is undefined", () => {
    expect(isTreeWatered(makeTree())).toBe(false);
  });

  it("returns false when tree was watered but retention has run out", () => {
    // activeDaysCount=5, lastWateredDay=4, no moisture keeper → gap of 1 > 0
    const tree = makeTree({ activeDaysCount: 5, lastWateredDay: 4 });
    expect(isTreeWatered(tree)).toBe(false);
  });

  it("returns true when tree was watered on the current day", () => {
    const tree = makeTree({ activeDaysCount: 5, lastWateredDay: 5 });
    expect(isTreeWatered(tree)).toBe(true);
  });

  it("returns true when moisture keeper extends retention", () => {
    // activeDaysCount=5, lastWateredDay=3, retentionDays=2 → gap of 2 <= 2
    const tree = makeTree({
      activeDaysCount: 5,
      lastWateredDay: 3,
      activeFertilisers: {
        moistureKeeper: { expiresAtDay: 10, retentionDays: 2 },
      },
    });
    expect(isTreeWatered(tree)).toBe(true);
  });

  it("ignores expired moisture keeper", () => {
    // expiresAtDay=4 < activeDaysCount=5 → keeper has expired
    const tree = makeTree({
      activeDaysCount: 5,
      lastWateredDay: 3,
      activeFertilisers: {
        moistureKeeper: { expiresAtDay: 4, retentionDays: 2 },
      },
    });
    expect(isTreeWatered(tree)).toBe(false);
  });
});

// ─── cleanExpiredFertilisers ──────────────────────────────────────────────────

describe("cleanExpiredFertilisers", () => {
  it("returns tree unchanged when no fertilisers", () => {
    const tree = makeTree();
    expect(cleanExpiredFertilisers(tree)).toBe(tree);
  });

  it("removes expired growth tonic", () => {
    const tree = makeTree({
      activeDaysCount: 10,
      activeFertilisers: {
        growthTonic: { expiresAtDay: 9, bonusPerTick: 1 },
      },
    });
    const result = cleanExpiredFertilisers(tree);
    expect(result.activeFertilisers).toBeUndefined();
  });

  it("keeps active growth tonic", () => {
    const tonic = { expiresAtDay: 15, bonusPerTick: 1 };
    const tree = makeTree({
      activeDaysCount: 10,
      activeFertilisers: { growthTonic: tonic },
    });
    const result = cleanExpiredFertilisers(tree);
    expect(result.activeFertilisers?.growthTonic).toBe(tonic);
  });

  it("removes expired moisture keeper while keeping active growth tonic", () => {
    const tonic = { expiresAtDay: 15, bonusPerTick: 1 };
    const tree = makeTree({
      activeDaysCount: 10,
      activeFertilisers: {
        growthTonic: tonic,
        moistureKeeper: { expiresAtDay: 8, retentionDays: 2 },
      },
    });
    const result = cleanExpiredFertilisers(tree);
    expect(result.activeFertilisers?.growthTonic).toBe(tonic);
    expect(result.activeFertilisers?.moistureKeeper).toBeUndefined();
  });

  it("returns same tree reference when nothing changed", () => {
    const tonic = { expiresAtDay: 15, bonusPerTick: 1 };
    const tree = makeTree({
      activeDaysCount: 10,
      activeFertilisers: { growthTonic: tonic },
    });
    expect(cleanExpiredFertilisers(tree)).toBe(tree);
  });
});

// ─── growWateredTrees ─────────────────────────────────────────────────────────

describe("growWateredTrees", () => {
  it("does not grow an unwatered tree", () => {
    const tree = makeTree({ activeDaysCount: 5 });
    const state = makeState([tree]);
    const next = growWateredTrees(state, "2026-05-12");
    expect(next.trees[0].activeDaysCount).toBe(5);
    expect(next.lastGrowthCheckDate).toBe("2026-05-12");
  });

  it("grows a watered tree by 1", () => {
    const tree = makeTree({ activeDaysCount: 5, lastWateredDay: 5 });
    const state = makeState([tree]);
    const next = growWateredTrees(state, "2026-05-12");
    expect(next.trees[0].activeDaysCount).toBe(6);
    expect(next.trees[0].lastGrownDate).toBe("2026-05-12");
  });

  it("applies growth tonic bonus on top of the base tick", () => {
    const tree = makeTree({
      activeDaysCount: 5,
      lastWateredDay: 5,
      activeFertilisers: {
        growthTonic: { expiresAtDay: 10, bonusPerTick: 2 },
      },
    });
    const state = makeState([tree]);
    const next = growWateredTrees(state, "2026-05-12");
    expect(next.trees[0].activeDaysCount).toBe(8); // 5 + 1 + 2
  });

  it("cleans expired fertilisers after growth", () => {
    // Tonic expires exactly at activeDaysCount=5; after growing to 6 it should be removed
    const tree = makeTree({
      activeDaysCount: 5,
      lastWateredDay: 5,
      activeFertilisers: {
        growthTonic: { expiresAtDay: 5, bonusPerTick: 1 },
      },
    });
    const state = makeState([tree]);
    const next = growWateredTrees(state, "2026-05-12");
    expect(next.trees[0].activeFertilisers).toBeUndefined();
  });

  it("grows only watered trees when multiple are present", () => {
    const watered = makeTree({
      id: "a",
      activeDaysCount: 3,
      lastWateredDay: 3,
    });
    const dry = makeTree({ id: "b", activeDaysCount: 7 });
    const state = makeState([watered, dry]);
    const next = growWateredTrees(state, "2026-05-12");
    expect(next.trees.find((t) => t.id === "a")?.activeDaysCount).toBe(4);
    expect(next.trees.find((t) => t.id === "b")?.activeDaysCount).toBe(7);
  });

  it("sets lastGrowthCheckDate even when no trees grow", () => {
    const state = makeState([]);
    const next = growWateredTrees(state, "2026-05-12");
    expect(next.lastGrowthCheckDate).toBe("2026-05-12");
  });
});
