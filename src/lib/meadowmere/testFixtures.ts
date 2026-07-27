import { vi } from "vitest";
import type { MeadowmereContextType } from "./context";
import type { MeadowmereState, Planting, Plot } from "./schema";

export const PLOT_ID_A = "00000000-0000-4000-8000-00000000000a";
export const PLOT_ID_B = "00000000-0000-4000-8000-00000000000b";

/** Builds a MeadowmereState with sensible defaults, overridable per test. */
export function makeMeadowmereState(
  overrides?: Partial<MeadowmereState>,
): MeadowmereState {
  return {
    plots: [makePlot()],
    seeds: {},
    inventory: {},
    neighbours: {
      nessa: { friendship: 0 },
      bram: { friendship: 0 },
      marigold: { friendship: 0 },
    },
    unlockedCropIds: ["parsnip"],
    unlockedSiteIds: ["hedgerow"],
    completedQuestIds: [],
    foragesToday: 0,
    ...overrides,
  };
}

export function makePlot(overrides?: Partial<Plot>): Plot {
  return { id: PLOT_ID_A, planting: null, ...overrides };
}

export function makePlanting(overrides?: Partial<Planting>): Planting {
  return {
    cropId: "parsnip",
    plantedDate: "2026-06-10",
    wateredDays: 0,
    ...overrides,
  };
}

/**
 * A complete useMeadowmere mock value with inert defaults, so component tests
 * override only what they exercise.
 */
export function makeMeadowmereContext(
  overrides?: Partial<MeadowmereContextType>,
): MeadowmereContextType {
  return {
    state: makeMeadowmereState(),
    notice: null,
    clearNotice: vi.fn(),
    dailyReport: null,
    clearDailyReport: vi.fn(),
    buySeed: vi.fn().mockReturnValue(false),
    plantSeed: vi.fn(),
    waterPlot: vi.fn(),
    harvestPlot: vi.fn(),
    forage: vi.fn(),
    giveGift: vi.fn(),
    claimQuest: vi.fn(),
    ...overrides,
  };
}
