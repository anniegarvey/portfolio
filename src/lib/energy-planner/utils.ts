import type { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type {
  Activity,
  EnergyCost,
  EnergyTypeConfig,
  ResolvedActivity,
  ZoneConfig,
} from "./schema";

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

/**
 * Filters activities by a case-insensitive substring match against their
 * title and description. An empty or whitespace-only query returns the list
 * unchanged.
 */
export function filterActivities(
  activities: Activity[],
  query: string,
): Activity[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return activities;

  return activities.filter((activity) => {
    const haystack =
      `${activity.title} ${activity.description ?? ""}`.toLowerCase();
    return haystack.includes(trimmed);
  });
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

/**
 * Sort repeating activities for the Available Activities modal:
 * 1. Activities with no default zone (or a dangling defaultZoneId pointing at
 *    a deleted zone) sort first.
 * 2. Then grouped by defaultZoneId in current zone order.
 * 3. Within each bucket, original (stored) order is preserved.
 */
export function sortRepeatingByZone(
  activities: Activity[],
  zones: ZoneConfig[],
): Activity[] {
  const zoneIndex = new Map(zones.map((z, i) => [z.id, i]));
  const bucketOf = (a: Activity): number => {
    const id = a.repeatConfig?.defaultZoneId;
    if (!id) return -1;
    const idx = zoneIndex.get(id);
    return idx === undefined ? -1 : idx;
  };
  return activities
    .map((activity, index) => ({ activity, index }))
    .sort((x, y) => {
      const diff = bucketOf(x.activity) - bucketOf(y.activity);
      return diff !== 0 ? diff : x.index - y.index;
    })
    .map(({ activity }) => activity);
}

/**
 * Computes the updated repeating-activities list after a drag in the
 * Available Activities modal. Handles both within-zone reorders and
 * cross-zone moves (which update the dragged activity's defaultZoneId
 * to the bucket it landed in). Returns null when no update is needed.
 */
export function applyRepeatingDrag(
  sortedActivities: Activity[],
  event: {
    active: { id: UniqueIdentifier | number };
    over: { id?: UniqueIdentifier | number } | null;
  },
  zones: ZoneConfig[],
): Activity[] | null {
  const newDisplayed = getReorderedItems(sortedActivities, event, (a) => a.id);
  if (!newDisplayed) return null;

  const movedId = String(event.active.id);
  const newIndex = newDisplayed.findIndex((a) => a.id === movedId);
  const moved = newDisplayed[newIndex];
  if (!moved?.repeatConfig) return null;

  const validZoneIds = new Set(zones.map((z) => z.id));
  const effectiveZone = (a: Activity): string | undefined => {
    const id = a.repeatConfig?.defaultZoneId;
    return id && validZoneIds.has(id) ? id : undefined;
  };

  // Prefer the previous neighbor: dropping below an item lands in its bucket.
  const neighbor = newDisplayed[newIndex - 1] ?? newDisplayed[newIndex + 1];
  const targetZoneId = neighbor ? effectiveZone(neighbor) : undefined;
  const currentZoneId = effectiveZone(moved);

  if (targetZoneId === currentZoneId) return newDisplayed;

  return newDisplayed.map((a) =>
    a.id === movedId && a.repeatConfig
      ? {
          ...a,
          repeatConfig: { ...a.repeatConfig, defaultZoneId: targetZoneId },
        }
      : a,
  );
}
