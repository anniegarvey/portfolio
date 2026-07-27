import { describe, expect, it } from "vitest";
import { FORAGES_PER_DAY } from "./catalog";
import { advanceMeadowmereDay } from "./meadowmereEngine";
import {
  makeMeadowmereState,
  makePlanting,
  makePlot,
  PLOT_ID_B,
} from "./testFixtures";

const TODAY = "2026-06-12";

describe("advanceMeadowmereDay", () => {
  it("does nothing when it has already run today", () => {
    const state = makeMeadowmereState({ lastAdvanceDate: TODAY });
    const result = advanceMeadowmereDay(state, TODAY);

    expect(result.state).toBe(state);
    expect(result.report).toBeNull();
  });

  it("refills the day's forage trips", () => {
    const state = makeMeadowmereState({
      foragesToday: FORAGES_PER_DAY,
      lastAdvanceDate: "2026-06-11",
    });
    const result = advanceMeadowmereDay(state, TODAY);

    expect(result.state.foragesToday).toBe(0);
    expect(result.report?.foragesRefilled).toBe(FORAGES_PER_DAY);
    expect(result.state.lastAdvanceDate).toBe(TODAY);
  });

  it("reports only the trips that were actually spent", () => {
    const state = makeMeadowmereState({
      foragesToday: 1,
      lastAdvanceDate: "2026-06-11",
    });
    expect(advanceMeadowmereDay(state, TODAY).report?.foragesRefilled).toBe(1);
  });

  it("reports crops that came ripe overnight", () => {
    const state = makeMeadowmereState({
      lastAdvanceDate: "2026-06-11",
      plots: [
        makePlot({ planting: makePlanting({ plantedDate: "2026-06-10" }) }),
      ],
    });
    expect(advanceMeadowmereDay(state, TODAY).report?.ripened).toEqual([
      { cropId: "parsnip", count: 1 },
    ]);
  });

  it("groups several plots of the same crop", () => {
    const state = makeMeadowmereState({
      lastAdvanceDate: "2026-06-11",
      plots: [
        makePlot({ planting: makePlanting({ plantedDate: "2026-06-10" }) }),
        makePlot({
          id: PLOT_ID_B,
          planting: makePlanting({ plantedDate: "2026-06-10" }),
        }),
      ],
    });
    expect(advanceMeadowmereDay(state, TODAY).report?.ripened).toEqual([
      { cropId: "parsnip", count: 2 },
    ]);
  });

  it("does not re-report a crop that was already ripe yesterday", () => {
    const state = makeMeadowmereState({
      lastAdvanceDate: "2026-06-11",
      plots: [
        makePlot({ planting: makePlanting({ plantedDate: "2026-06-08" }) }),
      ],
    });
    expect(advanceMeadowmereDay(state, TODAY).report?.ripened).toEqual([]);
  });

  it("counts plantings that are still coming along", () => {
    const state = makeMeadowmereState({
      lastAdvanceDate: "2026-06-11",
      plots: [
        makePlot({
          planting: makePlanting({
            cropId: "pumpkin",
            plantedDate: "2026-06-11",
          }),
        }),
        makePlot({ id: PLOT_ID_B, planting: null }),
      ],
    });
    const report = advanceMeadowmereDay(state, TODAY).report;

    expect(report?.stillGrowing).toBe(1);
    expect(report?.ripened).toEqual([]);
  });

  it("collapses several days away into one advance and still ripens", () => {
    const state = makeMeadowmereState({
      lastAdvanceDate: "2026-06-05",
      plots: [
        makePlot({ planting: makePlanting({ plantedDate: "2026-06-05" }) }),
      ],
    });
    const result = advanceMeadowmereDay(state, TODAY);

    expect(result.report?.daysPassed).toBe(7);
    expect(result.report?.ripened).toEqual([{ cropId: "parsnip", count: 1 }]);
  });

  it("treats a first-ever advance as one day", () => {
    const state = makeMeadowmereState({
      lastAdvanceDate: undefined,
      plots: [
        makePlot({ planting: makePlanting({ plantedDate: "2026-06-10" }) }),
      ],
    });
    const result = advanceMeadowmereDay(state, TODAY);

    expect(result.report?.daysPassed).toBe(1);
    expect(result.report?.ripened).toEqual([{ cropId: "parsnip", count: 1 }]);
  });
});
