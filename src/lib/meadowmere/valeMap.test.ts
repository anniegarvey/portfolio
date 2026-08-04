import { describe, expect, it } from "vitest";
import { MAX_PLOTS } from "./catalog";
import { makeMeadowmereState } from "./testFixtures";
import {
  FARMER_START,
  fallowPlotTiles,
  featureAt,
  isInBounds,
  isWalkable,
  TILE_SIZE,
  terrainAt,
  VALE_HEIGHT,
  VALE_WIDTH,
  valeFeatures,
} from "./valeMap";

const stateWithPlots = (count: number) =>
  makeMeadowmereState({
    plots: Array.from({ length: count }, (_, i) => ({
      id: `plot-${i}`,
      planting: null,
    })),
  });

describe("valeMap", () => {
  describe("grid", () => {
    it("is 16 tiles wide and 12 tall", () => {
      expect(VALE_WIDTH).toBe(16);
      expect(VALE_HEIGHT).toBe(12);
    });

    it("exposes a positive tile size for the SVG viewBox", () => {
      expect(TILE_SIZE).toBeGreaterThan(0);
    });

    it("treats tiles outside the grid as out of bounds", () => {
      expect(isInBounds(0, 0)).toBe(true);
      expect(isInBounds(VALE_WIDTH - 1, VALE_HEIGHT - 1)).toBe(true);
      expect(isInBounds(-1, 0)).toBe(false);
      expect(isInBounds(0, -1)).toBe(false);
      expect(isInBounds(VALE_WIDTH, 0)).toBe(false);
      expect(isInBounds(0, VALE_HEIGHT)).toBe(false);
    });
  });

  describe("terrainAt", () => {
    it("fences the map in with hedge on every edge row", () => {
      for (let x = 0; x < VALE_WIDTH; x++) {
        expect(terrainAt(x, 0)).toBe("hedge");
        expect(terrainAt(x, VALE_HEIGHT - 1)).toBe("hedge");
      }
    });

    it("runs the river down the west side", () => {
      expect(terrainAt(0, 6)).toBe("water");
    });

    it("runs the lane down x=8", () => {
      expect(terrainAt(8, 5)).toBe("path");
    });

    it("puts the farmhouse at the top left", () => {
      expect(terrainAt(2, 1)).toBe("farmhouse");
    });

    it("reads out of bounds as hedge so callers need no bounds check", () => {
      expect(terrainAt(-1, 5)).toBe("hedge");
      expect(terrainAt(VALE_WIDTH, 5)).toBe("hedge");
    });
  });

  describe("valeFeatures", () => {
    it("places one plot feature per plot the player owns", () => {
      const features = valeFeatures(stateWithPlots(6));
      expect(features.filter((f) => f.kind === "plot")).toHaveLength(6);
    });

    it("adds plot features as quests hand over land", () => {
      const features = valeFeatures(stateWithPlots(MAX_PLOTS));
      expect(features.filter((f) => f.kind === "plot")).toHaveLength(MAX_PLOTS);
    });

    it("gives every plot its own tile", () => {
      const plots = valeFeatures(stateWithPlots(MAX_PLOTS)).filter(
        (f) => f.kind === "plot",
      );
      const tiles = new Set(plots.map((p) => `${p.x},${p.y}`));
      expect(tiles.size).toBe(MAX_PLOTS);
    });

    it("shows all three sites even while they are locked", () => {
      const features = valeFeatures(stateWithPlots(6));
      expect(features.filter((f) => f.kind === "site")).toHaveLength(3);
    });

    it("stands a cottage for each of the three neighbours", () => {
      const cottages = valeFeatures(stateWithPlots(6)).filter(
        (f) => f.kind === "cottage",
      );
      expect(cottages.map((c) => c.neighbourId).sort()).toEqual([
        "bram",
        "marigold",
        "nessa",
      ]);
    });

    it("stands exactly one seed stall", () => {
      expect(
        valeFeatures(stateWithPlots(6)).filter((f) => f.kind === "stall"),
      ).toHaveLength(1);
    });

    it("never puts two features on the same tile", () => {
      const features = valeFeatures(stateWithPlots(MAX_PLOTS));
      const tiles = new Set(features.map((f) => `${f.x},${f.y}`));
      expect(tiles.size).toBe(features.length);
    });
  });

  describe("fallowPlotTiles", () => {
    it("lists the beds not yet handed over", () => {
      expect(fallowPlotTiles(stateWithPlots(6))).toHaveLength(MAX_PLOTS - 6);
    });

    it("is empty once the farm is full", () => {
      expect(fallowPlotTiles(stateWithPlots(MAX_PLOTS))).toEqual([]);
    });

    it("never overlaps a placed plot", () => {
      const state = stateWithPlots(9);
      const placed = new Set(
        valeFeatures(state)
          .filter((f) => f.kind === "plot")
          .map((f) => `${f.x},${f.y}`),
      );
      for (const tile of fallowPlotTiles(state)) {
        expect(placed.has(`${tile.x},${tile.y}`)).toBe(false);
      }
    });
  });

  describe("featureAt", () => {
    it("finds the feature standing on a tile", () => {
      const state = stateWithPlots(6);
      expect(featureAt(state, 3, 3)).toMatchObject({ kind: "plot", index: 0 });
    });

    it("returns null for open ground", () => {
      expect(featureAt(stateWithPlots(6), 8, 6)).toBeNull();
    });

    it("returns null on a bed the player doesn't own yet", () => {
      expect(featureAt(stateWithPlots(6), 3, 9)).toBeNull();
    });
  });

  describe("isWalkable", () => {
    it("lets the farmer onto grass and path", () => {
      expect(isWalkable(stateWithPlots(6), 8, 6)).toBe(true);
      expect(isWalkable(stateWithPlots(6), 1, 1)).toBe(true);
    });

    it("stops the farmer at the hedge, the river and the farmhouse", () => {
      const state = stateWithPlots(6);
      expect(isWalkable(state, 0, 0)).toBe(false);
      expect(isWalkable(state, 0, 6)).toBe(false);
      expect(isWalkable(state, 2, 1)).toBe(false);
    });

    it("stops the farmer walking onto a feature", () => {
      const state = stateWithPlots(6);
      expect(isWalkable(state, 3, 3)).toBe(false);
      expect(isWalkable(state, 12, 2)).toBe(false);
      expect(isWalkable(state, 6, 2)).toBe(false);
    });

    it("opens a bed's tile back up only until the plot is placed", () => {
      expect(isWalkable(stateWithPlots(6), 3, 9)).toBe(true);
      expect(isWalkable(stateWithPlots(MAX_PLOTS), 3, 9)).toBe(false);
    });

    it("refuses tiles outside the grid", () => {
      expect(isWalkable(stateWithPlots(6), -1, 6)).toBe(false);
    });
  });

  describe("FARMER_START", () => {
    it("stands the farmer on walkable ground", () => {
      expect(
        isWalkable(stateWithPlots(MAX_PLOTS), FARMER_START.x, FARMER_START.y),
      ).toBe(true);
    });
  });

  describe("reachability", () => {
    // Every feature must have somewhere to stand beside it, or the loop it
    // belongs to becomes unplayable.
    it("leaves a walkable tile beside every feature on a full farm", () => {
      const state = stateWithPlots(MAX_PLOTS);
      for (const feature of valeFeatures(state)) {
        const adjacent = [
          [feature.x, feature.y - 1],
          [feature.x, feature.y + 1],
          [feature.x - 1, feature.y],
          [feature.x + 1, feature.y],
        ].some(([x, y]) => isWalkable(state, x, y));
        expect(
          adjacent,
          `${feature.kind} at ${feature.x},${feature.y} is walled in`,
        ).toBe(true);
      }
    });
  });
});
