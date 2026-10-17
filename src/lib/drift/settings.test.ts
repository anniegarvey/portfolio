import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  brushRadius,
  CALM_SPEED,
  DEFAULT_SETTINGS,
  getPalette,
  hexToRgb,
  loadSettings,
  MAX_SWIRL,
  PALETTES,
  type PaletteId,
  saveSettings,
  toStepOptions,
} from "./settings";

const KEY = "drift-settings";

beforeEach(() => {
  localStorage.clear();
});

describe("loadSettings", () => {
  it("returns the defaults when nothing is stored", () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("returns what was saved", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      palette: "ember" as const,
      speed: 0.8,
      currents: 0.75,
    };
    saveSettings(settings);
    expect(loadSettings()).toEqual(settings);
  });

  it("falls back to the defaults for unreadable storage", () => {
    localStorage.setItem(KEY, "{not json");
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    localStorage.setItem(KEY, JSON.stringify("a string"));
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("replaces only the fields that are out of range or missing", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ palette: "plaid", speed: 99, trail: 0.9 }),
    );
    expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, trail: 0.9 });
  });

  it("keeps settings from before currents had a strength", () => {
    const old = { palette: "dusk", speed: 0.5, trail: 0.9 };
    localStorage.setItem(KEY, JSON.stringify({ ...old, drift: false }));
    expect(loadSettings()).toMatchObject({ ...old, currents: 0 });
    localStorage.setItem(KEY, JSON.stringify({ ...old, drift: true }));
    expect(loadSettings()).toMatchObject({
      ...old,
      currents: DEFAULT_SETTINGS.currents,
    });
    expect(loadSettings()).not.toHaveProperty("drift");
  });

  it("prefers a stored strength over an old on/off flag", () => {
    localStorage.setItem(KEY, JSON.stringify({ currents: 0.8, drift: false }));
    expect(loadSettings().currents).toBe(0.8);
  });

  it("resets a speed from the old, faster range", () => {
    localStorage.setItem(KEY, JSON.stringify({ speed: 1.6 }));
    expect(loadSettings().speed).toBe(DEFAULT_SETTINGS.speed);
  });

  it("starts unhurried: slowish, fairly thick, with faint currents", () => {
    expect(DEFAULT_SETTINGS.speed).toBeLessThanOrEqual(0.5);
    expect(DEFAULT_SETTINGS.viscosity).toBeGreaterThanOrEqual(0.5);
    expect(DEFAULT_SETTINGS.currents).toBeLessThanOrEqual(0.3);
  });

  it("falls back to the defaults when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe("saveSettings", () => {
  it("shrugs off storage that throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    expect(() => saveSettings({ ...DEFAULT_SETTINGS })).not.toThrow();
  });
});

describe("getPalette", () => {
  it("finds a palette by id", () => {
    expect(getPalette("dusk").name).toBe("Dusk");
  });

  it("has a quick, vivid rainbow running red to violet", () => {
    const rainbow = getPalette("rainbow");
    expect(rainbow.colors).toHaveLength(7);
    expect(rainbow.vivid).toBe(true);
    expect(rainbow.cycleSeconds).toBeLessThan(1);
  });

  it("falls back to the first palette for an unknown id", () => {
    expect(getPalette("nope" as PaletteId)).toBe(PALETTES[0]);
  });

  it("gives every palette at least two colours and both waters", () => {
    for (const palette of PALETTES) {
      expect(palette.colors.length).toBeGreaterThanOrEqual(2);
      expect(palette.water.light).toMatch(/^#[0-9a-f]{6}$/);
      expect(palette.water.dark).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe("hexToRgb", () => {
  it("converts hex colours to 0–1 channels", () => {
    expect(hexToRgb("#ff8000")).toEqual([1, 128 / 255, 0]);
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
  });
});

describe("toStepOptions", () => {
  it("scales time by the speed setting", () => {
    const options = toStepOptions(
      { ...DEFAULT_SETTINGS, speed: 2 },
      0.1,
      false,
    );
    expect(options.dt).toBeCloseTo(0.2);
  });

  it("slows right down in calm mode", () => {
    const options = toStepOptions({ ...DEFAULT_SETTINGS, speed: 1 }, 0.1, true);
    expect(options.dt).toBeCloseTo(0.1 * CALM_SPEED);
  });

  it("keeps less momentum the thicker the water", () => {
    const thin = toStepOptions({ ...DEFAULT_SETTINGS, viscosity: 0 }, 1, false);
    const thick = toStepOptions(
      { ...DEFAULT_SETTINGS, viscosity: 1 },
      1,
      false,
    );
    expect(thin.velocityKeep).toBeCloseTo(0.7);
    expect(thick.velocityKeep).toBeCloseTo(0.02);
  });

  it("keeps more dye the longer the trail", () => {
    const short = toStepOptions({ ...DEFAULT_SETTINGS, trail: 0 }, 1, false);
    const long = toStepOptions({ ...DEFAULT_SETTINGS, trail: 1 }, 1, false);
    expect(short.dyeKeep).toBeCloseTo(0.4);
    expect(long.dyeKeep).toBeCloseTo(0.98);
  });

  it("turns swirl into vorticity strength", () => {
    expect(
      toStepOptions({ ...DEFAULT_SETTINGS, swirl: 0 }, 1, false).swirl,
    ).toBe(0);
    expect(
      toStepOptions({ ...DEFAULT_SETTINGS, swirl: 1 }, 1, false).swirl,
    ).toBe(MAX_SWIRL);
  });
});

describe("brushRadius", () => {
  it("grows with the brush size setting", () => {
    expect(brushRadius({ ...DEFAULT_SETTINGS, brushSize: 0 })).toBeCloseTo(
      0.015,
    );
    expect(brushRadius({ ...DEFAULT_SETTINGS, brushSize: 1 })).toBeCloseTo(
      0.07,
    );
  });
});
