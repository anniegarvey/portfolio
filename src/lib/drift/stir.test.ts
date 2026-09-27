import { describe, expect, it } from "vitest";
import { createFluid, type Rgb, totalDye } from "./fluid";
import { bloom, colorAt, drift, stirWithPointer } from "./stir";

const RED: Rgb = [1, 0, 0];
const BLUE: Rgb = [0, 0, 1];

describe("colorAt", () => {
  it("starts on the first colour", () => {
    expect(colorAt([RED, BLUE], 0)).toEqual(RED);
  });

  it("is halfway between two colours halfway through a period", () => {
    const [r, g, b] = colorAt([RED, BLUE], 1.25);
    expect(r).toBeCloseTo(0.5);
    expect(g).toBe(0);
    expect(b).toBeCloseTo(0.5);
  });

  it("reaches the next colour after a period, and wraps back round", () => {
    const next = colorAt([RED, BLUE], 2.5);
    expect(next[2]).toBeCloseTo(1);
    const wrapped = colorAt([RED, BLUE], 5);
    expect(wrapped[0]).toBeCloseTo(1);
  });
});

describe("stirWithPointer", () => {
  it("drops dye along the stroke and pushes the water its way", () => {
    const fluid = createFluid(40, 20);
    stirWithPointer(
      fluid,
      { previousX: 0.2, previousY: 0.5, x: 0.8, y: 0.5, dt: 1 / 60 },
      RED,
      0.03,
    );
    const at = (x: number) => fluid.dye[(x + 10 * 40) * 4 + 3];
    // Both ends and the middle of a fast stroke get dye.
    expect(at(10)).toBeGreaterThan(0.01);
    expect(at(20)).toBeGreaterThan(0.01);
    expect(at(32)).toBeGreaterThan(0.01);
    expect(fluid.u[20 + 10 * 40]).toBeGreaterThan(0);
    expect(Math.abs(fluid.v[20 + 10 * 40])).toBeLessThan(1e-6);
  });

  it("caps the push from a flick", () => {
    const fluid = createFluid(20, 20);
    stirWithPointer(
      fluid,
      { previousX: 0.5, previousY: 0.1, x: 0.5, y: 0.9, dt: 0 },
      RED,
      0.05,
    );
    const fastest = fluid.v.reduce((max, x) => Math.max(max, Math.abs(x)), 0);
    expect(fastest).toBeLessThanOrEqual(400);
    expect(fastest).toBeGreaterThan(0);
  });
});

describe("bloom", () => {
  it("drops a blob of dye away from the edges", () => {
    const fluid = createFluid(20, 20);
    bloom(fluid, BLUE, 0.05, () => 0.5);
    const centre = (10 + 10 * 20) * 4;
    expect(fluid.dye[centre + 3]).toBeGreaterThan(0.5);
    expect(fluid.dye[centre + 2]).toBeGreaterThan(0.5);
    expect(fluid.dye[centre]).toBe(0);
  });
});

describe("drift", () => {
  it("adds a little dye and movement over time", () => {
    const fluid = createFluid(20, 20);
    drift(fluid, 3, 1 / 60, [RED, BLUE], 0.05);
    expect(totalDye(fluid)).toBeGreaterThan(0);
    expect(fluid.u.some((x) => x !== 0)).toBe(true);
  });

  it("adds nothing in a zero-length frame", () => {
    const fluid = createFluid(20, 20);
    drift(fluid, 3, 0, [RED, BLUE], 0.05);
    expect(totalDye(fluid)).toBe(0);
  });
});
