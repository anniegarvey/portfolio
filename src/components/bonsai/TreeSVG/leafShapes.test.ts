import { describe, expect, it } from "vitest";
import type { Leaf } from "@/lib/bonsai/treeGenerator";
import { LEAF_TEMPLATES, leavesPathData } from "./leafShapes";

const leaf = (over: Partial<Leaf> = {}): Leaf => ({
  id: "l",
  cx: 100,
  cy: 150,
  rx: 10,
  ry: 10,
  angleDeg: 0,
  z: 0,
  ...over,
});

/** Signed area of a unit-space ring; the sign is its winding. */
function area(ring: readonly (readonly [number, number])[]): number {
  let a = 0;
  ring.forEach(([x1, y1], i) => {
    const [x2, y2] = ring[(i + 1) % ring.length];
    a += x1 * y2 - x2 * y1;
  });
  return a;
}

/** Absolute points of every ring in a path of `M x y l dx dy ... z` rings. */
function rings(d: string): [number, number][][] {
  return d
    .split("z")
    .filter(Boolean)
    .map((sub) => {
      const nums = sub.replace(/[Ml]/g, " ").trim().split(/\s+/).map(Number);
      const pts: [number, number][] = [[nums[0], nums[1]]];
      for (let i = 2; i < nums.length; i += 2) {
        const [px, py] = pts[pts.length - 1];
        pts.push([px + nums[i], py + nums[i + 1]]);
      }
      return pts;
    });
}

describe("LEAF_TEMPLATES", () => {
  it.each(
    Object.entries(LEAF_TEMPLATES),
  )("%s winds solids and holes in opposite directions", (_, tpl) => {
    expect(tpl.solids.length).toBeGreaterThan(0);
    for (const ring of tpl.solids) expect(area(ring)).toBeGreaterThan(0);
    for (const ring of tpl.holes) expect(area(ring)).toBeLessThan(0);
  });

  it.each(
    Object.entries(LEAF_TEMPLATES),
  )("%s stays within a lean point budget", (_, tpl) => {
    const points = [...tpl.solids, ...tpl.holes].reduce(
      (n, r) => n + r.length,
      0,
    );
    expect(points).toBeLessThanOrEqual(110);
  });
});

describe("leavesPathData", () => {
  it("returns empty path data for no leaves", () => {
    expect(leavesPathData([], "lobed")).toBe("");
  });

  it("draws one ring per template ring per leaf", () => {
    const tpl = LEAF_TEMPLATES.lobed;
    const d = leavesPathData([leaf(), leaf({ cx: 50 })], "lobed");
    expect(rings(d)).toHaveLength(2 * (tpl.solids.length + tpl.holes.length));
  });

  it("places, scales and rotates the silhouette about the leaf centre", () => {
    // The sakura's first point is a claw at radius 0.3, 36° anticlockwise of up.
    const [first] = rings(leavesPathData([leaf()], "blossom"))[0];
    const a = (-36 * Math.PI) / 180;
    expect(first[0]).toBeCloseTo(100 + Math.sin(a) * 3, 0);
    expect(first[1]).toBeCloseTo(150 - Math.cos(a) * 3, 0);

    // Turned half a turn, the same point lands mirrored through the centre.
    const [turned] = rings(
      leavesPathData([leaf({ angleDeg: 180 })], "blossom"),
    )[0];
    expect(turned[0]).toBeCloseTo(200 - first[0], 0);
    expect(turned[1]).toBeCloseTo(300 - first[1], 0);
  });

  it("writes relative coordinates that close back without drift", () => {
    const d = leavesPathData(
      [leaf({ cx: 37.37, cy: 81.93, angleDeg: 33 })],
      "palmate",
    );
    for (const ring of rings(d)) {
      for (const [x, y] of ring) {
        expect(Math.abs(x * 10 - Math.round(x * 10))).toBeLessThan(1e-6);
        expect(Math.abs(y * 10 - Math.round(y * 10))).toBeLessThan(1e-6);
      }
    }
  });

  it("drops the leading zero on short numbers", () => {
    const d = leavesPathData([leaf({ rx: 1, ry: 1 })], "needle");
    expect(d).not.toMatch(/(^|[\s-])0\.\d/);
  });
});
