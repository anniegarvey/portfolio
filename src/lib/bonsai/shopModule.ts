import { SHOP_CATALOG } from "./catalog";
import type {
  BackgroundId,
  BonsaiGameState,
  FertiliserId,
  PotId,
  ShopItemId,
  SpeciesId,
  StandId,
  ToolId,
} from "./schema";

/**
 * Adds itemId to inventory. Caller is responsible for spending points before
 * calling this — shopModule has no knowledge of the points system.
 * Returns the unchanged state if itemId is not in the catalog.
 */
export function buyItem(
  state: BonsaiGameState,
  itemId: ShopItemId,
): BonsaiGameState {
  const item = SHOP_CATALOG.find((i) => i.id === itemId);
  if (!item) return state;

  const inv = { ...state.inventory };
  switch (item.category) {
    case "species":
      inv.ownedSpeciesIds = [...inv.ownedSpeciesIds, itemId as SpeciesId];
      break;
    case "tool":
      inv.ownedToolIds = [...inv.ownedToolIds, itemId as ToolId];
      break;
    case "fertiliser":
      inv.ownedFertiliserIds = [
        ...inv.ownedFertiliserIds,
        itemId as FertiliserId,
      ];
      break;
    case "pot":
      inv.ownedPotIds = [...inv.ownedPotIds, itemId as PotId];
      break;
    case "stand":
      inv.ownedStandIds = [...inv.ownedStandIds, itemId as StandId];
      break;
    case "background":
      inv.ownedBackgroundIds = [
        ...inv.ownedBackgroundIds,
        itemId as BackgroundId,
      ];
      break;
  }
  return { ...state, inventory: inv };
}
