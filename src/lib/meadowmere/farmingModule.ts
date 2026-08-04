import { CROPS, GROWTH_STAGES, type GrowthStage } from "./catalog";
import { addItems, seedCount } from "./inventory";
import type { CropId, MeadowmereState, Planting } from "./schema";

/**
 * Whole days between two local date strings. Both are read at midday so a
 * daylight-saving shift between them can't round the difference off by a day.
 */
export function daysBetween(from: string, to: string): number {
  const start = new Date(`${from}T12:00:00`).getTime();
  const end = new Date(`${to}T12:00:00`).getTime();
  return Math.round((end - start) / 86_400_000);
}

/**
 * Days a planting has been in the ground. Derived from `plantedDate`, never
 * counted up day by day — so time away from the game never stalls growth
 * (see ADR 0005).
 */
export function daysGrown(planting: Planting, today: string): number {
  return Math.max(0, daysBetween(planting.plantedDate, today));
}

export function growthStageOf(planting: Planting, today: string): GrowthStage {
  const { daysToMature } = CROPS[planting.cropId];
  const grown = daysGrown(planting, today);
  if (grown >= daysToMature) return "Ripe";
  const unripeStages = GROWTH_STAGES.length - 1;
  const index = Math.floor((grown / daysToMature) * unripeStages);
  return GROWTH_STAGES[Math.min(index, unripeStages - 1)];
}

export function isRipe(planting: Planting, today: string): boolean {
  return growthStageOf(planting, today) === "Ripe";
}

/** Progress towards ripe, 0–1, for the plot's growth bar. */
export function growthProgress(planting: Planting, today: string): number {
  const { daysToMature } = CROPS[planting.cropId];
  return Math.min(1, daysGrown(planting, today) / daysToMature);
}

/**
 * Produce a harvest will yield: the crop's base plus one for every day the
 * planting was watered, capped so a fully-watered crop roughly doubles.
 */
export function harvestYield(planting: Planting): number {
  const crop = CROPS[planting.cropId];
  return crop.baseYield + Math.min(planting.wateredDays, crop.daysToMature);
}

export function canWater(planting: Planting, today: string): boolean {
  return planting.lastWateredDate !== today;
}

/** True when the plot is empty, the crop is unlocked, and a seed packet is spare. */
export function canPlant(
  state: MeadowmereState,
  plotId: string,
  cropId: CropId,
): boolean {
  const plot = state.plots.find((p) => p.id === plotId);
  if (plot === undefined || plot.planting !== null) return false;
  if (!state.unlockedCropIds.includes(cropId)) return false;
  return seedCount(state, cropId) > 0;
}

/** Sows one seed packet into an empty plot. Returns state unchanged if it can't. */
export function plantSeed(
  state: MeadowmereState,
  plotId: string,
  cropId: CropId,
  today: string,
): MeadowmereState {
  if (!canPlant(state, plotId, cropId)) return state;
  return {
    ...state,
    seeds: { ...state.seeds, [cropId]: seedCount(state, cropId) - 1 },
    plots: state.plots.map((plot) =>
      plot.id === plotId
        ? {
            ...plot,
            planting: {
              cropId,
              plantedDate: today,
              wateredDays: 0,
            },
          }
        : plot,
    ),
  };
}

/**
 * Waters a planting, once per calendar day. Each watered day adds a produce
 * to the eventual harvest — watering is a bonus, never a requirement.
 */
export function waterPlot(
  state: MeadowmereState,
  plotId: string,
  today: string,
): MeadowmereState {
  const plot = state.plots.find((p) => p.id === plotId);
  if (!(plot?.planting && canWater(plot.planting, today))) return state;
  return {
    ...state,
    plots: state.plots.map((p) =>
      p.id === plotId && p.planting
        ? {
            ...p,
            planting: {
              ...p.planting,
              wateredDays: p.planting.wateredDays + 1,
              lastWateredDate: today,
            },
          }
        : p,
    ),
  };
}

/** What a harvest produced, for the toast that follows it. */
export interface HarvestResult {
  state: MeadowmereState;
  cropId: CropId;
  amount: number;
}

/**
 * Lifts a ripe planting, moving its produce to the larder and clearing the
 * plot. Returns null when the plot is empty or not yet ripe.
 */
export function harvestPlot(
  state: MeadowmereState,
  plotId: string,
  today: string,
): HarvestResult | null {
  const plot = state.plots.find((p) => p.id === plotId);
  if (!(plot?.planting && isRipe(plot.planting, today))) return null;

  const { planting } = plot;
  const crop = CROPS[planting.cropId];
  const amount = harvestYield(planting);
  const cleared: MeadowmereState = {
    ...state,
    plots: state.plots.map((p) =>
      p.id === plotId ? { ...p, planting: null } : p,
    ),
  };
  return {
    state: addItems(cleared, { [crop.produceId]: amount }),
    cropId: planting.cropId,
    amount,
  };
}
