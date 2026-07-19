import { describe, expect, it } from "vitest";
import {
  clamp,
  lerp,
  r,
  seededInt,
  seededVal,
  taperedPath,
} from "./treeGenerator.math";

// ─── seededVal ────────────────────────────────────────────────────────────────

describe("seededVal", () => {
  it("returns a value in [0, 1)", () => {
    const v = seededVal("test", 0);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });

  it("is deterministic for the same inputs", () => {
    expect(seededVal("abc", 1)).toBe(seededVal("abc", 1));
  });

  it("differs for different keys", () => {
    expect(seededVal("alpha", 0)).not.toBe(seededVal("beta", 0));
  });
});

// ─── seededInt ────────────────────────────────────────────────────────────────

describe("seededInt", () => {
  it("returns an integer within [min, max]", () => {
    const v = seededInt("key", 0, 3, 7);
    expect(Number.isInteger(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(3);
    expect(v).toBeLessThanOrEqual(7);
  });
});

// ─── lerp ─────────────────────────────────────────────────────────────────────

describe("lerp", () => {
  it("returns a at t=0", () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it("returns b at t=1", () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it("clamps below 0", () => {
    expect(lerp(10, 20, -1)).toBe(10);
  });

  it("clamps above 1", () => {
    expect(lerp(10, 20, 2)).toBe(20);
  });
});

// ─── clamp ────────────────────────────────────────────────────────────────────

describe("clamp", () => {
  it("returns v when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps below lo", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps above hi", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

// ─── r ────────────────────────────────────────────────────────────────────────

describe("r", () => {
  it("rounds to 1 decimal place", () => {
    expect(r(1.23456)).toBe(1.2);
    expect(r(1.25)).toBe(1.3);
  });
});

// ─── taperedPath ─────────────────────────────────────────────────────────────

describe("taperedPath", () => {
  it("returns an empty string when start and end are coincident", () => {
    expect(taperedPath(10, 10, 10, 10, 2, 1)).toBe("");
  });

  it("returns a non-empty SVG path for a normal segment", () => {
    const path = taperedPath(0, 0, 0, 50, 4, 1);
    expect(path.length).toBeGreaterThan(0);
    expect(path).toMatch(/^M /);
  });

  it("produces a different path with curveBias applied", () => {
    const straight = taperedPath(0, 0, 0, 50, 4, 1, 0);
    const curved = taperedPath(0, 0, 0, 50, 4, 1, 3);
    expect(straight).not.toBe(curved);
  });
});
