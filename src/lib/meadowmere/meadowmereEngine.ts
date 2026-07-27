import { FORAGES_PER_DAY } from "./catalog";
import { daysBetween, isRipe } from "./farmingModule";
import type { CropId, MeadowmereState } from "./schema";

/** A crop that came ripe since the last time the player looked in. */
export interface RipenedEntry {
  cropId: CropId;
  count: number;
}

/** What changed overnight, for the daily digest. */
export interface DailyFarmReport {
  /** Calendar days since the last advance — more than one after time away. */
  daysPassed: number;
  ripened: RipenedEntry[];
  /** Plantings still coming along. */
  stillGrowing: number;
  foragesRefilled: number;
}

export interface AdvanceResult {
  state: MeadowmereState;
  /** Null when the advance already ran today. */
  report: DailyFarmReport | null;
}

/**
 * The daily Meadowmere advance, run at most once per calendar day.
 *
 * Growth needs no work here — a planting's stage is derived from its
 * `plantedDate`, so several days away ripen crops correctly without replaying
 * each missed day (ADR 0005). Watering and gifting self-expire because their
 * guards are date stamps. The only state to reset is the day's forage trips.
 */
export function advanceMeadowmereDay(
  state: MeadowmereState,
  today: string,
): AdvanceResult {
  if (state.lastAdvanceDate === today) return { state, report: null };

  const since = state.lastAdvanceDate;
  const plantings = state.plots.flatMap((plot) =>
    plot.planting ? [plot.planting] : [],
  );

  // Ripe now but not at the last advance — i.e. what the player has come back to.
  const ripenedCounts = new Map<CropId, number>();
  let stillGrowing = 0;
  for (const planting of plantings) {
    if (!isRipe(planting, today)) {
      stillGrowing += 1;
      continue;
    }
    if (since !== undefined && isRipe(planting, since)) continue;
    ripenedCounts.set(
      planting.cropId,
      (ripenedCounts.get(planting.cropId) ?? 0) + 1,
    );
  }

  return {
    state: { ...state, foragesToday: 0, lastAdvanceDate: today },
    report: {
      daysPassed:
        since === undefined ? 1 : Math.max(1, daysBetween(since, today)),
      ripened: [...ripenedCounts].map(([cropId, count]) => ({ cropId, count })),
      stillGrowing,
      foragesRefilled: Math.min(state.foragesToday, FORAGES_PER_DAY),
    },
  };
}
