import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PRESTIGE_STORAGE_KEY } from "./keys";
import {
  formatMultiplier,
  loadPointsMultiplier,
  loadPrestigeState,
  multiplierOf,
  multiplyAward,
  recordRestart,
  usePointsMultiplier,
  useRestartCount,
} from "./prestige";

afterEach(() => {
  localStorage.removeItem(PRESTIGE_STORAGE_KEY);
});

describe("multiplier", () => {
  it("is one before any restart", () => {
    expect(loadPointsMultiplier()).toBe(1);
  });

  it("adds both games' restart bonuses together", () => {
    expect(
      multiplierOf({
        meadowmere: { restarts: 1, bonusPercent: 60 },
        glade: { restarts: 2, bonusPercent: 120 },
      }),
    ).toBeCloseTo(2.8);
  });

  it("rounds a multiplied award to whole points", () => {
    expect(multiplyAward(7, 1.8)).toBe(13);
    expect(multiplyAward(10, 1)).toBe(10);
  });

  it("shows without trailing zeros", () => {
    expect(formatMultiplier(1.8)).toBe("×1.8");
    expect(formatMultiplier(2)).toBe("×2");
    expect(formatMultiplier(1.25)).toBe("×1.25");
  });
});

describe("recordRestart", () => {
  it("banks the bonus and counts the restart", () => {
    recordRestart("glade", 80);
    recordRestart("glade", 55);
    recordRestart("meadowmere", 100);
    expect(loadPrestigeState()).toEqual({
      meadowmere: { restarts: 1, bonusPercent: 100 },
      glade: { restarts: 2, bonusPercent: 135 },
    });
    expect(loadPointsMultiplier()).toBeCloseTo(3.35);
  });
});

describe("loadPrestigeState", () => {
  it("falls back to no restarts for a corrupt record", () => {
    localStorage.setItem(PRESTIGE_STORAGE_KEY, "{not json");
    expect(loadPointsMultiplier()).toBe(1);
    localStorage.setItem(PRESTIGE_STORAGE_KEY, JSON.stringify({ glade: 3 }));
    expect(loadPointsMultiplier()).toBe(1);
  });
});

describe("hooks", () => {
  it("follow a restart made on the same page", () => {
    const multiplier = renderHook(() => usePointsMultiplier());
    const count = renderHook(() => useRestartCount("meadowmere"));
    expect(multiplier.result.current).toBe(1);

    act(() => recordRestart("meadowmere", 50));
    expect(multiplier.result.current).toBe(1.5);
    expect(count.result.current).toBe(1);
  });
});
