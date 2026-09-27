import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadPresets,
  type Preset,
  removePreset,
  savePresets,
  upsertPreset,
} from "./presets";
import { DEFAULT_SETTINGS, type DriftSettings } from "./settings";

const KEY = "drift-presets";
const calm: Preset = {
  name: "Evening calm",
  settings: { ...DEFAULT_SETTINGS, palette: "dusk", speed: 0.5 },
};
const party: Preset = {
  name: "Party",
  settings: { ...DEFAULT_SETTINGS, palette: "rainbow", swirl: 1 },
};

beforeEach(() => {
  localStorage.clear();
});

describe("loadPresets", () => {
  it("is empty when nothing is saved", () => {
    expect(loadPresets()).toEqual([]);
  });

  it("returns what was saved, in order", () => {
    savePresets([calm, party]);
    expect(loadPresets()).toEqual([calm, party]);
  });

  it("is empty for unreadable storage", () => {
    localStorage.setItem(KEY, "{nope");
    expect(loadPresets()).toEqual([]);
    localStorage.setItem(KEY, JSON.stringify({ name: "not a list" }));
    expect(loadPresets()).toEqual([]);
  });

  it("skips entries that aren't presets and keeps the rest", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([calm, { name: "   ", settings: {} }, "junk", party]),
    );
    expect(loadPresets()).toEqual([calm, party]);
  });

  it("repairs out-of-range settings inside a preset", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { name: "Odd", settings: { ...calm.settings, speed: 9 } },
      ]),
    );
    expect(loadPresets()[0].settings.speed).toBe(DEFAULT_SETTINGS.speed);
  });

  it("is empty when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadPresets()).toEqual([]);
  });
});

describe("savePresets", () => {
  it("shrugs off storage that throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    expect(() => savePresets([calm])).not.toThrow();
  });
});

describe("upsertPreset", () => {
  it("adds a new name to the end, trimmed", () => {
    const next = upsertPreset([calm], "  Party ", party.settings);
    expect(next).toEqual([calm, party]);
  });

  it("updates an existing name in place, ignoring case", () => {
    const next = upsertPreset([calm, party], "evening CALM", party.settings);
    expect(next).toEqual([
      { name: "evening CALM", settings: party.settings },
      party,
    ]);
  });

  it("copies the settings rather than keeping a reference", () => {
    const settings: DriftSettings = { ...DEFAULT_SETTINGS };
    const [saved] = upsertPreset([], "Copy", settings);
    settings.speed = 2;
    expect(saved.settings.speed).toBe(DEFAULT_SETTINGS.speed);
  });
});

describe("removePreset", () => {
  it("removes by name, ignoring case", () => {
    expect(removePreset([calm, party], "party")).toEqual([calm]);
  });

  it("leaves the list alone for an unknown name", () => {
    expect(removePreset([calm], "Nope")).toEqual([calm]);
  });
});
