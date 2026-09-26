import { describe, expect, it } from "vitest";
import { ART_SIZE, createRandom, generateAboutArt } from "./generateAboutArt";

const pathPoints = (d: string) =>
  d
    .slice(1)
    .split("L")
    .map((p) => p.split(" ").map(Number));

describe("createRandom", () => {
  it("returns the same sequence for the same seed", () => {
    const a = createRandom(42);
    const b = createRandom(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("returns different sequences for different seeds", () => {
    expect(createRandom(1)()).not.toBe(createRandom(2)());
  });

  it("returns values in [0, 1)", () => {
    const random = createRandom(7);
    for (let i = 0; i < 1000; i++) {
      const n = random();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});

describe("generateAboutArt", () => {
  const art = generateAboutArt(1916);

  it("is deterministic for a seed, so server and client markup match", () => {
    expect(generateAboutArt(1916)).toEqual(art);
    expect(generateAboutArt(3)).not.toEqual(art);
  });

  it("weaves 11 strands for each of the three arms", () => {
    expect(art.strands).toHaveLength(33);
  });

  it("makes every strand unique", () => {
    expect(new Set(art.strands.map((s) => s.d)).size).toBe(33);
  });

  it("gives each arm its own colour, with some accent strands", () => {
    const hues = art.strands.map((s) => s.hue);
    expect(hues.slice(0, 11)).toContain("primary");
    expect(hues.slice(11, 22)).toContain("secondary");
    expect(hues.slice(22)).toContain("teal");
    expect(hues.some((h) => h === "rose" || h === "orange")).toBe(true);
  });

  it("ends every strand near the centre, joining the three arms", () => {
    for (const strand of art.strands) {
      const [x, y] = pathPoints(strand.d).at(-1) ?? [];
      expect(Math.hypot(x - ART_SIZE / 2, y - ART_SIZE / 2 - 21)).toBeLessThan(
        12,
      );
    }
  });

  it("keeps every strand inside the canvas", () => {
    for (const strand of art.strands) {
      for (const [x, y] of pathPoints(strand.d)) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(ART_SIZE);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(ART_SIZE);
      }
    }
  });

  it("starts strands mid-flow with negative animation delays", () => {
    for (const strand of art.strands) {
      expect(strand.delay).toBeLessThanOrEqual(0);
      expect(strand.duration).toBeGreaterThan(0);
    }
  });

  it("scatters 40 stars inside the canvas", () => {
    expect(art.stars).toHaveLength(40);
    for (const star of art.stars) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThanOrEqual(ART_SIZE);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThanOrEqual(ART_SIZE);
    }
  });
});
