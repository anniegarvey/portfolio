import { describe, expect, it } from "vitest";
import {
  getGrowthLabel,
  getGrowthProgress,
  SHOP_CATALOG,
  SPECIES_CONFIG,
  SpeciesIdSchema,
} from "./schema";

// ─── getGrowthLabel ───────────────────────────────────────────────────────────

describe("getGrowthLabel", () => {
  const cases: [number, string][] = [
    [0, "Seed"],
    [2, "Seed"],
    [3, "Seedling"],
    [9, "Seedling"],
    [10, "Sapling"],
    [24, "Sapling"],
    [25, "Young Tree"],
    [49, "Young Tree"],
    [50, "Mature Tree"],
    [99, "Mature Tree"],
    [100, "Ancient Tree"],
    [200, "Ancient Tree"],
  ];

  it.each(cases)("day %i → %s", (days, expected) => {
    expect(getGrowthLabel(days)).toBe(expected);
  });
});

// ─── getGrowthProgress ────────────────────────────────────────────────────────

describe("getGrowthProgress", () => {
  it("returns Seed stage with correct thresholds at day 0", () => {
    const p = getGrowthProgress(0);
    expect(p.label).toBe("Seed");
    expect(p.currentMin).toBe(0);
    expect(p.nextLabel).toBe("Seedling");
    expect(p.nextMin).toBe(3);
  });

  it("returns Sapling stage at day 10", () => {
    const p = getGrowthProgress(10);
    expect(p.label).toBe("Sapling");
    expect(p.currentMin).toBe(10);
    expect(p.nextLabel).toBe("Young Tree");
    expect(p.nextMin).toBe(25);
  });

  it("returns null nextLabel and nextMin at Ancient Tree (final stage)", () => {
    const p = getGrowthProgress(100);
    expect(p.label).toBe("Ancient Tree");
    expect(p.nextLabel).toBeNull();
    expect(p.nextMin).toBeNull();
  });

  it("returns correct thresholds at every stage boundary", () => {
    const expected: [number, string, string | null][] = [
      [0, "Seed", "Seedling"],
      [3, "Seedling", "Sapling"],
      [10, "Sapling", "Young Tree"],
      [25, "Young Tree", "Mature Tree"],
      [50, "Mature Tree", "Ancient Tree"],
      [100, "Ancient Tree", null],
    ];
    for (const [day, label, nextLabel] of expected) {
      const p = getGrowthProgress(day);
      expect(p.label, `day ${day}`).toBe(label);
      expect(p.nextLabel, `day ${day} nextLabel`).toBe(nextLabel);
    }
  });
});

// ─── SPECIES_CONFIG ───────────────────────────────────────────────────────────

describe("SPECIES_CONFIG", () => {
  const speciesIds = SpeciesIdSchema.options;

  it("has an entry for every SpeciesId", () => {
    expect(Object.keys(SPECIES_CONFIG)).toEqual(
      expect.arrayContaining([...speciesIds]),
    );
  });

  it.each(speciesIds)("%s — has positive regrowthDays", (id) => {
    expect(SPECIES_CONFIG[id].regrowthDays).toBeGreaterThan(0);
  });

  it.each(speciesIds)("%s — leavesPerCluster[min] ≤ [max]", (id) => {
    const [min, max] = SPECIES_CONFIG[id].leavesPerCluster;
    expect(min).toBeGreaterThan(0);
    expect(max).toBeGreaterThanOrEqual(min);
  });

  it.each(speciesIds)("%s — leafShape is a recognised value", (id) => {
    const valid = ["needle", "oval", "palmate", "lobed", "scale"];
    expect(valid).toContain(SPECIES_CONFIG[id].leafShape);
  });

  it.each(speciesIds)("%s — maxTrunkHeight is positive", (id) => {
    expect(SPECIES_CONFIG[id].maxTrunkHeight).toBeGreaterThan(0);
  });

  it.each(speciesIds)("%s — maxBranchPairs is at least 1", (id) => {
    expect(SPECIES_CONFIG[id].maxBranchPairs).toBeGreaterThanOrEqual(1);
  });
});

// ─── SHOP_CATALOG ─────────────────────────────────────────────────────────────

describe("SHOP_CATALOG", () => {
  it("contains items across all five categories", () => {
    const categories = new Set(SHOP_CATALOG.map((i) => i.category));
    expect(categories).toContain("species");
    expect(categories).toContain("tool");
    expect(categories).toContain("fertiliser");
    expect(categories).toContain("pot");
    expect(categories).toContain("stand");
  });

  it("all items have a positive cost", () => {
    for (const item of SHOP_CATALOG) {
      expect(item.cost, `cost of ${item.id}`).toBeGreaterThan(0);
    }
  });

  it("all items have a non-empty label and description", () => {
    for (const item of SHOP_CATALOG) {
      expect(item.label.length, item.id).toBeGreaterThan(0);
      expect(item.description.length, item.id).toBeGreaterThan(0);
    }
  });

  it("all SpeciesIds are represented as seeds", () => {
    const seedIds = SHOP_CATALOG.filter((i) => i.category === "species").map(
      (i) => i.id,
    );
    for (const speciesId of SpeciesIdSchema.options) {
      expect(seedIds).toContain(speciesId);
    }
  });
});
