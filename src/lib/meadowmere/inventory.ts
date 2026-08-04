import type { CropId, ItemId, MeadowmereState } from "./schema";

/** How many of an item are in the larder. */
export function itemCount(state: MeadowmereState, itemId: ItemId): number {
  return state.inventory[itemId] ?? 0;
}

/** How many seed packets of a crop are unplanted. */
export function seedCount(state: MeadowmereState, cropId: CropId): number {
  return state.seeds[cropId] ?? 0;
}

export function addItems(
  state: MeadowmereState,
  items: Partial<Record<ItemId, number>>,
): MeadowmereState {
  const inventory = { ...state.inventory };
  for (const [itemId, amount] of Object.entries(items)) {
    const id = itemId as ItemId;
    inventory[id] = (inventory[id] ?? 0) + amount;
  }
  return { ...state, inventory };
}

export function addSeeds(
  state: MeadowmereState,
  seeds: Partial<Record<CropId, number>>,
): MeadowmereState {
  const next = { ...state.seeds };
  for (const [cropId, amount] of Object.entries(seeds)) {
    const id = cropId as CropId;
    next[id] = (next[id] ?? 0) + amount;
  }
  return { ...state, seeds: next };
}

/** True when the larder holds at least the requested amount of every item. */
export function hasItems(
  state: MeadowmereState,
  items: Partial<Record<ItemId, number>>,
): boolean {
  return Object.entries(items).every(
    ([itemId, needed]) => itemCount(state, itemId as ItemId) >= needed,
  );
}

/**
 * Takes items out of the larder. Callers check `hasItems` first; counts are
 * floored at zero so a mismatch can never persist a negative stack.
 */
export function removeItems(
  state: MeadowmereState,
  items: Partial<Record<ItemId, number>>,
): MeadowmereState {
  const inventory = { ...state.inventory };
  for (const [itemId, amount] of Object.entries(items)) {
    const id = itemId as ItemId;
    inventory[id] = Math.max(0, (inventory[id] ?? 0) - amount);
  }
  return { ...state, inventory };
}
