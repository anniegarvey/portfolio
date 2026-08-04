import { describe, expect, it } from "vitest";
import {
  canPlant,
  canWater,
  daysBetween,
  daysGrown,
  growthProgress,
  growthStageOf,
  harvestPlot,
  harvestYield,
  isRipe,
  plantSeed,
  waterPlot,
} from "./farmingModule";
import {
  makeMeadowmereState,
  makePlanting,
  makePlot,
  PLOT_ID_A,
  PLOT_ID_B,
} from "./testFixtures";

describe("daysBetween", () => {
  it("counts whole days forward", () => {
    expect(daysBetween("2026-06-10", "2026-06-13")).toBe(3);
  });

  it("is zero for the same day", () => {
    expect(daysBetween("2026-06-10", "2026-06-10")).toBe(0);
  });

  it("counts backwards as negative", () => {
    expect(daysBetween("2026-06-13", "2026-06-10")).toBe(-3);
  });

  it("survives a daylight-saving change", () => {
    // UK clocks go forward on 2026-03-29.
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
  });
});

describe("daysGrown", () => {
  it("derives growth from the planting date", () => {
    const planting = makePlanting({ plantedDate: "2026-06-10" });
    expect(daysGrown(planting, "2026-06-14")).toBe(4);
  });

  it("floors at zero when the date is somehow in the future", () => {
    const planting = makePlanting({ plantedDate: "2026-06-10" });
    expect(daysGrown(planting, "2026-06-08")).toBe(0);
  });
});

describe("growthStageOf", () => {
  it("starts as a seed on the day it is planted", () => {
    // Pumpkin matures in 5 days.
    const planting = makePlanting({
      cropId: "pumpkin",
      plantedDate: "2026-06-10",
    });
    expect(growthStageOf(planting, "2026-06-10")).toBe("Seed");
  });

  it("moves through sprout and budding before ripening", () => {
    const planting = makePlanting({
      cropId: "pumpkin",
      plantedDate: "2026-06-10",
    });
    expect(growthStageOf(planting, "2026-06-12")).toBe("Sprout");
    expect(growthStageOf(planting, "2026-06-14")).toBe("Budding");
  });

  it("is ripe exactly on the maturity day", () => {
    const planting = makePlanting({
      cropId: "pumpkin",
      plantedDate: "2026-06-10",
    });
    expect(growthStageOf(planting, "2026-06-15")).toBe("Ripe");
  });

  it("stays ripe after time away rather than stalling or withering", () => {
    const planting = makePlanting({ plantedDate: "2026-06-10" });
    expect(growthStageOf(planting, "2026-07-20")).toBe("Ripe");
    expect(isRipe(planting, "2026-07-20")).toBe(true);
  });

  it("never reports Ripe from the unripe branch", () => {
    // Guards the Math.min clamp: the final unripe day must not spill over.
    const planting = makePlanting({
      cropId: "moonpetal", // 7 days
      plantedDate: "2026-06-10",
    });
    expect(growthStageOf(planting, "2026-06-16")).toBe("Budding");
  });
});

describe("growthProgress", () => {
  it("reports the fraction of the way to ripe", () => {
    const planting = makePlanting({
      cropId: "pumpkin",
      plantedDate: "2026-06-10",
    });
    expect(growthProgress(planting, "2026-06-11")).toBeCloseTo(0.2);
  });

  it("caps at 1 once ripe", () => {
    const planting = makePlanting({ plantedDate: "2026-06-10" });
    expect(growthProgress(planting, "2026-06-30")).toBe(1);
  });
});

describe("harvestYield", () => {
  it("returns the base yield when never watered", () => {
    expect(harvestYield(makePlanting({ wateredDays: 0 }))).toBe(1);
  });

  it("adds one produce per watered day", () => {
    expect(harvestYield(makePlanting({ wateredDays: 1 }))).toBe(2);
  });

  it("caps the bonus at the crop's maturity days", () => {
    // Parsnip matures in 2 days, base yield 1 — so 3 is the ceiling.
    expect(harvestYield(makePlanting({ wateredDays: 9 }))).toBe(3);
  });
});

describe("canWater", () => {
  it("allows watering a planting untouched today", () => {
    expect(canWater(makePlanting(), "2026-06-11")).toBe(true);
  });

  it("refuses a second watering the same day", () => {
    const planting = makePlanting({ lastWateredDate: "2026-06-11" });
    expect(canWater(planting, "2026-06-11")).toBe(false);
  });
});

describe("plantSeed", () => {
  it("sows a seed into an empty plot", () => {
    const state = makeMeadowmereState({ seeds: { parsnip: 2 } });
    const next = plantSeed(state, PLOT_ID_A, "parsnip", "2026-06-10");

    expect(next.plots[0].planting).toEqual({
      cropId: "parsnip",
      plantedDate: "2026-06-10",
      wateredDays: 0,
    });
    expect(next.seeds.parsnip).toBe(1);
  });

  it("refuses when there are no seed packets left", () => {
    const state = makeMeadowmereState({ seeds: { parsnip: 0 } });
    expect(plantSeed(state, PLOT_ID_A, "parsnip", "2026-06-10")).toBe(state);
  });

  it("refuses when the crop is not unlocked yet", () => {
    const state = makeMeadowmereState({
      seeds: { pumpkin: 3 },
      unlockedCropIds: ["parsnip"],
    });
    expect(plantSeed(state, PLOT_ID_A, "pumpkin", "2026-06-10")).toBe(state);
  });

  it("refuses when the plot is already planted", () => {
    const state = makeMeadowmereState({
      seeds: { parsnip: 2 },
      plots: [makePlot({ planting: makePlanting() })],
    });
    expect(plantSeed(state, PLOT_ID_A, "parsnip", "2026-06-10")).toBe(state);
  });

  it("refuses when the plot does not exist", () => {
    const state = makeMeadowmereState({ seeds: { parsnip: 2 } });
    expect(plantSeed(state, PLOT_ID_B, "parsnip", "2026-06-10")).toBe(state);
  });
});

describe("canPlant", () => {
  it("is true for an empty plot with an unlocked crop in stock", () => {
    const state = makeMeadowmereState({ seeds: { parsnip: 1 } });
    expect(canPlant(state, PLOT_ID_A, "parsnip")).toBe(true);
  });
});

describe("waterPlot", () => {
  it("records a watered day", () => {
    const state = makeMeadowmereState({
      plots: [makePlot({ planting: makePlanting() })],
    });
    const next = waterPlot(state, PLOT_ID_A, "2026-06-11");

    expect(next.plots[0].planting?.wateredDays).toBe(1);
    expect(next.plots[0].planting?.lastWateredDate).toBe("2026-06-11");
  });

  it("ignores a second watering the same day", () => {
    const state = makeMeadowmereState({
      plots: [makePlot({ planting: makePlanting() })],
    });
    const once = waterPlot(state, PLOT_ID_A, "2026-06-11");
    expect(waterPlot(once, PLOT_ID_A, "2026-06-11")).toBe(once);
  });

  it("waters again the next day", () => {
    const state = makeMeadowmereState({
      plots: [makePlot({ planting: makePlanting() })],
    });
    const once = waterPlot(state, PLOT_ID_A, "2026-06-11");
    const twice = waterPlot(once, PLOT_ID_A, "2026-06-12");
    expect(twice.plots[0].planting?.wateredDays).toBe(2);
  });

  it("ignores an empty plot", () => {
    const state = makeMeadowmereState();
    expect(waterPlot(state, PLOT_ID_A, "2026-06-11")).toBe(state);
  });

  it("ignores an unknown plot", () => {
    const state = makeMeadowmereState({
      plots: [makePlot({ planting: makePlanting() })],
    });
    expect(waterPlot(state, PLOT_ID_B, "2026-06-11")).toBe(state);
  });
});

describe("harvestPlot", () => {
  it("moves produce to the larder and clears the plot", () => {
    const state = makeMeadowmereState({
      plots: [
        makePlot({
          planting: makePlanting({ plantedDate: "2026-06-10", wateredDays: 1 }),
        }),
      ],
    });
    const result = harvestPlot(state, PLOT_ID_A, "2026-06-12");

    expect(result).not.toBeNull();
    expect(result?.cropId).toBe("parsnip");
    expect(result?.amount).toBe(2);
    expect(result?.state.inventory["parsnip-root"]).toBe(2);
    expect(result?.state.plots[0].planting).toBeNull();
  });

  it("adds to produce already in the larder", () => {
    const state = makeMeadowmereState({
      inventory: { "parsnip-root": 5 },
      plots: [
        makePlot({ planting: makePlanting({ plantedDate: "2026-06-10" }) }),
      ],
    });
    const result = harvestPlot(state, PLOT_ID_A, "2026-06-12");
    expect(result?.state.inventory["parsnip-root"]).toBe(6);
  });

  it("returns null when the crop is not ripe", () => {
    const state = makeMeadowmereState({
      plots: [
        makePlot({ planting: makePlanting({ plantedDate: "2026-06-10" }) }),
      ],
    });
    expect(harvestPlot(state, PLOT_ID_A, "2026-06-11")).toBeNull();
  });

  it("returns null for an empty plot", () => {
    expect(
      harvestPlot(makeMeadowmereState(), PLOT_ID_A, "2026-06-12"),
    ).toBeNull();
  });

  it("returns null for an unknown plot", () => {
    const state = makeMeadowmereState({
      plots: [
        makePlot({ planting: makePlanting({ plantedDate: "2026-06-10" }) }),
      ],
    });
    expect(harvestPlot(state, PLOT_ID_B, "2026-06-12")).toBeNull();
  });
});
