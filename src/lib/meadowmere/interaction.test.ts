import { describe, expect, it } from "vitest";
import { FORAGES_PER_DAY } from "./catalog";
import { interactionFor } from "./interaction";
import { makeMeadowmereState, makePlanting, makePlot } from "./testFixtures";
import type { Feature } from "./valeMap";

const TODAY = "2026-06-20";

const PLOT_0: Feature = { kind: "plot", x: 3, y: 3, index: 0 };
const HEDGEROW: Feature = { kind: "site", x: 5, y: 0, siteId: "hedgerow" };
const RIVERBANK: Feature = { kind: "site", x: 0, y: 6, siteId: "riverbank" };
const COTTAGE: Feature = { kind: "cottage", x: 12, y: 2, neighbourId: "nessa" };
const STALL: Feature = { kind: "stall", x: 6, y: 2 };

describe("interactionFor", () => {
  describe("bare plots", () => {
    it("says which seed is missing when none is chosen", () => {
      const state = makeMeadowmereState({ plots: [makePlot()] });
      const result = interactionFor(state, PLOT_0, null, TODAY);
      expect(result.action).toBeNull();
      expect(result.label).toBe("Plot 1 — bare soil, needs a seed in hand");
    });

    it("offers to sow when a seed is chosen and in the pouch", () => {
      const state = makeMeadowmereState({
        plots: [makePlot()],
        seeds: { parsnip: 2 },
      });
      const result = interactionFor(state, PLOT_0, "parsnip", TODAY);
      expect(result.action).toEqual({
        type: "plant",
        plotId: makePlot().id,
        cropId: "parsnip",
      });
      expect(result.label).toBe("Sow Parsnip in Plot 1");
    });

    it("refuses to sow a seed the player has run out of", () => {
      const state = makeMeadowmereState({
        plots: [makePlot()],
        seeds: { parsnip: 0 },
      });
      const result = interactionFor(state, PLOT_0, "parsnip", TODAY);
      expect(result.action).toBeNull();
      expect(result.label).toBe("Plot 1 — no Parsnip seed left");
    });

    it("refuses to sow a crop that isn't unlocked", () => {
      const state = makeMeadowmereState({
        plots: [makePlot()],
        seeds: { pumpkin: 3 },
        unlockedCropIds: ["parsnip"],
      });
      expect(interactionFor(state, PLOT_0, "pumpkin", TODAY).action).toBeNull();
    });
  });

  describe("growing plots", () => {
    it("offers water while the crop is unwatered today", () => {
      const state = makeMeadowmereState({
        plots: [makePlot({ planting: makePlanting({ plantedDate: TODAY }) })],
      });
      const result = interactionFor(state, PLOT_0, null, TODAY);
      expect(result.action).toEqual({ type: "water", plotId: makePlot().id });
      expect(result.label).toBe("Water Parsnip in Plot 1");
    });

    it("has nothing to do once watered today", () => {
      const state = makeMeadowmereState({
        plots: [
          makePlot({
            planting: makePlanting({
              plantedDate: TODAY,
              lastWateredDate: TODAY,
            }),
          }),
        ],
      });
      const result = interactionFor(state, PLOT_0, null, TODAY);
      expect(result.action).toBeNull();
      expect(result.label).toBe("Plot 1 — Parsnip, watered today");
    });

    it("offers harvest over water once ripe", () => {
      // Parsnip matures in two days.
      const state = makeMeadowmereState({
        plots: [
          makePlot({ planting: makePlanting({ plantedDate: "2026-06-18" }) }),
        ],
      });
      const result = interactionFor(state, PLOT_0, null, TODAY);
      expect(result.action).toEqual({ type: "harvest", plotId: makePlot().id });
      expect(result.label).toBe("Harvest Parsnip from Plot 1");
    });

    it("still offers harvest when a seed is selected", () => {
      const state = makeMeadowmereState({
        plots: [
          makePlot({ planting: makePlanting({ plantedDate: "2026-06-18" }) }),
        ],
        seeds: { parsnip: 5 },
      });
      expect(interactionFor(state, PLOT_0, "parsnip", TODAY).action).toEqual({
        type: "harvest",
        plotId: makePlot().id,
      });
    });
  });

  describe("sites", () => {
    it("offers a forage trip at an unlocked site", () => {
      const state = makeMeadowmereState({ foragesToday: 0 });
      const result = interactionFor(state, HEDGEROW, null, TODAY);
      expect(result.action).toEqual({ type: "forage", siteId: "hedgerow" });
      expect(result.label).toBe(
        `Forage The Hedgerow (${FORAGES_PER_DAY} trips left)`,
      );
    });

    it("counts down the trips left in the prompt, singular on the last one", () => {
      const state = makeMeadowmereState({ foragesToday: FORAGES_PER_DAY - 1 });
      expect(interactionFor(state, HEDGEROW, null, TODAY).label).toBe(
        "Forage The Hedgerow (1 trip left)",
      );
    });

    it("explains when the day's trips are spent", () => {
      const state = makeMeadowmereState({ foragesToday: FORAGES_PER_DAY });
      const result = interactionFor(state, HEDGEROW, null, TODAY);
      expect(result.action).toBeNull();
      expect(result.label).toBe("The Hedgerow — no forage trips left today");
    });

    it("shows a locked site as a place you can see but not use", () => {
      const state = makeMeadowmereState({ unlockedSiteIds: ["hedgerow"] });
      const result = interactionFor(state, RIVERBANK, null, TODAY);
      expect(result.action).toBeNull();
      expect(result.label).toBe("The Riverbank — you don’t know the way yet");
    });

    it("opens the site up once a quest unlocks it", () => {
      const state = makeMeadowmereState({
        unlockedSiteIds: ["hedgerow", "riverbank"],
      });
      expect(interactionFor(state, RIVERBANK, null, TODAY).action).toEqual({
        type: "forage",
        siteId: "riverbank",
      });
    });
  });

  describe("cottages and the stall", () => {
    it("always lets the farmer call on a neighbour", () => {
      const result = interactionFor(
        makeMeadowmereState(),
        COTTAGE,
        null,
        TODAY,
      );
      expect(result.action).toEqual({ type: "visit", neighbourId: "nessa" });
      expect(result.label).toBe("Call on Nessa");
    });

    it("always opens the seed stall", () => {
      const result = interactionFor(makeMeadowmereState(), STALL, null, TODAY);
      expect(result.action).toEqual({ type: "shop" });
      expect(result.label).toBe("Browse the seed stall");
    });
  });

  it("gives every interaction a label that stands alone as a button name", () => {
    const state = makeMeadowmereState({ plots: [makePlot()] });
    for (const feature of [PLOT_0, HEDGEROW, RIVERBANK, COTTAGE, STALL]) {
      expect(interactionFor(state, feature, null, TODAY).label).not.toBe("");
    }
  });
});
