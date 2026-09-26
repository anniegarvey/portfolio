import { describe, expect, it } from "vitest";
import { HABITAT_Y_RANGE } from "@/lib/glade/catalog";
import {
  createWalker,
  isWalking,
  stepWalker,
  WANDER_TRAITS,
  type Walker,
} from "./wander";

const SIZE = { width: 2000, height: 320 };

/** Cycles through the given values, so each test controls every draw. */
function sequence(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

function resting(overrides: Partial<Walker> = {}): Walker {
  return {
    x: 50,
    y: 75,
    targetX: 50,
    targetY: 75,
    restLeft: 0.5,
    facing: 1,
    ...overrides,
  };
}

describe("createWalker", () => {
  it("starts at home, part-way through a rest", () => {
    const walker = createWalker("rabbit", { x: 20, y: 70 }, () => 0.5);
    expect(walker).toEqual({
      x: 20,
      y: 70,
      targetX: 20,
      targetY: 70,
      restLeft: WANDER_TRAITS.rabbit.rest[1] * 0.5,
      facing: 1,
    });
    expect(isWalking(walker)).toBe(false);
  });
});

describe("stepWalker", () => {
  it("counts down a rest without moving", () => {
    const next = stepWalker(resting(), "rabbit", 0.2, SIZE, () => 0);
    expect(next.restLeft).toBeCloseTo(0.3);
    expect(next.x).toBe(50);
    expect(next.y).toBe(75);
  });

  it("sets off towards a new spot when the rest runs out, facing that way", () => {
    // Angle 0 (straight right), full stride.
    const next = stepWalker(resting(), "rabbit", 1, SIZE, sequence(0, 1));
    expect(isWalking(next)).toBe(true);
    expect(next.targetX).toBeCloseTo(
      50 + (WANDER_TRAITS.rabbit.stride * 100) / SIZE.width,
    );
    expect(next.targetY).toBeCloseTo(75);
    expect(next.facing).toBe(1);
  });

  it("faces left when heading left", () => {
    // Angle π (straight left).
    const next = stepWalker(resting(), "rabbit", 1, SIZE, sequence(0.5, 1));
    expect(next.targetX).toBeLessThan(50);
    expect(next.facing).toBe(-1);
  });

  it("turns back rather than running off the end of the glade", () => {
    const next = stepWalker(
      resting({ x: 95, targetX: 95 }),
      "hare",
      1,
      SIZE,
      sequence(0, 1),
    );
    expect(next.targetX).toBeLessThan(95);
    expect(next.facing).toBe(-1);
  });

  it("keeps each resident inside its habitat's band", () => {
    const band = HABITAT_Y_RANGE.air;
    // Angle π/2 (straight down) from the bottom of the band.
    const next = stepWalker(
      resting({ y: band.max, targetY: band.max }),
      "glimmerwing",
      1,
      SIZE,
      sequence(0.25, 1),
    );
    expect(next.targetY).toBeGreaterThanOrEqual(band.min);
    expect(next.targetY).toBeLessThan(band.max);
  });

  it("walks towards its target at its species' speed", () => {
    const walker = resting({ restLeft: 0, targetX: 60 });
    const next = stepWalker(walker, "fox", 1, SIZE, () => 0);
    const travelled = ((next.x - walker.x) / 100) * SIZE.width;
    expect(travelled).toBeCloseTo(WANDER_TRAITS.fox.speed);
    expect(next.y).toBe(75);
    expect(isWalking(next)).toBe(true);
  });

  it("arrives on the spot and rests for a while within its range", () => {
    const walker = resting({ restLeft: 0, targetX: 50.5, targetY: 76 });
    const next = stepWalker(walker, "fox", 1, SIZE, () => 0.5);
    const [min, max] = WANDER_TRAITS.fox.rest;
    expect(next.x).toBe(50.5);
    expect(next.y).toBe(76);
    expect(next.restLeft).toBeCloseTo((min + max) / 2);
    expect(isWalking(next)).toBe(false);
  });
});
