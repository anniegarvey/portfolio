import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createInitialState,
  loadBonsaiState,
  saveBonsaiState,
} from "./storage";

const STORAGE_KEY_V1 = "bonsai-game-state";
const STORAGE_KEY = "bonsai-game-state-v2";

afterEach(() => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY_V1);
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

  it("round-trips a valid state under the v2 key", () => {
    const state = createInitialState();
    saveBonsaiState(state);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
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

  describe("v1 → v2 migration (Phase 9)", () => {
    function writeV1State(state: ReturnType<typeof createInitialState>) {
      localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(state));
    }

    it("loads from the v1 key when v2 is empty", () => {
      const state = createInitialState();
      writeV1State(state);
      const loaded = loadBonsaiState();
      expect(loaded?.trees[0].id).toBe(state.trees[0].id);
    });

    it("migrates the v1 payload into the v2 key on first load", () => {
      writeV1State(createInitialState());
      loadBonsaiState();
      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
      expect(localStorage.getItem(STORAGE_KEY_V1)).toBeNull();
    });

    it("prefers v2 over v1 when both are present", () => {
      const v1 = createInitialState();
      v1.trees[0].name = "From v1";
      writeV1State(v1);

      const v2 = createInitialState();
      v2.trees[0].name = "From v2";
      saveBonsaiState(v2);

      expect(loadBonsaiState()?.trees[0].name).toBe("From v2");
      // v1 stays untouched when not used as the source of truth.
      expect(localStorage.getItem(STORAGE_KEY_V1)).not.toBeNull();
    });

    it("migrates L{i} branch IDs to p{2i} during v1 → v2 promotion", () => {
      const state = createInitialState();
      state.trees[0].prunedBranches = [{ branchId: "L0", prunedAtDay: 5 }];
      writeV1State(state);
      const loaded = loadBonsaiState();
      expect(loaded?.trees[0].prunedBranches[0].branchId).toBe("p0");
    });

    it("migrates R{i} branch IDs to p{2i+1} during v1 → v2 promotion", () => {
      const state = createInitialState();
      state.trees[0].prunedBranches = [{ branchId: "R1", prunedAtDay: 5 }];
      writeV1State(state);
      const loaded = loadBonsaiState();
      expect(loaded?.trees[0].prunedBranches[0].branchId).toBe("p3");
    });

    it("preserves child segments when migrating root IDs", () => {
      const state = createInitialState();
      state.trees[0].prunedBranches = [{ branchId: "L2-a-b", prunedAtDay: 5 }];
      writeV1State(state);
      const loaded = loadBonsaiState();
      expect(loaded?.trees[0].prunedBranches[0].branchId).toBe("p4-a-b");
    });

    it("does not re-run the L/R migration on subsequent v2 reads", () => {
      const state = createInitialState();
      // p3-a is what an L1-a record looks like *after* migration. Storing it
      // directly under the v2 key represents a state that has already been
      // promoted — we must not touch it again.
      state.trees[0].prunedBranches = [{ branchId: "p3-a", prunedAtDay: 5 }];
      saveBonsaiState(state);
      const loaded = loadBonsaiState();
      expect(loaded?.trees[0].prunedBranches[0].branchId).toBe("p3-a");
    });
  });
});
