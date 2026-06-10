import { beforeEach, describe, expect, it } from "vitest";
import { createInitialState, loadGladeState, saveGladeState } from "./storage";

const GLADE_KEY = "glade-game-state";

beforeEach(() => {
  localStorage.clear();
});

describe("createInitialState", () => {
  it("starts with one robin visitor, starter ingredients, and tier-1 skills", () => {
    const state = createInitialState();
    expect(state.visitors).toHaveLength(1);
    expect(state.visitors[0].speciesId).toBe("robin");
    expect(state.visitors[0].trust).toBe(0);
    expect(state.residents).toHaveLength(0);
    expect(state.pantry.ingredients.berries).toBe(4);
    expect(state.pantry.ingredients.oats).toBe(4);
    expect(state.skills["treat-cooking"]).toEqual({ tier: 1, xp: 0 });
  });
});

describe("save/load round trip", () => {
  it("returns null when nothing is stored", () => {
    expect(loadGladeState()).toBe(null);
  });

  it("round-trips a saved state", () => {
    const state = createInitialState();
    saveGladeState(state);
    expect(loadGladeState()).toEqual(state);
  });

  it("returns null for corrupt JSON", () => {
    localStorage.setItem(GLADE_KEY, "{not json");
    expect(loadGladeState()).toBe(null);
  });

  it("returns null for data failing schema validation", () => {
    localStorage.setItem(GLADE_KEY, JSON.stringify({ visitors: "nope" }));
    expect(loadGladeState()).toBe(null);
  });
});
