import { describe, expect, it } from "vitest";
import {
  applyFertiliser,
  cheapestAvailablePot,
  computeAvailablePotCount,
  equipBackground,
  equipPot,
  equipStand,
  plantTree,
  unequipStand,
  waterTree,
} from "./inventoryModule";
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

function makeState(overrides: Partial<BonsaiGameState> = {}): BonsaiGameState {
  return {
    trees: [],
    inventory: {
      ownedSpeciesIds: [],
      ownedToolIds: [],
      ownedFertiliserIds: [],
      ownedPotIds: [],
      ownedStandIds: [],
      ownedBackgroundIds: [],
    },
    ...overrides,
  };
}

// ─── computeAvailablePotCount ─────────────────────────────────────────────────

describe("computeAvailablePotCount", () => {
  it("returns 0 when no pots owned", () => {
    expect(computeAvailablePotCount(makeState())).toBe(0);
  });

  it("counts pots not equipped to any tree", () => {
    const state = makeState({
      inventory: {
        ownedSpeciesIds: [],
        ownedToolIds: [],
        ownedFertiliserIds: [],
        ownedPotIds: ["simple-clay-small", "simple-clay-small"],
        ownedStandIds: [],
        ownedBackgroundIds: [],
      },
    });
    expect(computeAvailablePotCount(state)).toBe(2);
  });

  it("subtracts equipped pots", () => {
    const tree = makeTree({ equippedPotId: "simple-clay-small" });
    const state = makeState({
      trees: [tree],
      inventory: {
        ownedSpeciesIds: [],
        ownedToolIds: [],
        ownedFertiliserIds: [],
        ownedPotIds: ["simple-clay-small", "simple-clay-small"],
        ownedStandIds: [],
        ownedBackgroundIds: [],
      },
    });
    expect(computeAvailablePotCount(state)).toBe(1);
  });

  it("excludes a specific tree from the equipped count", () => {
    const tree = makeTree({ id: "t1", equippedPotId: "simple-clay-small" });
    const state = makeState({
      trees: [tree],
      inventory: {
        ownedSpeciesIds: [],
        ownedToolIds: [],
        ownedFertiliserIds: [],
        ownedPotIds: ["simple-clay-small"],
        ownedStandIds: [],
        ownedBackgroundIds: [],
      },
    });
    expect(computeAvailablePotCount(state, "t1")).toBe(1);
  });
});

// ─── cheapestAvailablePot ─────────────────────────────────────────────────────

describe("cheapestAvailablePot", () => {
  it("returns null when no pots owned", () => {
    expect(cheapestAvailablePot(makeState())).toBeNull();
  });

  it("returns null when all pots are equipped", () => {
    const tree = makeTree({ equippedPotId: "simple-clay-small" });
    const state = makeState({
      trees: [tree],
      inventory: {
        ownedSpeciesIds: [],
        ownedToolIds: [],
        ownedFertiliserIds: [],
        ownedPotIds: ["simple-clay-small"],
        ownedStandIds: [],
        ownedBackgroundIds: [],
      },
    });
    expect(cheapestAvailablePot(state)).toBeNull();
  });

  it("returns the cheapest unequipped pot", () => {
    const state = makeState({
      inventory: {
        ownedSpeciesIds: [],
        ownedToolIds: [],
        ownedFertiliserIds: [],
        ownedPotIds: ["glazed-ceramic-large", "simple-clay-small"],
        ownedStandIds: [],
        ownedBackgroundIds: [],
      },
    });
    // simple-clay-small costs less than glazed-ceramic-large
    expect(cheapestAvailablePot(state)).toBe("simple-clay-small");
  });
});

// ─── plantTree ────────────────────────────────────────────────────────────────

describe("plantTree", () => {
  it("returns null when species not owned", () => {
    const state = makeState({
      inventory: {
        ownedSpeciesIds: [],
        ownedToolIds: [],
        ownedFertiliserIds: [],
        ownedPotIds: ["simple-clay-small"],
        ownedStandIds: [],
        ownedBackgroundIds: [],
      },
    });
    expect(plantTree(state, "pine", { x: 50, y: 50 }, "2026-01-01")).toBeNull();
  });

  it("returns null when no pot is available", () => {
    const state = makeState({
      inventory: {
        ownedSpeciesIds: ["pine"],
        ownedToolIds: [],
        ownedFertiliserIds: [],
        ownedPotIds: [],
        ownedStandIds: [],
        ownedBackgroundIds: [],
      },
    });
    expect(plantTree(state, "pine", { x: 50, y: 50 }, "2026-01-01")).toBeNull();
  });

  it("plants a tree and removes species and pot from inventory", () => {
    const state = makeState({
      inventory: {
        ownedSpeciesIds: ["pine"],
        ownedToolIds: [],
        ownedFertiliserIds: [],
        ownedPotIds: ["simple-clay-small"],
        ownedStandIds: [],
        ownedBackgroundIds: [],
      },
    });
    const next = plantTree(state, "pine", { x: 30, y: 70 }, "2026-01-01");
    expect(next).not.toBeNull();
    expect(next?.trees).toHaveLength(1);
    expect(next?.trees[0].speciesId).toBe("pine");
    expect(next?.trees[0].equippedPotId).toBe("simple-clay-small");
    expect(next?.inventory.ownedSpeciesIds).toHaveLength(0);
  });

  it("names the tree with a sequential suffix", () => {
    const tree = makeTree({ speciesId: "pine" });
    const state = makeState({
      trees: [tree],
      inventory: {
        ownedSpeciesIds: ["pine"],
        ownedToolIds: [],
        ownedFertiliserIds: [],
        ownedPotIds: ["simple-clay-small"],
        ownedStandIds: [],
        ownedBackgroundIds: [],
      },
    });
    const next = plantTree(state, "pine", { x: 50, y: 50 }, "2026-01-01");
    expect(next?.trees[0].name).toBe("Pine 2");
  });
});

// ─── equipPot ─────────────────────────────────────────────────────────────────

describe("equipPot", () => {
  it("equips a pot to the matching tree", () => {
    const tree = makeTree({ id: "t1" });
    const state = makeState({ trees: [tree] });
    const next = equipPot(state, "t1", "glazed-ceramic-medium");
    expect(next.trees[0].equippedPotId).toBe("glazed-ceramic-medium");
  });

  it("leaves other trees unchanged", () => {
    const t1 = makeTree({ id: "t1" });
    const t2 = makeTree({ id: "t2" });
    const state = makeState({ trees: [t1, t2] });
    const next = equipPot(state, "t1", "glazed-ceramic-medium");
    expect(next.trees[1].equippedPotId).toBeUndefined();
  });
});

// ─── equipStand / unequipStand ────────────────────────────────────────────────

describe("equipStand", () => {
  it("equips a stand to the matching tree", () => {
    const tree = makeTree({ id: "t1" });
    const state = makeState({ trees: [tree] });
    const next = equipStand(state, "t1", "wooden-stand-small");
    expect(next.trees[0].equippedStandId).toBe("wooden-stand-small");
  });
});

describe("unequipStand", () => {
  it("removes the stand from the matching tree", () => {
    const tree = makeTree({ id: "t1", equippedStandId: "wooden-stand-small" });
    const state = makeState({ trees: [tree] });
    const next = unequipStand(state, "t1");
    expect(next.trees[0].equippedStandId).toBeUndefined();
  });
});

// ─── equipBackground ──────────────────────────────────────────────────────────

describe("equipBackground", () => {
  it("sets equippedBackgroundId on inventory", () => {
    const state = makeState();
    const next = equipBackground(state, "zen-garden");
    expect(next.inventory.equippedBackgroundId).toBe("zen-garden");
  });
});

// ─── applyFertiliser ──────────────────────────────────────────────────────────

describe("applyFertiliser", () => {
  it("returns applied:false when fertiliser not in inventory", () => {
    const state = makeState({ trees: [makeTree()] });
    const result = applyFertiliser(state, "tree-1", "growth-tonic-small");
    expect(result.applied).toBe(false);
    expect(result.state).toBe(state);
  });

  it("returns applied:false when tree not found", () => {
    const state = makeState({
      inventory: {
        ownedSpeciesIds: [],
        ownedToolIds: [],
        ownedFertiliserIds: ["growth-tonic-small"],
        ownedPotIds: [],
        ownedStandIds: [],
        ownedBackgroundIds: [],
      },
    });
    const result = applyFertiliser(state, "no-such-tree", "growth-tonic-small");
    expect(result.applied).toBe(false);
  });

  it("applies growth tonic and consumes it from inventory", () => {
    const tree = makeTree({ activeDaysCount: 5 });
    const state = makeState({
      trees: [tree],
      inventory: {
        ownedSpeciesIds: [],
        ownedToolIds: [],
        ownedFertiliserIds: ["growth-tonic-small"],
        ownedPotIds: [],
        ownedStandIds: [],
        ownedBackgroundIds: [],
      },
    });
    const result = applyFertiliser(state, "tree-1", "growth-tonic-small");
    expect(result.applied).toBe(true);
    expect(result.state.inventory.ownedFertiliserIds).toHaveLength(0);
    expect(result.state.trees[0].activeFertilisers?.growthTonic).toBeDefined();
    expect(
      result.state.trees[0].activeFertilisers?.growthTonic?.expiresAtDay,
    ).toBe(12); // activeDaysCount(5) + duration(7)
  });

  it("applies moisture keeper and consumes it from inventory", () => {
    const tree = makeTree({ activeDaysCount: 3 });
    const state = makeState({
      trees: [tree],
      inventory: {
        ownedSpeciesIds: [],
        ownedToolIds: [],
        ownedFertiliserIds: ["moisture-keeper-small"],
        ownedPotIds: [],
        ownedStandIds: [],
        ownedBackgroundIds: [],
      },
    });
    const result = applyFertiliser(state, "tree-1", "moisture-keeper-small");
    expect(result.applied).toBe(true);
    expect(
      result.state.trees[0].activeFertilisers?.moistureKeeper,
    ).toBeDefined();
  });
});

// ─── waterTree ────────────────────────────────────────────────────────────────

describe("waterTree", () => {
  it("does nothing when no watering tool is owned", () => {
    const tree = makeTree({ id: "t1", activeDaysCount: 5 });
    const state = makeState({ trees: [tree] });
    const next = waterTree(state, "t1");
    expect(next.trees[0].lastWateredDay).toBeUndefined();
  });

  it("sets lastWateredDay when watering-can is owned", () => {
    const tree = makeTree({ id: "t1", activeDaysCount: 5 });
    const state = makeState({
      trees: [tree],
      inventory: {
        ownedSpeciesIds: [],
        ownedToolIds: ["watering-can"],
        ownedFertiliserIds: [],
        ownedPotIds: [],
        ownedStandIds: [],
        ownedBackgroundIds: [],
      },
    });
    const next = waterTree(state, "t1");
    expect(next.trees[0].lastWateredDay).toBe(5);
  });

  it("sets lastWateredDay when garden-hose is owned", () => {
    const tree = makeTree({ id: "t1", activeDaysCount: 8 });
    const state = makeState({
      trees: [tree],
      inventory: {
        ownedSpeciesIds: [],
        ownedToolIds: ["garden-hose"],
        ownedFertiliserIds: [],
        ownedPotIds: [],
        ownedStandIds: [],
        ownedBackgroundIds: [],
      },
    });
    const next = waterTree(state, "t1");
    expect(next.trees[0].lastWateredDay).toBe(8);
  });
});
