import { clear, createStore, del, get, keys, set } from "idb-keyval";
import type {
  Activity,
  DayPlan,
  EnergyCost,
  EnergyTypeConfig,
  PlannedActivity,
  ZoneConfig,
} from "./schema";

/**
 * IndexedDB store for energy planner data
 * Uses idb-keyval for simple key-value storage with automatic serialization
 */
const store = createStore("energy-planner-db", "data");

// Storage keys
const KEYS = {
  oneOffActivities: "one-off-activities",
  repeatingActivities: "repeating-activities",
  types: "types",
  zones: "zones",
} as const;

/**
 * Storage-optimized DayPlan that omits redundant fields:
 * - date: derived from the storage key
 * - activities: omitted entirely if empty
 */
export interface StoredDayPlan {
  activities?: PlannedActivity[];
  dailyCapacity: EnergyCost;
}

// === One-Off Activities ===

export async function fetchOneOffActivities(): Promise<Activity[]> {
  const activities = await get<Activity[]>(KEYS.oneOffActivities, store);
  return activities ?? [];
}

export async function storeOneOffActivities(
  activities: Activity[],
): Promise<void> {
  await set(KEYS.oneOffActivities, activities, store);
}

// === Repeating Activities ===

export async function fetchRepeatingActivities(): Promise<Activity[]> {
  const activities = await get<Activity[]>(KEYS.repeatingActivities, store);
  return activities ?? [];
}

export async function storeRepeatingActivities(
  activities: Activity[],
): Promise<void> {
  await set(KEYS.repeatingActivities, activities, store);
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

  // Only include activities if there are any
  if (plan.activities && plan.activities.length > 0) {
    stored.activities = plan.activities;
  }

  return stored;
}

/**
 * Convert storage format to full DayPlan
 */
function fromStoredDayPlan(date: string, stored: StoredDayPlan): DayPlan {
  return {
    date,
    activities: stored.activities ?? [],
    dailyCapacity: stored.dailyCapacity,
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
