import { describe, expect, it } from "vitest";
import {
  FACING_DELTAS,
  type FarmerPose,
  facingTowards,
  findPath,
  routeToFeature,
  samePosition,
  stepFarmer,
  tileInFront,
} from "./movement";
import { makeMeadowmereState } from "./testFixtures";
import { type Feature, isWalkable } from "./valeMap";

/** Six plots, matching a fresh smallholding. */
const state = makeMeadowmereState({
  plots: Array.from({ length: 6 }, (_, i) => ({
    id: `plot-${i}`,
    planting: null,
  })),
});

const pose = (x: number, y: number, facing: FarmerPose["facing"]) => ({
  x,
  y,
  facing,
});

describe("movement", () => {
  describe("tileInFront", () => {
    it("reads the tile in each direction", () => {
      expect(tileInFront(pose(5, 5, "up"))).toEqual({ x: 5, y: 4 });
      expect(tileInFront(pose(5, 5, "down"))).toEqual({ x: 5, y: 6 });
      expect(tileInFront(pose(5, 5, "left"))).toEqual({ x: 4, y: 5 });
      expect(tileInFront(pose(5, 5, "right"))).toEqual({ x: 6, y: 5 });
    });

    it("agrees with the facing deltas", () => {
      for (const [facing, delta] of Object.entries(FACING_DELTAS)) {
        const from = pose(5, 5, facing as FarmerPose["facing"]);
        expect(tileInFront(from)).toEqual({ x: 5 + delta.x, y: 5 + delta.y });
      }
    });
  });

  describe("stepFarmer", () => {
    it("walks onto open ground", () => {
      expect(stepFarmer(state, pose(8, 5, "down"), "down")).toEqual(
        pose(8, 6, "down"),
      );
    });

    it("turns to the new direction as well as moving", () => {
      expect(stepFarmer(state, pose(8, 5, "up"), "right")).toEqual(
        pose(9, 5, "right"),
      );
    });

    it("turns without moving when the way is blocked", () => {
      // (2,3) faces the hedge-fenced river at x=0 two tiles on; step west from
      // (1,3) instead, where the river is immediately ahead.
      expect(stepFarmer(state, pose(1, 3, "down"), "left")).toEqual(
        pose(1, 3, "left"),
      );
    });

    it("turns to face a plot rather than walking into it", () => {
      // Plot 0 sits at (3,3); approaching from the west should only turn.
      const result = stepFarmer(state, pose(2, 3, "down"), "right");
      expect(result).toEqual(pose(2, 3, "right"));
      expect(tileInFront(result)).toEqual({ x: 3, y: 3 });
    });

    it("stops at the hedge on the map edge", () => {
      expect(stepFarmer(state, pose(1, 1, "left"), "up")).toEqual(
        pose(1, 1, "up"),
      );
    });
  });

  describe("samePosition", () => {
    it("compares tiles by coordinate only", () => {
      expect(samePosition({ x: 1, y: 2 }, { x: 1, y: 2 })).toBe(true);
      expect(samePosition({ x: 1, y: 2 }, { x: 2, y: 1 })).toBe(false);
    });
  });

  describe("facingTowards", () => {
    it("points at the neighbouring tile", () => {
      expect(facingTowards({ x: 5, y: 5 }, { x: 5, y: 4 })).toBe("up");
      expect(facingTowards({ x: 5, y: 5 }, { x: 5, y: 6 })).toBe("down");
      expect(facingTowards({ x: 5, y: 5 }, { x: 4, y: 5 })).toBe("left");
      expect(facingTowards({ x: 5, y: 5 }, { x: 6, y: 5 })).toBe("right");
    });
  });

  describe("findPath", () => {
    it("returns an empty path when already there", () => {
      expect(findPath(state, { x: 8, y: 5 }, { x: 8, y: 5 })).toEqual([]);
    });

    it("walks a straight line down the lane", () => {
      expect(findPath(state, { x: 8, y: 2 }, { x: 8, y: 5 })).toEqual([
        { x: 8, y: 3 },
        { x: 8, y: 4 },
        { x: 8, y: 5 },
      ]);
    });

    it("finds the shortest route and never steps on something unwalkable", () => {
      const path = findPath(state, { x: 1, y: 2 }, { x: 13, y: 9 });
      expect(path).not.toBeNull();
      for (const tile of path as { x: number; y: number }[]) {
        expect(isWalkable(state, tile.x, tile.y)).toBe(true);
      }
      // Manhattan distance is the floor; open ground means it is also the cost.
      expect(path).toHaveLength(12 + 7);
    });

    it("ends on the requested tile", () => {
      const path = findPath(state, { x: 1, y: 2 }, { x: 13, y: 9 }) ?? [];
      expect(path.at(-1)).toEqual({ x: 13, y: 9 });
    });

    it("steps one tile at a time", () => {
      const path = findPath(state, { x: 1, y: 2 }, { x: 9, y: 8 }) ?? [];
      let previous = { x: 1, y: 2 };
      for (const tile of path) {
        const distance =
          Math.abs(tile.x - previous.x) + Math.abs(tile.y - previous.y);
        expect(distance).toBe(1);
        previous = tile;
      }
    });

    it("routes round a plot rather than through it", () => {
      const path = findPath(state, { x: 2, y: 3 }, { x: 6, y: 3 }) ?? [];
      expect(path).not.toContainEqual({ x: 3, y: 3 });
      expect(path.at(-1)).toEqual({ x: 6, y: 3 });
    });

    it("returns null for an unreachable target", () => {
      expect(findPath(state, { x: 8, y: 5 }, { x: 0, y: 0 })).toBeNull();
    });

    it("returns null when the target holds a feature", () => {
      expect(findPath(state, { x: 8, y: 5 }, { x: 3, y: 3 })).toBeNull();
    });
  });

  describe("routeToFeature", () => {
    const plot: Feature = { kind: "plot", x: 3, y: 3, index: 0 };

    it("stops beside the feature and faces it", () => {
      const route = routeToFeature(state, pose(1, 1, "down"), plot);
      expect(route).not.toBeNull();
      const arrival = route?.path.at(-1) ?? { x: 1, y: 1 };
      const distance =
        Math.abs(arrival.x - plot.x) + Math.abs(arrival.y - plot.y);
      expect(distance).toBe(1);
      expect(route?.facing).toBe(facingTowards(arrival, plot));
    });

    it("walks round the plot row to reach the far bed and faces it", () => {
      // Plots 0–2 fill y=3 from x=3 to x=5, so approaching plot 0 from the
      // east means dropping into the walkway at y=4 and coming up underneath.
      const route = routeToFeature(state, pose(6, 3, "down"), plot);
      expect(route?.path).toEqual([
        { x: 6, y: 4 },
        { x: 5, y: 4 },
        { x: 4, y: 4 },
        { x: 3, y: 4 },
      ]);
      expect(route?.facing).toBe("up");
    });

    it("needs no walk when already stood beside it", () => {
      const route = routeToFeature(state, pose(2, 3, "down"), plot);
      expect(route?.path).toEqual([]);
      expect(route?.facing).toBe("right");
    });

    it("reaches the riverbank landing across the water", () => {
      const site: Feature = { kind: "site", x: 0, y: 6, siteId: "riverbank" };
      const route = routeToFeature(state, pose(8, 6, "down"), site);
      expect(route?.path.at(-1)).toEqual({ x: 1, y: 6 });
      expect(route?.facing).toBe("left");
    });

    it("returns null when nothing beside the feature can be reached", () => {
      const walledIn: Feature = { kind: "stall", x: 0, y: 0 };
      expect(routeToFeature(state, pose(8, 6, "down"), walledIn)).toBeNull();
    });
  });
});
