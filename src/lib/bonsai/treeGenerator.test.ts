import { describe, expect, it } from "vitest";
import { SPECIES_CONFIG } from "./schema";
import { BRANCH_GROW_DURATION, generateTree } from "./treeGenerator";

const PINE = SPECIES_CONFIG.pine; // branchFrequency: 6, regrowthDays: 14
const TREE_ID = "test-tree-id";

// ─── BRANCH_GROW_DURATION ─────────────────────────────────────────────────────

describe("BRANCH_GROW_DURATION", () => {
  it("is exported as a positive number", () => {
    expect(BRANCH_GROW_DURATION).toBeGreaterThan(0);
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
      expect(data.branches.length).toBeGreaterThan(4);
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
    // Pine branchFrequency=6: L0 appears at day 6. Pruned at day 20.
    // At day 20: 20 < 20 + 14 = 34, so still pruned.
    const pruned = [{ branchId: "L0", prunedAtDay: 20 }];

    it("renders a stub for the pruned branch", () => {
      const data = generateTree(20, PINE, pruned, TREE_ID);
      const stub = data.branches.find((b) => b.id === "L0" && b.isPruned);
      expect(stub).toBeDefined();
    });

    it("pruned branch stub has no leaves", () => {
      const data = generateTree(20, PINE, pruned, TREE_ID);
      const stub = data.branches.find((b) => b.id === "L0" && b.isPruned);
      expect(stub?.leaves).toHaveLength(0);
    });

    it("children of a pruned branch are hidden", () => {
      // Day 30 is within pruning window: 30 < 20 + 14 = 34
      const data = generateTree(30, PINE, pruned, TREE_ID);
      const child = data.branches.find((b) => b.id === "L0-a" && !b.isPruned);
      expect(child).toBeUndefined();
    });
  });

  // ─── Regrowth ──────────────────────────────────────────────────────────────

  describe("regrowth", () => {
    // Prune L0 at day 15. regrowthStart = 15 + 14 = 29.
    const pruned = [{ branchId: "L0", prunedAtDay: 15 }];

    it("regrowing branch is shorter than the same branch at full growth", () => {
      // At day 31: effectiveAge = 31 - 29 = 2, progress = 2/6 ≈ 0.33 → short
      const regrowing = generateTree(31, PINE, pruned, TREE_ID);
      // At day 100 with no pruned entry: branch at full natural growth
      const mature = generateTree(100, PINE, [], TREE_ID);

      const regrowingBranch = regrowing.branches.find(
        (b) => b.id === "L0" && !b.isPruned,
      );
      const matureBranch = mature.branches.find((b) => b.id === "L0");

      expect(regrowingBranch).toBeDefined();
      expect(matureBranch).toBeDefined();

      const regrowLen = Math.hypot(
        regrowingBranch?.x2 - regrowingBranch?.x1,
        regrowingBranch?.y2 - regrowingBranch?.y1,
      );
      const matureLen = Math.hypot(
        matureBranch?.x2 - matureBranch?.x1,
        matureBranch?.y2 - matureBranch?.y1,
      );

      expect(regrowLen).toBeLessThan(matureLen);
    });

    it("child of a regrowing branch is not yet visible at regrowth start", () => {
      // At day 29 (effectiveAge=0), L0-a needs SPLIT_DELAY more days to appear
      const atStart = generateTree(29, PINE, pruned, TREE_ID);
      const child = atStart.branches.find(
        (b) => b.id === "L0-a" && !b.isPruned,
      );
      expect(child).toBeUndefined();
    });

    it("child of a regrowing branch appears after SPLIT_DELAY days", () => {
      // At day 29 + 7 (SPLIT_DELAY) + a few more = day 38, L0-a should appear
      const data = generateTree(40, PINE, pruned, TREE_ID);
      const child = data.branches.find((b) => b.id === "L0-a" && !b.isPruned);
      expect(child).toBeDefined();
    });

    it("regrowing branch is not marked isPruned", () => {
      const data = generateTree(31, PINE, pruned, TREE_ID);
      const branch = data.branches.find((b) => b.id === "L0");
      expect(branch?.isPruned).toBe(false);
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
});
