import { describe, expect, it } from "vitest";
import {
  clearFluid,
  createFluid,
  type Fluid,
  gridSize,
  paint,
  type Splat,
  splat,
  step,
  totalDye,
} from "./fluid";

const STILL = { velocityKeep: 1, dyeKeep: 1, swirl: 0 };

function drop(fluid: Fluid, overrides: Partial<Splat> = {}) {
  splat(fluid, {
    x: 0.5,
    y: 0.5,
    dx: 0,
    dy: 0,
    color: [1, 0, 0],
    radius: 0.05,
    amount: 1,
    ...overrides,
  });
}

/** The dye-weighted average x position, in cells. */
function dyeCentreX(fluid: Fluid) {
  let weighted = 0;
  let total = 0;
  for (let j = 0; j < fluid.height; j++) {
    for (let i = 0; i < fluid.width; i++) {
      const a = fluid.dye[(i + j * fluid.width) * 4 + 3];
      weighted += i * a;
      total += a;
    }
  }
  return weighted / total;
}

function maxDivergence(fluid: Fluid) {
  const { width, height, u, v } = fluid;
  let max = 0;
  for (let j = 1; j < height - 1; j++) {
    for (let i = 1; i < width - 1; i++) {
      const k = i + j * width;
      const div = 0.5 * (u[k + 1] - u[k - 1] + v[k + width] - v[k - width]);
      max = Math.max(max, Math.abs(div));
    }
  }
  return max;
}

describe("createFluid", () => {
  it("allocates one velocity per cell and four dye channels per cell", () => {
    const fluid = createFluid(10, 6);
    expect(fluid.width).toBe(10);
    expect(fluid.height).toBe(6);
    expect(fluid.u).toHaveLength(60);
    expect(fluid.v).toHaveLength(60);
    expect(fluid.dye).toHaveLength(240);
    expect(totalDye(fluid)).toBe(0);
  });
});

describe("gridSize", () => {
  it("puts the requested cells on the longer side and scales the other", () => {
    expect(gridSize(1600, 900, 160)).toEqual({ width: 160, height: 90 });
    expect(gridSize(400, 800, 100)).toEqual({ width: 50, height: 100 });
  });

  it("never goes below eight cells a side", () => {
    expect(gridSize(1000, 10, 100)).toEqual({ width: 100, height: 8 });
    expect(gridSize(0, 0, 100)).toEqual({ width: 8, height: 8 });
  });
});

describe("splat", () => {
  it("drops the most dye at its centre, tinted its colour", () => {
    const fluid = createFluid(20, 20);
    drop(fluid, { color: [0.2, 0.4, 0.6] });
    const centre = (10 + 10 * 20) * 4;
    const edge = (2 + 10 * 20) * 4;
    expect(fluid.dye[centre + 3]).toBeGreaterThan(0.5);
    expect(fluid.dye[edge + 3]).toBeLessThan(fluid.dye[centre + 3] / 10);
    expect(fluid.dye[centre] / fluid.dye[centre + 3]).toBeCloseTo(0.2);
    expect(fluid.dye[centre + 1] / fluid.dye[centre + 3]).toBeCloseTo(0.4);
    expect(fluid.dye[centre + 2] / fluid.dye[centre + 3]).toBeCloseTo(0.6);
  });

  it("pushes the water in the splat's direction", () => {
    const fluid = createFluid(20, 20);
    drop(fluid, { dx: 5, dy: -3 });
    const centre = 10 + 10 * 20;
    expect(fluid.u[centre]).toBeGreaterThan(2.5);
    expect(fluid.v[centre]).toBeLessThan(-1.5);
  });

  it("stays inside the grid when dropped at a corner", () => {
    const fluid = createFluid(10, 10);
    drop(fluid, { x: 0, y: 1, radius: 0.2 });
    expect(fluid.dye[(0 + 9 * 10) * 4 + 3]).toBeGreaterThan(0);
    expect(fluid.dye).toHaveLength(400);
  });
});

describe("step", () => {
  it("does nothing for a zero or negative time step", () => {
    const fluid = createFluid(16, 16);
    drop(fluid, { dx: 10 });
    const before = Float32Array.from(fluid.dye);
    step(fluid, { ...STILL, dt: 0 });
    step(fluid, { ...STILL, dt: -1 });
    expect(fluid.dye).toEqual(before);
  });

  it("carries dye along with the flow", () => {
    const fluid = createFluid(40, 20);
    drop(fluid, { x: 0.3, dx: 60, radius: 0.08 });
    const start = dyeCentreX(fluid);
    for (let n = 0; n < 10; n++) step(fluid, { ...STILL, dt: 1 / 30 });
    expect(dyeCentreX(fluid)).toBeGreaterThan(start + 1);
  });

  it("fades dye by dyeKeep per second", () => {
    const fluid = createFluid(16, 16);
    drop(fluid);
    const before = totalDye(fluid);
    step(fluid, { ...STILL, dyeKeep: 0.5, dt: 1 });
    // Advection of still water keeps the total, so only the fade changes it.
    expect(totalDye(fluid)).toBeCloseTo(before * 0.5, 1);
  });

  it("slows the water by velocityKeep per second", () => {
    const fluid = createFluid(16, 16);
    drop(fluid, { dx: 10 });
    const speed = (f: Fluid) => f.u.reduce((sum, x) => sum + Math.abs(x), 0);
    const loose = createFluid(16, 16);
    drop(loose, { dx: 10 });
    step(fluid, { ...STILL, velocityKeep: 0.1, dt: 0.5 });
    step(loose, { ...STILL, velocityKeep: 1, dt: 0.5 });
    expect(speed(fluid)).toBeLessThan(speed(loose) * 0.5);
  });

  it("removes most of the divergence, so the water swirls rather than bunches", () => {
    const fluid = createFluid(24, 24);
    drop(fluid, { dx: 40, radius: 0.1 });
    const before = maxDivergence(fluid);
    step(fluid, { ...STILL, dt: 1 / 60 });
    expect(maxDivergence(fluid)).toBeLessThan(before * 0.5);
  });

  it("stops flow through the walls", () => {
    const fluid = createFluid(12, 12);
    fluid.u.fill(5);
    fluid.v.fill(5);
    step(fluid, { ...STILL, dt: 1 / 60 });
    for (let j = 0; j < 12; j++) {
      expect(fluid.u[j * 12]).toBe(0);
      expect(fluid.u[j * 12 + 11]).toBe(0);
    }
    for (let i = 0; i < 12; i++) {
      expect(fluid.v[i]).toBe(0);
      expect(fluid.v[i + 11 * 12]).toBe(0);
    }
  });

  it("keeps eddies spinning harder with swirl on", () => {
    const run = (swirl: number) => {
      const fluid = createFluid(32, 32);
      drop(fluid, { x: 0.4, y: 0.4, dx: 30, radius: 0.06 });
      drop(fluid, { x: 0.6, y: 0.6, dx: -30, radius: 0.06 });
      for (let n = 0; n < 20; n++) {
        step(fluid, { ...STILL, velocityKeep: 0.5, swirl, dt: 1 / 30 });
      }
      return fluid.u.reduce((sum, x) => sum + Math.abs(x), 0);
    };
    expect(run(30)).toBeGreaterThan(run(0));
  });
});

describe("paint", () => {
  it("leaves clear water transparent", () => {
    const fluid = createFluid(4, 4);
    const pixels = new Uint8ClampedArray(4 * 4 * 4).fill(99);
    paint(fluid, pixels);
    for (let k = 3; k < pixels.length; k += 4) expect(pixels[k]).toBe(0);
  });

  it("draws dye as its straight colour, more opaque where it pools", () => {
    const fluid = createFluid(20, 20);
    drop(fluid, { color: [0, 0.5, 1], amount: 2 });
    const pixels = new Uint8ClampedArray(20 * 20 * 4);
    paint(fluid, pixels);
    const centre = (10 + 10 * 20) * 4;
    const rim = (11 + 10 * 20) * 4;
    expect(pixels[centre]).toBe(0);
    expect(pixels[centre + 1]).toBeCloseTo(127.5, -1);
    expect(pixels[centre + 2]).toBe(255);
    expect(pixels[centre + 3]).toBeGreaterThan(240);
    expect(pixels[rim + 3]).toBeGreaterThan(0);
    expect(pixels[rim + 3]).toBeLessThan(pixels[centre + 3]);
  });
});

describe("paint, vivid", () => {
  it("lifts a dull mix of two colours back to full brightness", () => {
    const fluid = createFluid(20, 20);
    drop(fluid, { color: [1, 0, 0], amount: 1 });
    drop(fluid, { color: [0, 1, 0], amount: 1 });
    const dull = new Uint8ClampedArray(20 * 20 * 4);
    const vivid = new Uint8ClampedArray(20 * 20 * 4);
    paint(fluid, dull);
    paint(fluid, vivid, true);
    const centre = (10 + 10 * 20) * 4;
    // Red and green average to olive, but read as yellow when vivid.
    expect(dull[centre]).toBeCloseTo(127.5, -1);
    expect(vivid[centre]).toBe(255);
    expect(vivid[centre + 1]).toBe(255);
    expect(vivid[centre + 2]).toBe(0);
    expect(vivid[centre + 3]).toBe(dull[centre + 3]);
  });
});

describe("clearFluid", () => {
  it("empties the dye and stills the water", () => {
    const fluid = createFluid(12, 12);
    drop(fluid, { dx: 5, dy: 5 });
    step(fluid, { ...STILL, dt: 1 / 60 });
    clearFluid(fluid);
    expect(totalDye(fluid)).toBe(0);
    expect(fluid.u.every((x) => x === 0)).toBe(true);
    expect(fluid.v.every((x) => x === 0)).toBe(true);
    expect(fluid.pressure.every((x) => x === 0)).toBe(true);
  });
});
