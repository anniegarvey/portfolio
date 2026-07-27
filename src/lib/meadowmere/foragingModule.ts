import { FORAGES_PER_DAY, SITES } from "./catalog";
import { addItems } from "./inventory";
import type { ItemId, MeadowmereState, SiteId } from "./schema";

/** Forage trips left today. */
export function foragesLeft(state: MeadowmereState): number {
  return Math.max(0, FORAGES_PER_DAY - state.foragesToday);
}

export function canForage(state: MeadowmereState, siteId: SiteId): boolean {
  return state.unlockedSiteIds.includes(siteId) && foragesLeft(state) > 0;
}

/** What a trip into the wilds turned up, for the result card. */
export interface ForageResult {
  state: MeadowmereState;
  siteId: SiteId;
  itemId: ItemId;
  amount: number;
}

/**
 * Spends one forage trip at an unlocked site, turning up one or two of a
 * material drawn uniformly from that site's pool. Returns null when the site
 * is locked or the day's trips are used up.
 */
export function forageSite(
  state: MeadowmereState,
  siteId: SiteId,
  rng: () => number = Math.random,
): ForageResult | null {
  if (!canForage(state, siteId)) return null;

  const { materials } = SITES[siteId];
  const itemId = materials[Math.floor(rng() * materials.length)];
  const amount = rng() < 0.3 ? 2 : 1;

  return {
    state: addItems(
      { ...state, foragesToday: state.foragesToday + 1 },
      { [itemId]: amount },
    ),
    siteId,
    itemId,
    amount,
  };
}
