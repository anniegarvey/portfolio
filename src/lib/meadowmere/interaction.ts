import { CROPS, NEIGHBOURS, SITES } from "./catalog";
import { canPlant, canWater, isRipe } from "./farmingModule";
import { canForage, foragesLeft } from "./foragingModule";
import type { CropId, MeadowmereState, NeighbourId, SiteId } from "./schema";
import type { Feature } from "./valeMap";

/**
 * What activating a feature does. The world resolves these against the game
 * modules; nothing here touches state itself.
 */
export type InteractionAction =
  | { type: "plant"; plotId: string; cropId: CropId }
  | { type: "water"; plotId: string }
  | { type: "harvest"; plotId: string }
  | { type: "forage"; siteId: SiteId }
  | { type: "visit"; neighbourId: NeighbourId }
  | { type: "shop" };

export interface Interaction {
  /**
   * What pressing the action key does here, or null when the farmer can stand
   * and look at the feature but has nothing to do with it right now.
   */
  action: InteractionAction | null;
  /**
   * Imperative when there's something to do ("Water Plot 4"), explanatory when
   * there isn't ("Plot 4 — watered today"). Doubles as the accessible name of
   * the feature's button, so it must stand alone.
   */
  label: string;
}

function plotInteraction(
  state: MeadowmereState,
  index: number,
  selectedCropId: CropId | null,
  today: string,
): Interaction {
  const plot = state.plots[index];
  const name = `Plot ${index + 1}`;

  if (plot.planting === null) {
    if (selectedCropId === null) {
      return { action: null, label: `${name} — bare soil, no seed chosen` };
    }
    const crop = CROPS[selectedCropId];
    if (!canPlant(state, plot.id, selectedCropId)) {
      return { action: null, label: `${name} — no ${crop.name} seed left` };
    }
    return {
      action: { type: "plant", plotId: plot.id, cropId: selectedCropId },
      label: `Sow ${crop.name} in ${name}`,
    };
  }

  const crop = CROPS[plot.planting.cropId];
  if (isRipe(plot.planting, today)) {
    return {
      action: { type: "harvest", plotId: plot.id },
      label: `Harvest ${crop.name} from ${name}`,
    };
  }
  if (canWater(plot.planting, today)) {
    return {
      action: { type: "water", plotId: plot.id },
      label: `Water ${crop.name} in ${name}`,
    };
  }
  return { action: null, label: `${name} — ${crop.name}, watered today` };
}

function siteInteraction(state: MeadowmereState, siteId: SiteId): Interaction {
  const { name } = SITES[siteId];
  if (!state.unlockedSiteIds.includes(siteId)) {
    return { action: null, label: `${name} — you don’t know the way yet` };
  }
  if (!canForage(state, siteId)) {
    return {
      action: null,
      label: `${name} — no forage trips left today`,
    };
  }
  const left = foragesLeft(state);
  return {
    action: { type: "forage", siteId },
    label: `Forage ${name} (${left} ${left === 1 ? "trip" : "trips"} left)`,
  };
}

/**
 * The interaction available on a feature right now. Pure, so the world can ask
 * the same question for the tile the farmer faces and for every feature's
 * button without the two ever disagreeing.
 */
export function interactionFor(
  state: MeadowmereState,
  feature: Feature,
  selectedCropId: CropId | null,
  today: string,
): Interaction {
  switch (feature.kind) {
    case "plot":
      return plotInteraction(state, feature.index, selectedCropId, today);
    case "site":
      return siteInteraction(state, feature.siteId);
    case "cottage":
      return {
        action: { type: "visit", neighbourId: feature.neighbourId },
        label: `Call on ${NEIGHBOURS[feature.neighbourId].name}`,
      };
    case "stall":
      return { action: { type: "shop" }, label: "Browse the seed stall" };
  }
}
