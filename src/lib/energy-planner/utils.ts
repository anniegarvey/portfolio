import type { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  type Activity,
  DEFAULT_HELPERS,
  type EnergyCost,
  type EnergyTypeConfig,
  type ResolvedActivity,
  type ZoneConfig,
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
 * Filters activities by a case-insensitive search against their title and
 * description. The query is split on whitespace into separate terms; an
 * activity matches only if every term is found (in either field). An empty or
 * whitespace-only query returns the list unchanged.
 */
export function filterActivities(
  activities: Activity[],
  query: string,
): Activity[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return activities;

  return activities.filter((activity) => {
    const haystack =
      `${activity.title} ${activity.description ?? ""}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
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

// Start difficulty (0-10) at or above which the planner offers getting-started help
export const HARD_TO_START_THRESHOLD = 6;

export function isHardToStart(activity: Activity): boolean {
  return activity.factors.initiationDifficulty >= HARD_TO_START_THRESHOLD;
}

// The default helpers followed by every other helper used so far, without
// repeats (ignoring case), so the form offers everything tried before.
export function getHelperOptions(usedHelpers: string[]): string[] {
  const options = new Map<string, string>();
  for (const helper of [...DEFAULT_HELPERS, ...usedHelpers]) {
    const name = helper.trim();
    const key = name.toLowerCase();
    if (name && !options.has(key)) options.set(key, name);
  }
  return [...options.values()];
}

// True when the planner runs as the installed app rather than in a browser tab
export function isInstalledApp(): boolean {
  return Boolean(window.matchMedia?.("(display-mode: standalone)").matches);
}

// ─── Ideas shelf ─────────────────────────────────────────────────────────────

// Drag ids for ideas on the shelf, so they can't be mistaken for planned instances
export const IDEA_DRAG_PREFIX = "idea:";

export type IdeaSort =
  | "newest"
  | "oldest"
  | "least-energy"
  | "most-energy"
  | `helper:${string}`;

export function getTotalEnergy(activity: Activity): number {
  return Object.values(activity.energyCost).reduce((sum, v) => sum + v, 0);
}

const createdTime = (activity: Activity) =>
  new Date(activity.createdAt).getTime();

// Ideas are unplanned one-off activities. A helper sort brings the ideas that
// use that helper to the front; ties fall back to newest first.
export function sortIdeas(ideas: Activity[], sort: IdeaSort): Activity[] {
  const newest = (a: Activity, b: Activity) => createdTime(b) - createdTime(a);
  const compare = (a: Activity, b: Activity): number => {
    if (sort === "oldest") return -newest(a, b);
    if (sort === "least-energy" || sort === "most-energy") {
      const diff = getTotalEnergy(a) - getTotalEnergy(b);
      return (sort === "least-energy" ? diff : -diff) || newest(a, b);
    }
    if (sort.startsWith("helper:")) {
      const helper = sort.slice("helper:".length).toLowerCase();
      const uses = (x: Activity) =>
        x.helpers?.some((h) => h.toLowerCase() === helper) ? 0 : 1;
      return uses(a) - uses(b) || newest(a, b);
    }
    return newest(a, b);
  };
  return [...ideas].sort(compare);
}

const DAY_MS = 24 * 60 * 60 * 1000;

const localMidnight = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

// How long an idea has been waiting, in calendar days, shown in the largest
// whole unit that fits
export function formatIdeaAge(createdAt: Date, now: Date): string {
  const days = Math.round(
    (localMidnight(now) - localMidnight(new Date(createdAt))) / DAY_MS,
  );
  if (days < 1) return "Today";
  if (days < 14) return days === 1 ? "1 day" : `${days} days`;
  if (days < 60) return `${Math.floor(days / 7)} weeks`;
  if (days < 730) return `${Math.floor(days / 30)} months`;
  return `${Math.floor(days / 365)} years`;
}
