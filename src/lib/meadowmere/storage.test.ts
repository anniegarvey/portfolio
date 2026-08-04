import { beforeEach, describe, expect, it } from "vitest";
import { STARTING_PLOTS } from "./catalog";
import {
  createInitialState,
  EMPTY_STATE,
  loadMeadowmereState,
  makeEmptyPlots,
  saveMeadowmereState,
} from "./storage";

const KEY = "meadowmere-game-state";

beforeEach(() => {
  localStorage.clear();
});

describe("makeEmptyPlots", () => {
  it("makes the requested number of bare plots with distinct ids", () => {
    const plots = makeEmptyPlots(3);

    expect(plots).toHaveLength(3);
    expect(plots.every((p) => p.planting === null)).toBe(true);
    expect(new Set(plots.map((p) => p.id)).size).toBe(3);
  });
});

describe("createInitialState", () => {
  it("starts with bare plots, parsnip seeds and the hedgerow", () => {
    const state = createInitialState();

    expect(state.plots).toHaveLength(STARTING_PLOTS);
    expect(state.seeds.parsnip).toBe(6);
    expect(state.unlockedCropIds).toEqual(["parsnip"]);
    expect(state.unlockedSiteIds).toEqual(["hedgerow"]);
    expect(state.completedQuestIds).toEqual([]);
  });

  it("counts today as already advanced so the first tick is tomorrow", () => {
    expect(createInitialState().lastAdvanceDate).toBeDefined();
  });
});

describe("save and load", () => {
  it("round-trips a state", () => {
    const state = createInitialState();
    saveMeadowmereState(state);
    expect(loadMeadowmereState()).toEqual(state);
  });

  it("returns null when nothing is stored", () => {
    expect(loadMeadowmereState()).toBeNull();
  });

  it("returns null for unparseable JSON", () => {
    localStorage.setItem(KEY, "{ not json");
    expect(loadMeadowmereState()).toBeNull();
  });

  it("returns null for a state that fails the schema", () => {
    localStorage.setItem(KEY, JSON.stringify({ plots: "not an array" }));
    expect(loadMeadowmereState()).toBeNull();
  });

  it("still parses a save written before a neighbour existed", () => {
    const state = {
      ...createInitialState(),
      neighbours: { nessa: { friendship: 5 } },
    };
    localStorage.setItem(KEY, JSON.stringify(state));
    expect(loadMeadowmereState()?.neighbours.bram).toBeUndefined();
  });
});

describe("EMPTY_STATE", () => {
  it("is inert so the server and first client render match", () => {
    expect(EMPTY_STATE.plots).toEqual([]);
    expect(EMPTY_STATE.lastAdvanceDate).toBeUndefined();
  });
});
