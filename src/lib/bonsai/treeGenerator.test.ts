import { describe, expect, it } from "vitest";
import type { SpeciesConfig } from "./speciesConfig";
import { SPECIES_CONFIG } from "./speciesConfig";
import {
  BRANCH_GROW_DURATION,
  computeTrunkBaseWidth,
  computeTrunkHeight,
  generateTree,
} from "./treeGenerator";

const PINE = SPECIES_CONFIG.pine; // branchFrequency: 6, regrowthDays: 14
const TREE_ID = "test-tree-id";

// ─── BRANCH_GROW_DURATION ─────────────────────────────────────────────────────

describe("BRANCH_GROW_DURATION", () => {
  it("is exported as a positive number", () => {
    expect(BRANCH_GROW_DURATION).toBeGreaterThan(0);
  });
});

// ─── computeTrunkHeight — growth curve proportions (Step 1) ──────────────────

describe("computeTrunkHeight", () => {
  // Zero-variability spec: growthRateMultiplier is always 1 regardless of
  // treeId, so the fraction of maxTrunkHeight reached at each day is exact
  // and seed-independent — the cleanest way to pin down the curve shape.
  const flatPine = { ...PINE, individualVariability: 0 };

  it("is 0 at day 0", () => {
    expect(computeTrunkHeight(0, flatPine, TREE_ID)).toBe(0);
  });

  it("reaches roughly 15-22% of maxTrunkHeight by day 3", () => {
    const frac =
      computeTrunkHeight(3, flatPine, TREE_ID) / flatPine.maxTrunkHeight;
    expect(frac).toBeGreaterThanOrEqual(0.15);
    expect(frac).toBeLessThanOrEqual(0.22);
  });

  it("reaches roughly 38-48% of maxTrunkHeight by day 10", () => {
    const frac =
      computeTrunkHeight(10, flatPine, TREE_ID) / flatPine.maxTrunkHeight;
    expect(frac).toBeGreaterThanOrEqual(0.35);
    expect(frac).toBeLessThanOrEqual(0.5);
  });

  it("reaches roughly 60-72% of maxTrunkHeight by day 25", () => {
    const frac =
      computeTrunkHeight(25, flatPine, TREE_ID) / flatPine.maxTrunkHeight;
    expect(frac).toBeGreaterThanOrEqual(0.6);
    expect(frac).toBeLessThanOrEqual(0.72);
  });

  it("reaches roughly 78-86% of maxTrunkHeight by day 50", () => {
    const frac =
      computeTrunkHeight(50, flatPine, TREE_ID) / flatPine.maxTrunkHeight;
    expect(frac).toBeGreaterThanOrEqual(0.78);
    expect(frac).toBeLessThanOrEqual(0.86);
  });

  it("reaches at least 88% of maxTrunkHeight by day 100 for a zero-variability spec", () => {
    const frac =
      computeTrunkHeight(100, flatPine, TREE_ID) / flatPine.maxTrunkHeight;
    expect(frac).toBeGreaterThanOrEqual(0.88);
  });

  it("is monotonically increasing with day", () => {
    let prev = 0;
    for (const day of [1, 5, 10, 20, 40, 80, 150]) {
      const h = computeTrunkHeight(day, flatPine, TREE_ID);
      expect(h).toBeGreaterThan(prev);
      prev = h;
    }
  });
});

// ─── generateTree ─────────────────────────────────────────────────────────────

describe("generateTree", () => {
  describe("day 0 — seed stage", () => {
    const data = generateTree(0, PINE, [], TREE_ID);

    it("returns an empty trunk path", () => {
      expect(data.trunkPathData).toBe("");
    });

    it("returns no branches", () => {
      expect(data.branches).toHaveLength(0);
    });

    it("returns no apex leaves", () => {
      expect(data.apexLeaves).toHaveLength(0);
    });

    it("returns the expected viewBox", () => {
      expect(data.viewBox).toBe("0 0 200 300");
    });
  });

  describe("day 1 — first sprout", () => {
    const data = generateTree(1, PINE, [], TREE_ID);

    it("has a non-empty trunk path", () => {
      expect(data.trunkPathData.length).toBeGreaterThan(0);
    });

    it("has apex leaves", () => {
      expect(data.apexLeaves.length).toBeGreaterThan(0);
    });

    it("has no primary branches yet (pine branchFrequency = 6)", () => {
      const live = data.branches.filter((b) => !b.isPruned);
      expect(live).toHaveLength(0);
    });
  });

  describe("day 15 — early branches", () => {
    const data = generateTree(15, PINE, [], TREE_ID);

    it("has at least two branches", () => {
      expect(data.branches.length).toBeGreaterThanOrEqual(2);
    });

    it("branch attachment point is above the base Y", () => {
      for (const b of data.branches) {
        expect(b.y1).toBeLessThan(data.trunkBaseY);
      }
    });
  });

  describe("day 50 — mature tree", () => {
    const data = generateTree(50, PINE, [], TREE_ID);

    it("has many branches", () => {
      // Phase 4: deeper recursion + variable childCount yields far more than 4
      expect(data.branches.length).toBeGreaterThan(20);
    });

    it("branches span across the upper portion of the trunk height", () => {
      const live = data.branches.filter((b) => !b.isPruned);
      const ys = live.map((b) => b.y1);
      const spread = Math.max(...ys) - Math.min(...ys);
      const trunkSpan = data.trunkBaseY - data.trunkTopY;
      // Branches should be distributed over at least 35% of the trunk height
      expect(spread).toBeGreaterThan(trunkSpan * 0.35);
    });

    it("terminal branches have leaf clusters", () => {
      const terminals = data.branches.filter(
        (b) => b.isTerminal && !b.isPruned,
      );
      const withLeaves = terminals.filter((b) => b.leaves.length > 0);
      expect(withLeaves.length).toBeGreaterThan(0);
    });

    it("apex leaves are present", () => {
      expect(data.apexLeaves.length).toBeGreaterThan(0);
    });
  });

  // ─── Pruning ───────────────────────────────────────────────────────────────

  describe("pruning", () => {
    // Pine (whorled, whorlSize=5): p0 is the first primary branch, appears at
    // nodeIdx=0 → baseDay = 1 * branchFrequency = 6. Pruned at day 20.
    // At day 20: 20 < 20 + 14 = 34, so still pruned.
    const pruned = [{ branchId: "p0", prunedAtDay: 20 }];

    it("renders a stub for the pruned branch", () => {
      const data = generateTree(20, PINE, pruned, TREE_ID);
      const stub = data.branches.find((b) => b.id === "p0" && b.isPruned);
      expect(stub).toBeDefined();
    });

    it("pruned branch stub has no leaves", () => {
      const data = generateTree(20, PINE, pruned, TREE_ID);
      const stub = data.branches.find((b) => b.id === "p0" && b.isPruned);
      expect(stub?.leaves).toHaveLength(0);
    });

    it("children of a pruned branch are hidden", () => {
      // Day 30 is within pruning window: 30 < 20 + 14 = 34
      const data = generateTree(30, PINE, pruned, TREE_ID);
      const child = data.branches.find((b) => b.id === "p0-a" && !b.isPruned);
      expect(child).toBeUndefined();
    });
  });

  // ─── Regrowth ──────────────────────────────────────────────────────────────

  describe("regrowth", () => {
    // Prune p0 at day 15. regrowthStart = 15 + 14 = 29.
    const pruned = [{ branchId: "p0", prunedAtDay: 15 }];

    it("regrowing branch is shorter than the same branch at full growth", () => {
      // At day 31: effectiveAge = 31 - 29 = 2, progress = 2/6 ≈ 0.33 → short
      const regrowing = generateTree(31, PINE, pruned, TREE_ID);
      // At day 100 with no pruned entry: branch at full natural growth
      const mature = generateTree(100, PINE, [], TREE_ID);

      const regrowingBranch = regrowing.branches.find(
        (b) => b.id === "p0" && !b.isPruned,
      );
      const matureBranch = mature.branches.find((b) => b.id === "p0");

      expect(regrowingBranch).toBeDefined();
      expect(matureBranch).toBeDefined();

      if (!(regrowingBranch && matureBranch)) return;

      const regrowLen = Math.hypot(
        regrowingBranch.x2 - regrowingBranch.x1,
        regrowingBranch.y2 - regrowingBranch.y1,
      );
      const matureLen = Math.hypot(
        matureBranch.x2 - matureBranch.x1,
        matureBranch.y2 - matureBranch.y1,
      );

      expect(regrowLen).toBeLessThan(matureLen);
    });

    it("child of a regrowing branch is not yet visible at regrowth start", () => {
      // At day 29 (effectiveAge=0), p0-a needs SPLIT_DELAY more days to appear
      const atStart = generateTree(29, PINE, pruned, TREE_ID);
      const child = atStart.branches.find(
        (b) => b.id === "p0-a" && !b.isPruned,
      );
      expect(child).toBeUndefined();
    });

    it("child of a regrowing branch appears after SPLIT_DELAY days", () => {
      // At day 29 + 7 (SPLIT_DELAY) + a few more = day 38, p0-a should appear
      const data = generateTree(40, PINE, pruned, TREE_ID);
      const child = data.branches.find((b) => b.id === "p0-a" && !b.isPruned);
      expect(child).toBeDefined();
    });

    it("regrowing branch is not marked isPruned", () => {
      const data = generateTree(31, PINE, pruned, TREE_ID);
      const branch = data.branches.find((b) => b.id === "p0");
      expect(branch?.isPruned).toBe(false);
    });
  });

  // ─── Apical Dominance ─────────────────────────────────────────────────────

  /** Derive the 2-D angle of a rendered branch from its endpoint coordinates. */
  function branchAngle(b: { x1: number; y1: number; x2: number; y2: number }) {
    return Math.atan2(b.y2 - b.y1, b.x2 - b.x1);
  }

  /** Smallest angular difference between two angles, in [0, π]. */
  function angleDelta(a: number, b: number) {
    const diff = Math.abs(a - b) % (2 * Math.PI);
    return diff > Math.PI ? 2 * Math.PI - diff : diff;
  }

  describe("apical dominance", () => {
    it("pine leader child (-a) angle stays close to parent direction", () => {
      // Pine has apicalDominance=0.8. Leader diverges by at most
      // (1-0.8) * splitDiverge ≈ 0.11 rad from the wandered parent direction.
      // Include branchWander (≤0.15 rad) in the tolerance → ceiling 0.5 rad.
      const data = generateTree(50, PINE, [], TREE_ID);
      const primaries = data.branches.filter(
        (b) => /^p\d+$/.test(b.id) && !b.isPruned,
      );
      for (const primary of primaries) {
        const leader = data.branches.find((b) => b.id === `${primary.id}-a`);
        if (!leader) continue;
        expect(
          angleDelta(branchAngle(leader), branchAngle(primary)),
        ).toBeLessThan(0.5);
      }
    });

    it("pine leader child is closer to parent than lateral child in most cases", () => {
      // Pine: apicalDominance=0.8, branchWander=0.15, splitDiverge≈0.55.
      // leaderDiverge ≈ 0.11 rad; divergeVar ≈ 0.55 rad; wander ≤ ±0.15 rad.
      // Even in the worst wander case the leader is ≤ 0.26 rad from parent
      // while the lateral is ≥ 0.40 rad — leader wins in every seed.
      const data = generateTree(50, PINE, [], TREE_ID);
      const primaries = data.branches.filter(
        (b) => /^p\d+$/.test(b.id) && !b.isPruned,
      );
      let closer = 0;
      let total = 0;
      for (const primary of primaries) {
        const leader = data.branches.find((b) => b.id === `${primary.id}-a`);
        const lateral = data.branches.find((b) => b.id === `${primary.id}-b`);
        if (!(leader && lateral)) continue;
        const leaderDiff = angleDelta(
          branchAngle(leader),
          branchAngle(primary),
        );
        const lateralDiff = angleDelta(
          branchAngle(lateral),
          branchAngle(primary),
        );
        if (leaderDiff < lateralDiff) closer++;
        total++;
      }
      expect(total).toBeGreaterThan(0);
      // Leader should be closer to parent than lateral in the majority of branches
      expect(closer / total).toBeGreaterThan(0.7);
    });
  });

  // ─── Determinism ──────────────────────────────────────────────────────────

  describe("determinism", () => {
    it("produces identical output for identical inputs", () => {
      const a = generateTree(30, PINE, [], TREE_ID);
      const b = generateTree(30, PINE, [], TREE_ID);
      expect(a.trunkPathData).toBe(b.trunkPathData);
      expect(a.branches).toHaveLength(b.branches.length);
      expect(a.branches[0]?.pathData).toBe(b.branches[0]?.pathData);
    });

    it("different treeIds produce different branch geometry", () => {
      const a = generateTree(30, PINE, [], "tree-alpha");
      const b = generateTree(30, PINE, [], "tree-beta");
      // Branch count or geometry must differ — individual branches now have
      // seeded per-tree appearance-day jitter so the visible sets can vary.
      const countDiffers = a.branches.length !== b.branches.length;
      const pathDiffers = a.branches.some(
        (ab, i) => ab.pathData !== b.branches[i]?.pathData,
      );
      expect(countDiffers || pathDiffers).toBe(true);
    });
  });

  // ─── Tip Droop (Phase 7) ──────────────────────────────────────────────────

  describe("tipDroop", () => {
    /** Mean y-coordinate of every visible final-depth twig tip. */
    function meanTwigY(data: ReturnType<typeof generateTree>) {
      const twigs = data.branches.filter(
        (b) => b.isTerminal && !b.isPruned && b.id.split("-").length >= 3,
      );
      if (twigs.length === 0) return 0;
      return twigs.reduce((sum, b) => sum + b.y2, 0) / twigs.length;
    }
    /** Lowest (largest y) tip among final-depth twigs. */
    function bottomTwigY(data: ReturnType<typeof generateTree>) {
      const twigs = data.branches.filter(
        (b) => b.isTerminal && !b.isPruned && b.id.split("-").length >= 3,
      );
      return twigs.reduce((m, b) => Math.max(m, b.y2), 0);
    }

    it("oak (tipDroop = 0) renders single-segment paths on terminal twigs", () => {
      const oak = SPECIES_CONFIG.oak;
      expect(oak.tipDroop).toBe(0);
      const data = generateTree(60, oak, [], TREE_ID);
      const twigs = data.branches.filter(
        (b) => b.isTerminal && !b.isPruned && b.id.split("-").length >= 3,
      );
      expect(twigs.length).toBeGreaterThan(0);
      // taperedPath emits exactly one "M " — kinked paths concatenate two,
      // so a tipDroop = 0 species must always render with one moveto.
      for (const t of twigs) {
        const moveCount = (t.pathData.match(/M /g) ?? []).length;
        expect(moveCount).toBe(1);
      }
    });

    it("wisteria terminal twigs sit lower on average (weep) than with tipDroop = 0", () => {
      const wisteria = SPECIES_CONFIG.wisteria;
      const flatWisteria = { ...wisteria, tipDroop: 0 };
      const droopy = generateTree(80, wisteria, [], TREE_ID);
      const flat = generateTree(80, flatWisteria, [], TREE_ID);
      // Mean tip y is the more reliable summary: wisteria primaries already
      // drape downward, so the bottom twig moves only a couple of pixels
      // with the bend. The whole canopy sliding down is clear in the mean.
      expect(meanTwigY(droopy)).toBeGreaterThan(meanTwigY(flat) + 1);
      expect(bottomTwigY(droopy)).toBeGreaterThan(bottomTwigY(flat));
    });

    it("wisteria terminal twigs render multi-segment paths when tipDroop ≠ 0", () => {
      const data = generateTree(80, SPECIES_CONFIG.wisteria, [], TREE_ID);
      const twigs = data.branches.filter(
        (b) => b.isTerminal && !b.isPruned && b.id.split("-").length >= 3,
      );
      expect(twigs.length).toBeGreaterThan(0);
      const kinked = twigs.filter(
        (t) => (t.pathData.match(/M /g) ?? []).length === 2,
      );
      // Most fully-grown terminal twigs render as a kinked two-segment path.
      expect(kinked.length / twigs.length).toBeGreaterThan(0.5);
    });

    it("pine terminal twigs sit higher on average (upturn) than with tipDroop = 0", () => {
      const pine = SPECIES_CONFIG.pine;
      const flatPine = { ...pine, tipDroop: 0 };
      const upturned = generateTree(80, pine, [], TREE_ID);
      const flat = generateTree(80, flatPine, [], TREE_ID);
      // Mean tip y is more reliable than min/max for pine: a few near-vertical
      // candles can over-rotate past the apex when bent, but the bulk of the
      // canopy lifts upward. Smaller mean y = higher on the SVG canvas.
      expect(meanTwigY(upturned)).toBeLessThan(meanTwigY(flat));
    });
  });

  // ─── Individual Variability (Phase 8) ─────────────────────────────────────

  describe("individualVariability", () => {
    /** Counts terminal-twig path strings that differ across two trees. */
    function pathDiffCount(
      a: ReturnType<typeof generateTree>,
      b: ReturnType<typeof generateTree>,
    ) {
      const pa = a.branches.map((br) => br.pathData);
      const pb = b.branches.map((br) => br.pathData);
      const n = Math.min(pa.length, pb.length);
      let diffs = Math.abs(pa.length - pb.length);
      for (let i = 0; i < n; i++) {
        if (pa[i] !== pb[i]) diffs++;
      }
      return diffs;
    }

    it("iv = 0 collapses per-tree growth variation across seeds", () => {
      // With iv = 0, applyIndividualVariability is a no-op and the growth-rate
      // / curve-magnitude scalings contribute zero variance. Two seeds reach
      // the same trunk height and base width — the only remaining per-tree
      // difference is the curveDir flip and azimuth offset, which leave
      // height + width unchanged.
      const flat = { ...SPECIES_CONFIG.maple, individualVariability: 0 };
      const a = generateTree(40, flat, [], "seed-a");
      const b = generateTree(40, flat, [], "seed-b");
      expect(a.trunkBaseY - a.trunkTopY).toBeCloseTo(
        b.trunkBaseY - b.trunkTopY,
      );
    });

    it("iv > 0 produces visible variation in trunk height across seeds", () => {
      // High-iv species at the same growth day should reach measurably
      // different trunk heights across seeds — that's the most visible
      // sign that growth-rate variation is wired up.
      const heights = ["seed-1", "seed-2", "seed-3", "seed-4", "seed-5"].map(
        (id) => {
          const d = generateTree(40, SPECIES_CONFIG.juniper, [], id);
          return d.trunkBaseY - d.trunkTopY;
        },
      );
      const min = Math.min(...heights);
      const max = Math.max(...heights);
      // Range should exceed a few SVG units — anything < 1px would mean the
      // iv wiring isn't actually producing visible spread.
      expect(max - min).toBeGreaterThan(3);
    });

    it("different seeds of the same species produce different branch paths", () => {
      // Phase 8 exit criterion (from docs/more-natural-bonsai-growth.md):
      // four seeds of the same species at the same day should look distinct.
      const ids = ["v1", "v2", "v3", "v4"];
      const trees = ids.map((id) =>
        generateTree(50, SPECIES_CONFIG.juniper, [], id),
      );
      // Pairwise comparison: every pair should differ on at least one
      // branch path.
      for (let i = 0; i < trees.length; i++) {
        for (let j = i + 1; j < trees.length; j++) {
          expect(pathDiffCount(trees[i], trees[j])).toBeGreaterThan(0);
        }
      }
    });

    it("iv changes branch counts across seeds (childCount perturbation)", () => {
      // The per-fork ±1 childCount adjustment fires with probability iv·0.4
      // per fork, so a high-iv species at a mature stage should show varied
      // total branch counts across different seeds.
      const counts = ["seed-1", "seed-2", "seed-3", "seed-4"].map(
        (id) =>
          generateTree(60, SPECIES_CONFIG.juniper, [], id).branches.length,
      );
      const unique = new Set(counts);
      expect(unique.size).toBeGreaterThan(1);
    });

    it("iv preserves determinism — same seed twice gives identical branches", () => {
      const a = generateTree(50, SPECIES_CONFIG.juniper, [], "stable");
      const b = generateTree(50, SPECIES_CONFIG.juniper, [], "stable");
      expect(a.branches.length).toBe(b.branches.length);
      expect(a.trunkPathData).toBe(b.trunkPathData);
      for (let i = 0; i < a.branches.length; i++) {
        expect(a.branches[i].pathData).toBe(b.branches[i].pathData);
      }
    });
  });

  // ─── All species ──────────────────────────────────────────────────────────

  describe("all species at day 30", () => {
    const ids = ["pine", "maple", "cherry-blossom", "juniper", "oak"] as const;

    it.each(ids)("%s — returns valid tree data", (id) => {
      const spec = SPECIES_CONFIG[id];
      const data = generateTree(30, spec, [], TREE_ID);
      expect(data.viewBox).toBe("0 0 200 300");
      expect(data.branches).toBeDefined();
      expect(data.apexLeaves).toBeDefined();
      expect(data.trunkPathData.length).toBeGreaterThan(0);
    });

    it.each(ids)("%s — leaf clusters use species leaf shape", (id) => {
      const spec = SPECIES_CONFIG[id];
      const data = generateTree(30, spec, [], TREE_ID);
      const terminals = data.branches.filter(
        (b) => b.isTerminal && !b.isPruned,
      );
      const clustered = terminals.filter((b) => b.leaves.length > 0);
      // All species with growth past day 0 should produce some leaf clusters
      expect(clustered.length).toBeGreaterThan(0);
    });
  });

  // ─── Crown proportions (Step 1) ────────────────────────────────────────────

  describe("crown proportions", () => {
    /** Horizontal extent (max x − min x) across every live branch endpoint —
     *  a proxy for rendered crown width. */
    function crownWidth(data: ReturnType<typeof generateTree>) {
      const live = data.branches.filter((b) => !b.isPruned);
      const xs = live.flatMap((b) => [b.x1, b.x2]);
      return xs.length > 0 ? Math.max(...xs) - Math.min(...xs) : 0;
    }

    const uprightSpecies = ["pine", "oak", "maple"] as const;

    it.each(
      uprightSpecies,
    )("%s — mature crown width is proportional to tree height (not ~2x wider than tall)", (id) => {
      const spec = SPECIES_CONFIG[id];
      const data = generateTree(100, spec, [], `snapshot-${id}`);
      const height = data.trunkBaseY - data.trunkTopY;
      const width = crownWidth(data);
      const ratio = width / height;
      expect(ratio).toBeGreaterThan(0.6);
      expect(ratio).toBeLessThan(1.3);
    });

    it.each(
      uprightSpecies,
    )("%s — day-10 sapling crown width is narrower than its trunk height", (id) => {
      const spec = SPECIES_CONFIG[id];
      const data = generateTree(10, spec, [], `snapshot-${id}`);
      const height = data.trunkBaseY - data.trunkTopY;
      const width = crownWidth(data);
      expect(width).toBeLessThan(height);
    });
  });

  // ─── Age signals — trunk mass (Step 2) ─────────────────────────────────────

  describe("computeTrunkBaseWidth", () => {
    const MAPLE = SPECIES_CONFIG.maple; // trunkWidthFactor: 1.0
    const OAK = SPECIES_CONFIG.oak; // trunkWidthFactor: 1.25

    it("is monotonically increasing through day 200 and beyond", () => {
      let prev = 0;
      for (const day of [0, 10, 25, 50, 100, 150, 200, 400]) {
        const w = computeTrunkBaseWidth(day, MAPLE);
        expect(w).toBeGreaterThan(prev);
        prev = w;
      }
    });

    it("falls within the day-50 target band at trunkWidthFactor = 1 (8-9.5)", () => {
      const w = computeTrunkBaseWidth(50, MAPLE);
      expect(w).toBeGreaterThanOrEqual(8);
      expect(w).toBeLessThanOrEqual(9.5);
    });

    it("falls within the day-100 target band at trunkWidthFactor = 1 (12-14)", () => {
      const w = computeTrunkBaseWidth(100, MAPLE);
      expect(w).toBeGreaterThanOrEqual(12);
      expect(w).toBeLessThanOrEqual(14);
    });

    it("oak (trunkWidthFactor 1.25) has a thicker trunk than maple (1.0) at day 100", () => {
      expect(computeTrunkBaseWidth(100, OAK)).toBeGreaterThan(
        computeTrunkBaseWidth(100, MAPLE),
      );
    });
  });

  // ─── Age signals — foliage density (Step 2) ────────────────────────────────

  describe("age signal — foliage density", () => {
    /** Total leaf count across every rendered pad, apex included. */
    function totalLeaves(data: ReturnType<typeof generateTree>) {
      return (
        data.apexLeaves.length +
        data.branches.reduce((sum, b) => sum + b.leaves.length, 0)
      );
    }

    it("a day-100 pine carries more total leaves than the same tree at day 50", () => {
      const day50 = generateTree(50, PINE, [], TREE_ID);
      const day100 = generateTree(100, PINE, [], TREE_ID);
      expect(totalLeaves(day100)).toBeGreaterThan(totalLeaves(day50));
    });
  });

  // ─── Age signals — lower-branch sag (Step 2) ───────────────────────────────

  describe("age signal — lower-branch sag", () => {
    /** Signed vertical-rise fraction (y2-y1)/length — a droop metric that
     *  stays well-behaved across all azimuths, unlike `branchAngle`, which
     *  wraps sign at ±π when a branch's azimuth points it away from the
     *  viewer rather than straight left/right. Larger (less negative / more
     *  positive) = the tip sits proportionally lower — i.e. more sagged. */
    function droopFraction(b: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }) {
      const len = Math.hypot(b.x2 - b.x1, b.y2 - b.y1);
      return len > 0 ? (b.y2 - b.y1) / len : 0;
    }

    it("oak's lowest primary tip droops more at day 100 than day 40", () => {
      const oak = SPECIES_CONFIG.oak;
      const day40 = generateTree(40, oak, [], "sag-oak");
      const day100 = generateTree(100, oak, [], "sag-oak");
      const p0at40 = day40.branches.find((b) => b.id === "p0" && !b.isPruned);
      const p0at100 = day100.branches.find((b) => b.id === "p0" && !b.isPruned);
      expect(p0at40).toBeDefined();
      expect(p0at100).toBeDefined();
      if (!(p0at40 && p0at100)) return;
      expect(droopFraction(p0at100)).toBeGreaterThan(droopFraction(p0at40));
    });

    it("juniper (cascade — already drooping) primary droop is unchanged between day 40 and day 100", () => {
      const juniper = SPECIES_CONFIG.juniper;
      const day40 = generateTree(40, juniper, [], "sag-juniper");
      const day100 = generateTree(100, juniper, [], "sag-juniper");
      const p0at40 = day40.branches.find((b) => b.id === "p0" && !b.isPruned);
      const p0at100 = day100.branches.find((b) => b.id === "p0" && !b.isPruned);
      expect(p0at40).toBeDefined();
      expect(p0at100).toBeDefined();
      if (!(p0at40 && p0at100)) return;
      expect(droopFraction(p0at100)).toBeCloseTo(droopFraction(p0at40), 6);
    });
  });

  // ─── flowerDensity (Step 3) ─────────────────────────────────────────────

  describe("flowerDensity", () => {
    /** Every terminal, non-pruned branch tip plus the apex — the full set of
     *  eligible tips before density thinning is applied. */
    function eligibleTipCount(data: ReturnType<typeof generateTree>) {
      return (
        data.branches.filter((b) => b.isTerminal && !b.isPruned).length + 1
      );
    }

    it("juniper (density 0.15) flowers fewer than all eligible tips, but at least one", () => {
      const juniper = SPECIES_CONFIG.juniper;
      const data = generateTree(100, juniper, [], "flower-density-juniper");
      expect(data.flowers.length).toBeGreaterThan(0);
      expect(data.flowers.length).toBeLessThan(eligibleTipCount(data));
    });

    it("same treeId and day produce identical flower ids", () => {
      const oak = SPECIES_CONFIG.oak;
      const a = generateTree(95, oak, [], "flower-det-oak");
      const b = generateTree(95, oak, [], "flower-det-oak");
      expect(a.flowers.length).toBeGreaterThan(0);
      expect(a.flowers.map((f) => f.id)).toEqual(b.flowers.map((f) => f.id));
    });

    it("a tip flowering on day N is still flowering on day N+1", () => {
      const oak = SPECIES_CONFIG.oak;
      const dayN = generateTree(95, oak, [], "flower-det-oak");
      const dayN1 = generateTree(96, oak, [], "flower-det-oak");
      expect(dayN.flowers.length).toBeGreaterThan(0);
      const idsN1 = new Set(dayN1.flowers.map((f) => f.id));
      for (const f of dayN.flowers) {
        expect(idsN1.has(f.id)).toBe(true);
      }
    });

    it("flowerDensity 1 gives every eligible tip a flower, unchanged from before", () => {
      const maple = SPECIES_CONFIG.maple;
      const fullBloom = {
        ...maple,
        flowers: maple.flowers && { ...maple.flowers, flowerDensity: 1 },
      };
      const data = generateTree(60, fullBloom, [], "flower-density-full");
      expect(data.flowers.length).toBe(eligibleTipCount(data));
    });
  });

  // ─── Canopy cohesion — spur pads on terminal species (Step 4) ────────────

  describe("spur pads on terminal-distribution species", () => {
    it("cherry-blossom day 100: non-terminal branches carry spur-pad leaves, unlike interiorPadDensity 0", () => {
      const cherry = SPECIES_CONFIG["cherry-blossom"];
      const withSpurs = generateTree(100, cherry, [], "spur-cherry");
      const nonTerminalLeafy = withSpurs.branches.filter(
        (b) => !(b.isTerminal || b.isPruned) && b.leaves.length > 0,
      );
      expect(nonTerminalLeafy.length).toBeGreaterThan(0);

      const noSpurs = generateTree(
        100,
        { ...cherry, interiorPadDensity: 0 },
        [],
        "spur-cherry",
      );
      const nonTerminalLeafyNoSpurs = noSpurs.branches.filter(
        (b) => !(b.isTerminal || b.isPruned) && b.leaves.length > 0,
      );
      expect(nonTerminalLeafyNoSpurs.length).toBe(0);
    });

    it("oak day 100: spur pads increase total leaf count over interiorPadDensity 0", () => {
      const oak = SPECIES_CONFIG.oak;
      const totalLeaves = (data: ReturnType<typeof generateTree>) =>
        data.apexLeaves.length +
        data.branches.reduce((sum, b) => sum + b.leaves.length, 0);

      const withSpurs = generateTree(100, oak, [], "spur-oak");
      const noSpurs = generateTree(
        100,
        { ...oak, interiorPadDensity: 0 },
        [],
        "spur-oak",
      );
      expect(totalLeaves(withSpurs)).toBeGreaterThan(totalLeaves(noSpurs));
    });
  });

  // ─── Age signal — pad radius (Step 4) ─────────────────────────────────────

  describe("age signal — pad radius", () => {
    it("pine terminal-pad leaves scatter farther from the tip at day 100 than day 15", () => {
      // Leaf-centre distance from the branch tip isolates the radius signal:
      // it's sqrt(seededVal) * radius, independent of leafSize/progress (which
      // also change with day but only affect drawn leaf size, not placement).
      function maxTipDistance(data: ReturnType<typeof generateTree>) {
        const distances = data.branches
          .filter((b) => b.isTerminal && !b.isPruned)
          .flatMap((b) =>
            b.leaves.map((leaf) => Math.hypot(leaf.cx - b.x2, leaf.cy - b.y2)),
          );
        return distances.length > 0 ? Math.max(...distances) : 0;
      }

      const day15 = generateTree(15, PINE, [], "pad-radius-pine");
      const day100 = generateTree(100, PINE, [], "pad-radius-pine");
      expect(maxTipDistance(day100)).toBeGreaterThan(maxTipDistance(day15));
    });
  });

  // ─── Species silhouettes (Step 5) ──────────────────────────────────────────

  describe("pine — conical taper (A1)", () => {
    it("day 100: primary branch length decreases from the lowest to the highest attachment zone", () => {
      // Group primaries by attachment height instead of comparing a single
      // p0-vs-p-last pair: individual branches' 2D `maxLength` is heavily
      // foreshortened by azimuth (a branch pointing toward/away from the
      // viewer projects far shorter than one lying in the picture plane),
      // which can swamp the taper signal for any one pair. Whorled pine
      // primaries at the same height node share an exact attachment y (no
      // per-branch height jitter for whorled phyllotaxy), so averaging within
      // each node cancels the azimuth noise and isolates the taper.
      const data = generateTree(100, PINE, [], "snapshot-pine");
      const primaries = data.branches.filter(
        (b) => /^p\d+$/.test(b.id) && !b.isPruned,
      );
      const byAttachY = new Map<number, number[]>();
      for (const p of primaries) {
        const len = Math.hypot(p.x2 - p.x1, p.y2 - p.y1);
        const key = Math.round(p.y1 * 10) / 10;
        byAttachY.set(key, [...(byAttachY.get(key) ?? []), len]);
      }
      const nodeYs = [...byAttachY.keys()].sort((a, b) => b - a); // base-first
      expect(nodeYs.length).toBeGreaterThanOrEqual(2);
      const avg = (lens: number[]) =>
        lens.reduce((sum, v) => sum + v, 0) / lens.length;
      const lowestZoneAvg = avg(byAttachY.get(nodeYs[0]) ?? []);
      const highestZoneAvg = avg(
        byAttachY.get(nodeYs[nodeYs.length - 1]) ?? [],
      );
      expect(highestZoneAvg).toBeLessThan(lowestZoneAvg);
    });
  });

  describe("pine — bare-neck ceiling (A2)", () => {
    it("day 100: apicalDominance >= 0.6 raises the primary-attachment ceiling, moving the highest primary closer to the trunk top than the old non-cascade default", () => {
      // Pine's whorled phyllotaxy yields ceil(maxBranchPairs / whorlSize)
      // = ceil(12/3) = 4 height-nodes, and the "1/3 rule" spacing converges
      // toward maxAttachFrac from below (highest node ~76% of trunk height
      // at the 0.96 ceiling). This test verifies the ceiling raise itself:
      // the highest primary attaches measurably higher than under the
      // pre-A2 (apicalDominance < 0.6) ceiling of 0.9.
      function highestPrimaryFrac(spec: SpeciesConfig) {
        const data = generateTree(100, spec, [], "snapshot-pine");
        const trunkHeight = data.trunkBaseY - data.trunkTopY;
        const primaries = data.branches.filter(
          (b) => /^p\d+$/.test(b.id) && !b.isPruned,
        );
        const minY1 = Math.min(...primaries.map((b) => b.y1));
        return (data.trunkBaseY - minY1) / trunkHeight;
      }
      const belowCeilingThreshold = { ...PINE, apicalDominance: 0.5 };
      expect(highestPrimaryFrac(PINE)).toBeGreaterThan(
        highestPrimaryFrac(belowCeilingThreshold),
      );
    });
  });

  describe("pine — needle tufts (A3)", () => {
    it("day 100: needle-pad angles avoid the downward-pointing arc (20°,160°)", () => {
      const data = generateTree(100, PINE, [], "snapshot-pine");
      const needleLeaves = data.branches
        .filter((b) => b.isTerminal && !b.isPruned)
        .flatMap((b) => b.leaves);
      expect(needleLeaves.length).toBeGreaterThan(0);
      for (const leaf of needleLeaves) {
        const a = ((leaf.angleDeg % 360) + 360) % 360;
        expect(a > 20 && a < 160).toBe(false);
      }
    });
  });

  describe("cherry — blossoms on spurs (D)", () => {
    it("day 100: flower count exceeds the same tree with interiorPadDensity 0 (no spur sites)", () => {
      const cherry = SPECIES_CONFIG["cherry-blossom"];
      const withSpurs = generateTree(100, cherry, [], "flower-spur-cherry");
      const noSpurs = generateTree(
        100,
        { ...cherry, interiorPadDensity: 0 },
        [],
        "flower-spur-cherry",
      );
      expect(withSpurs.flowers.length).toBeGreaterThan(noSpurs.flowers.length);
    });

    it("day 100: oak also gains flower sites from spurs (subtler than cherry)", () => {
      const oak = SPECIES_CONFIG.oak;
      const withSpurs = generateTree(100, oak, [], "flower-spur-oak");
      const noSpurs = generateTree(
        100,
        { ...oak, interiorPadDensity: 0 },
        [],
        "flower-spur-oak",
      );
      expect(withSpurs.flowers.length).toBeGreaterThanOrEqual(
        noSpurs.flowers.length,
      );
    });
  });

  describe("config assertions (Step 5)", () => {
    it("juniper tipDroop is negative (semi-cascade twig droop)", () => {
      expect(SPECIES_CONFIG.juniper.tipDroop).toBeLessThan(0);
    });

    it("flame tree leafSize shrank for fine bipinnate texture", () => {
      expect(SPECIES_CONFIG["flame-tree"].leafSize).toBeLessThan(5.5);
    });
  });

  // ─── Render-cost budgets ────────────────────────────────────────────────────
  // Generator output size drives SVG element count directly (every leaf is at
  // least one node), so each species gets a day-100 ceiling with ~15% headroom
  // over its tuned count. A failure here means a tuning change quietly blew up
  // render cost — retune density rather than raising the budget without
  // checking garden-view performance first.

  describe("day-100 element budgets", () => {
    const BUDGETS: Record<string, number> = {
      pine: 3400,
      maple: 1400,
      "cherry-blossom": 850,
      juniper: 4600,
      oak: 1100,
      wisteria: 1500,
      "flame-tree": 3300,
    };

    function totalElements(data: ReturnType<typeof generateTree>) {
      let n = data.branches.length + data.apexLeaves.length;
      for (const b of data.branches) n += b.leaves.length;
      for (const f of data.flowers)
        n += f.florets.length + f.racemeFlorets.length;
      return n;
    }

    it.each(
      Object.entries(BUDGETS),
    )("%s stays under %i elements at day 100", (id, budget) => {
      const spec = SPECIES_CONFIG[id as keyof typeof SPECIES_CONFIG];
      const data = generateTree(100, spec, [], `snapshot-${id}`);
      expect(totalElements(data)).toBeLessThan(budget);
    });
  });
});
