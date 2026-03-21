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

  it("sets activePlantedTreeId to the tree's id", () => {
    const state = createInitialState();
    expect(state.activePlantedTreeId).toBe(state.trees[0].id);
  });

  it("returns empty inventory across all categories", () => {
    const { inventory } = createInitialState();
    expect(inventory.ownedSpeciesIds).toHaveLength(0);
    expect(inventory.ownedToolIds).toHaveLength(0);
    expect(inventory.ownedFertiliserIds).toHaveLength(0);
    expect(inventory.ownedPotIds).toHaveLength(0);
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
    expect(loaded?.activePlantedTreeId).toBe(state.activePlantedTreeId);
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
});
