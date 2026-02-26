import { clear, createStore, del, get, keys, set } from "idb-keyval";
import type {
  Activity,
  DayPlan,
  EnergyCost,
  EnergyTypeConfig,
  LegacyPlannedActivity,
  PlannedInstance,
  ZoneConfig,
} from "./schema";

/**
 * IndexedDB store for energy planner data
 * Uses idb-keyval for simple key-value storage with automatic serialization
 */
const store = createStore("energy-planner-db", "data");

// Storage keys
const KEYS = {
  activities: "activities", // Single normalised activities store: Activity[]
  types: "types",
  zones: "zones",
  // Legacy keys — read-only, used during migration
  _legacyOneOff: "one-off-activities",
  _legacyRepeating: "repeating-activities",
} as const;

/**
 * Storage-optimized DayPlan that omits redundant fields:
 * - date: derived from the storage key
 * - plannedInstances: omitted entirely if empty
 */
export interface StoredDayPlan {
  plannedInstances?: PlannedInstance[];
  dailyCapacity: EnergyCost;
  activityOrder?: string[]; // Persisted order of instance IDs
}

/**
 * Legacy stored format, used only during migration.
 * Old day plans stored full PlannedActivity objects.
 */
interface LegacyStoredDayPlan {
  activities?: LegacyPlannedActivity[];
  dailyCapacity: EnergyCost;
  activityOrder?: string[];
}

// === Activities ===

export async function fetchActivities(): Promise<Activity[]> {
  const activities = await get<Activity[]>(KEYS.activities, store);
  return activities ?? [];
}

export async function storeActivities(activities: Activity[]): Promise<void> {
  await set(KEYS.activities, activities, store);
}

// === Energy Types ===

export async function fetchEnergyTypes(): Promise<
  EnergyTypeConfig[] | undefined
> {
  return get<EnergyTypeConfig[]>(KEYS.types, store);
}

export async function storeEnergyTypes(
  types: EnergyTypeConfig[],
): Promise<void> {
  await set(KEYS.types, types, store);
}

// === Zones ===

export async function fetchZones(): Promise<ZoneConfig[] | undefined> {
  return get<ZoneConfig[]>(KEYS.zones, store);
}

export async function storeZones(zones: ZoneConfig[]): Promise<void> {
  await set(KEYS.zones, zones, store);
}

// === Day Plans ===

function fetchDayPlanKey(date: string): string {
  return `day-${date}`;
}

/**
 * Convert a full DayPlan to storage-optimized format
 */
function toStoredDayPlan(plan: DayPlan): StoredDayPlan {
  const stored: StoredDayPlan = {
    dailyCapacity: plan.dailyCapacity,
  };

  if (plan.plannedInstances && plan.plannedInstances.length > 0) {
    stored.plannedInstances = plan.plannedInstances;
  }

  if (plan.activityOrder && plan.activityOrder.length > 0) {
    stored.activityOrder = plan.activityOrder;
  }

  return stored;
}

/**
 * Convert storage format to full DayPlan
 */
function fromStoredDayPlan(date: string, stored: StoredDayPlan): DayPlan {
  return {
    date,
    plannedInstances: stored.plannedInstances ?? [],
    dailyCapacity: stored.dailyCapacity,
    activityOrder: stored.activityOrder,
  };
}

export async function fetchDayPlan(date: string): Promise<DayPlan | null> {
  const stored = await get<StoredDayPlan>(fetchDayPlanKey(date), store);
  if (!stored) return null;
  return fromStoredDayPlan(date, stored);
}

export async function storeDayPlan(date: string, plan: DayPlan): Promise<void> {
  await set(fetchDayPlanKey(date), toStoredDayPlan(plan), store);
}

export async function deleteDayPlan(date: string): Promise<void> {
  await del(fetchDayPlanKey(date), store);
}

/**
 * Get all dates that have stored day plans
 */
export async function fetchAllDayPlanDates(): Promise<string[]> {
  const allKeys = await keys<string>(store);
  const prefix = "day-";
  return allKeys
    .filter((key) => key.startsWith(prefix))
    .map((key) => key.slice(prefix.length))
    .sort();
}

/**
 * Clear all data from the store (for testing)
 */
export async function clearAll(): Promise<void> {
  await clear(store);
}

// === Migration ===

/**
 * Migrates storage from the old split format (one-off / repeating activity
 * lists, full PlannedActivity objects in day plans) to the normalised format
 * (single activities list, lightweight PlannedInstance objects in day plans).
 *
 * Safe to call on every startup — detects old keys and is idempotent.
 */
export async function migrateStorageIfNeeded(): Promise<void> {
  const [legacyOneOff, legacyRepeating] = await Promise.all([
    get<Activity[]>(KEYS._legacyOneOff, store),
    get<Activity[]>(KEYS._legacyRepeating, store),
  ]);

  const hasLegacyData = legacyOneOff != null || legacyRepeating != null;
  if (!hasLegacyData) return;

  // Merge both legacy lists into the new single activities store.
  // If the new store already has data (partial migration), append only missing IDs.
  const existingActivities = await fetchActivities();
  const existingIds = new Set(existingActivities.map((a) => a.id));

  const legacyAll = [...(legacyOneOff ?? []), ...(legacyRepeating ?? [])];
  const newActivities = legacyAll.filter((a) => !existingIds.has(a.id));

  if (newActivities.length > 0) {
    await storeActivities([...existingActivities, ...newActivities]);
  }

  // Migrate each day plan from full PlannedActivity format to PlannedInstance format.
  // We build a lookup from legacy activity ID → canonical Activity record.
  const allActivities = [...existingActivities, ...newActivities];
  const activityById = new Map(allActivities.map((a) => [a.id, a]));

  const allDates = await fetchAllDayPlanDates();
  await Promise.all(
    allDates.map(async (date) => {
      const raw = await get<LegacyStoredDayPlan | StoredDayPlan>(
        fetchDayPlanKey(date),
        store,
      );
      if (!raw) return;

      // Already migrated if it has plannedInstances
      if ("plannedInstances" in raw) return;

      const legacy = raw as LegacyStoredDayPlan;
      const legacyActivities = legacy.activities ?? [];

      const plannedInstances: PlannedInstance[] = legacyActivities
        .filter((la) => !la.isProjected) // Drop projected (virtual) instances — they'll be re-projected
        .map((la): PlannedInstance => {
          // The source activity is either the repeatingActivityId (concrete
          // instance of a repeating activity) or the activity's own id (one-off).
          const sourceActivityId = la.repeatingActivityId ?? la.id;

          // If the source activity exists in our store, use its id.
          // If not (e.g. it was deleted), fall back to the id embedded in the plan.
          const resolvedId = activityById.has(sourceActivityId)
            ? sourceActivityId
            : la.id;

          return {
            id: la.id,
            sourceActivityId: resolvedId,
            zoneId: la.zoneId,
            completed: la.completed ?? false,
          };
        });

      const migrated: StoredDayPlan = {
        dailyCapacity: legacy.dailyCapacity,
        plannedInstances:
          plannedInstances.length > 0 ? plannedInstances : undefined,
        activityOrder: legacy.activityOrder,
      };

      await set(fetchDayPlanKey(date), migrated, store);
    }),
  );

  // Remove the legacy keys now that migration is complete.
  await Promise.all([
    del(KEYS._legacyOneOff, store),
    del(KEYS._legacyRepeating, store),
  ]);
}
