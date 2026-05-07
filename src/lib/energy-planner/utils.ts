import type { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { EnergyCost, EnergyTypeConfig, ResolvedActivity } from "./schema";

/**
 * Calculates the new order of items after a drag and drop operation.
 * Returns null if no reordering is needed (e.g. invalid drop or same position).
 */
export function getReorderedItems<T>(
  items: T[],
  event: {
    active: { id: UniqueIdentifier | number };
    over: { id?: UniqueIdentifier | number } | null;
  },
  idGetter: (item: T) => string,
): T[] | null {
  const { active, over } = event;
  const activeId = active.id;
  const overId = over?.id;
  if (!overId || activeId === overId) {
    return null;
  }

  const oldIndex = items.findIndex((item) => idGetter(item) === activeId);
  const newIndex = items.findIndex((item) => idGetter(item) === overId);

  if (oldIndex !== -1 && newIndex !== -1) {
    return arrayMove(items, oldIndex, newIndex);
  }

  return null;
}

export function validateEnergyCapacity(
  resolvedActivities: ResolvedActivity[],
  energyTypes: EnergyTypeConfig[],
  dailyCapacity: EnergyCost,
): { usage: EnergyCost; warnings: string[] } {
  const baseline = Object.fromEntries(energyTypes.map((t) => [t.id, 0]));

  const usage = resolvedActivities.reduce((acc, { activity }) => {
    for (const key in activity.energyCost) {
      acc[key] = (acc[key] ?? 0) + activity.energyCost[key];
    }
    return acc;
  }, baseline as EnergyCost);

  const warnings = energyTypes
    .filter((type) => (usage[type.id] ?? 0) > (dailyCapacity[type.id] ?? 0))
    .map((type) => type.label);

  return { usage, warnings };
}
