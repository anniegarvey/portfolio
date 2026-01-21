import { clear, createStore, del, get, keys, set } from "idb-keyval";
import type { DayPlan, EnergyCost, EnergyTypeConfig, Task } from "./schema";

/**
 * IndexedDB store for energy planner data
 * Uses idb-keyval for simple key-value storage with automatic serialization
 */
const store = createStore("energy-planner-db", "data");

// Storage keys
const KEYS = {
  tasks: "tasks",
  types: "types",
  capacity: "capacity",
} as const;

/**
 * Storage-optimized DayPlan that omits redundant fields:
 * - date: derived from the storage key
 * - selectedTaskIds: omitted entirely if empty
 * - completedTaskIds: omitted entirely if empty
 */
export interface StoredDayPlan {
  selectedTaskIds?: string[];
  completedTaskIds?: string[];
  dailyCapacity: EnergyCost;
}

// === Tasks ===

export async function getTasks(): Promise<Task[]> {
  const tasks = await get<Task[]>(KEYS.tasks, store);
  return tasks ?? [];
}

export async function setTasks(tasks: Task[]): Promise<void> {
  await set(KEYS.tasks, tasks, store);
}

// === Energy Types ===

export async function getEnergyTypes(): Promise<
  EnergyTypeConfig[] | undefined
> {
  return get<EnergyTypeConfig[]>(KEYS.types, store);
}

export async function setEnergyTypes(types: EnergyTypeConfig[]): Promise<void> {
  await set(KEYS.types, types, store);
}

// === Daily Capacity ===

export async function getDailyCapacity(): Promise<EnergyCost | undefined> {
  return get<EnergyCost>(KEYS.capacity, store);
}

export async function setDailyCapacity(capacity: EnergyCost): Promise<void> {
  await set(KEYS.capacity, capacity, store);
}

// === Day Plans ===

function getDayPlanKey(date: string): string {
  return `day-${date}`;
}

/**
 * Convert a full DayPlan to storage-optimized format
 */
function toStoredDayPlan(plan: DayPlan): StoredDayPlan {
  const stored: StoredDayPlan = {
    dailyCapacity: plan.dailyCapacity,
  };

  // Only include arrays if they have items
  if (plan.selectedTaskIds && plan.selectedTaskIds.length > 0) {
    stored.selectedTaskIds = plan.selectedTaskIds;
  }
  if (plan.completedTaskIds && plan.completedTaskIds.length > 0) {
    stored.completedTaskIds = plan.completedTaskIds;
  }

  return stored;
}

/**
 * Convert storage format to full DayPlan
 */
function fromStoredDayPlan(date: string, stored: StoredDayPlan): DayPlan {
  return {
    date,
    selectedTaskIds: stored.selectedTaskIds ?? [],
    completedTaskIds: stored.completedTaskIds ?? [],
    dailyCapacity: stored.dailyCapacity,
  };
}

export async function getDayPlan(date: string): Promise<DayPlan | null> {
  const stored = await get<StoredDayPlan>(getDayPlanKey(date), store);
  if (!stored) return null;
  return fromStoredDayPlan(date, stored);
}

export async function setDayPlan(date: string, plan: DayPlan): Promise<void> {
  await set(getDayPlanKey(date), toStoredDayPlan(plan), store);
}

export async function deleteDayPlan(date: string): Promise<void> {
  await del(getDayPlanKey(date), store);
}

/**
 * Get all dates that have stored day plans
 */
export async function getAllDayPlanDates(): Promise<string[]> {
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
