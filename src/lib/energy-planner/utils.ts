import type { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { EnergyCost, ResolvedActivity } from "./schema";

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

export const calculateEnergyUsage = (
  resolvedActivities: ResolvedActivity[],
): EnergyCost => {
  return resolvedActivities.reduce(
    (acc, { activity }) => {
      for (const key in activity.energyCost) {
        acc[key] = (acc[key] || 0) + activity.energyCost[key];
      }
      return acc;
    },
    { physical: 0, social: 0, executive: 0 } as EnergyCost,
  );
};
