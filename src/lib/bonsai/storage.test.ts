import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createInitialState,
  loadBonsaiState,
  saveBonsaiState,
} from "./storage";

const STORAGE_KEY = "bonsai-game-state";

afterEach(() => {
  localStorage.removeItem(STORAGE_KEY);
  vi.unstubAllGlobals();
});

// ─── createInitialState ───────────────────────────────────────────────────────

describe("createInitialState", () => {
  it("returns a state with one pine tree at day 0", () => {
    const state = createInitialState();
    expect(state.trees).toHaveLength(1);
    expect(state.trees[0].speciesId).toBe("pine");
    expect(state.trees[0].activeDaysCount).toBe(0);
    expect(state.trees[0].prunedBranches).toHaveLength(0);
  });

  it("places the starter pine at the garden center", () => {
    const state = createInitialState();
    expect(state.trees[0].gardenPosition).toEqual({ x: 50, y: 50 });
  });

  it("starts with one pot (free simple-clay-small for the first tree)", () => {
    const { inventory } = createInitialState();
    expect(inventory.ownedSpeciesIds).toHaveLength(0);
    expect(inventory.ownedToolIds).toHaveLength(0);
    expect(inventory.ownedFertiliserIds).toHaveLength(0);
    expect(inventory.ownedPotIds).toEqual(["simple-clay-small"]);
    expect(inventory.ownedStandIds).toHaveLength(0);
  });

  it("generates a unique tree id on each call", () => {
    const a = createInitialState();
    const b = createInitialState();
    expect(a.trees[0].id).not.toBe(b.trees[0].id);
  });
});

// ─── saveBonsaiState / loadBonsaiState ────────────────────────────────────────

describe("saveBonsaiState / loadBonsaiState", () => {
  it("returns null when nothing is stored", () => {
    expect(loadBonsaiState()).toBeNull();
  });

  it("round-trips a valid state", () => {
    const state = createInitialState();
    saveBonsaiState(state);
    const loaded = loadBonsaiState();
    expect(loaded).not.toBeNull();
    expect(loaded?.trees[0].id).toBe(state.trees[0].id);
  });

  it("persists inventory state", () => {
    const state = createInitialState();
    state.inventory.ownedToolIds.push("watering-can");
    saveBonsaiState(state);
    const loaded = loadBonsaiState();
    expect(loaded?.inventory.ownedToolIds).toContain("watering-can");
  });

  it("returns null for corrupt JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not valid json");
    expect(loadBonsaiState()).toBeNull();
  });

  it("returns null when the stored object fails schema validation", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ garbage: true }));
    expect(loadBonsaiState()).toBeNull();
  });

  it("returns null on the server (no window object)", () => {
    vi.stubGlobal("window", undefined);
    expect(loadBonsaiState()).toBeNull();
  });

  it("does not throw when saving on the server (no window object)", () => {
    vi.stubGlobal("window", undefined);
    const state = createInitialState();
    expect(() => saveBonsaiState(state)).not.toThrow();
  });

  describe("branch ID migration (Phase 3)", () => {
    it("migrates L{i} branch IDs to p{2i} on load", () => {
      const state = createInitialState();
      state.trees[0].prunedBranches = [{ branchId: "L0", prunedAtDay: 5 }];
      saveBonsaiState(state);
      const loaded = loadBonsaiState();
      expect(loaded?.trees[0].prunedBranches[0].branchId).toBe("p0");
    });

    it("migrates R{i} branch IDs to p{2i+1} on load", () => {
      const state = createInitialState();
      state.trees[0].prunedBranches = [{ branchId: "R1", prunedAtDay: 5 }];
      saveBonsaiState(state);
      const loaded = loadBonsaiState();
      expect(loaded?.trees[0].prunedBranches[0].branchId).toBe("p3");
    });

    it("preserves child segments when migrating root IDs", () => {
      const state = createInitialState();
      state.trees[0].prunedBranches = [{ branchId: "L2-a-b", prunedAtDay: 5 }];
      saveBonsaiState(state);
      const loaded = loadBonsaiState();
      expect(loaded?.trees[0].prunedBranches[0].branchId).toBe("p4-a-b");
    });

    it("leaves already-migrated p{n} IDs unchanged", () => {
      const state = createInitialState();
      state.trees[0].prunedBranches = [{ branchId: "p3-a", prunedAtDay: 5 }];
      saveBonsaiState(state);
      const loaded = loadBonsaiState();
      expect(loaded?.trees[0].prunedBranches[0].branchId).toBe("p3-a");
    });
  });
});
