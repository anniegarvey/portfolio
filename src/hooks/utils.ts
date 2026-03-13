import type {
  Activity,
  DayPlan,
  EnergyCost,
  EnergyTypeConfig,
} from "@/lib/energy-planner/schema";
import { DEFAULT_ENERGY_TYPES } from "@/lib/energy-planner/schema";
import {
  fetchAllDayPlanDates,
  fetchDayPlan,
  storeDayPlan,
} from "@/lib/energy-planner/storage";

export interface OneOffPlanningState {
  uncompleted: { activity: Activity; instanceId: string; fromDate: string }[];
  /** Source activity IDs with a concrete instance in any day plan */
  scheduledOneOffIds: Set<string>;
  /** Source activity IDs whose instance is marked completed in any day plan */
  completedOneOffIds: Set<string>;
}

/**
 * Creates a default capacity object from energy types
 */
export function getDefaultCapacity(
  energyTypes: EnergyTypeConfig[],
): EnergyCost {
  return energyTypes.reduce((acc, type) => {
    acc[type.id] = 0;
    return acc;
  }, {} as EnergyCost);
}

export const defaultCapacity: EnergyCost =
  getDefaultCapacity(DEFAULT_ENERGY_TYPES);

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Load a day plan for a specific date from IndexedDB
 */
export async function fetchDayPlanForDate(
  date: string,
): Promise<DayPlan | null> {
  return fetchDayPlan(date);
}

/**
 * Save a day plan for a specific date to IndexedDB
 */
export async function saveDayPlanForDate(
  date: string,
  plan: DayPlan,
): Promise<void> {
  await storeDayPlan(date, plan);
}

/**
 * Create a fresh day plan for a given date
 */
export function createEmptyDayPlan(date: string): DayPlan {
  return {
    date,
    plannedInstances: [],
    dailyCapacity: defaultCapacity,
    activityOrder: undefined,
  };
}

/**
 * Get all stored day plan dates from IndexedDB
 */
export async function getAllStoredDates(): Promise<string[]> {
  return fetchAllDayPlanDates();
}

function processInstance(
  instance: {
    sourceActivityId: string;
    completed: boolean;
    isProjected?: boolean;
    id: string;
  },
  date: string,
  today: string,
  activityMap: Map<string, Activity>,
  state: OneOffPlanningState,
): void {
  if (instance.isProjected) return;

  const activity = activityMap.get(instance.sourceActivityId);
  if (!activity || activity.repeatConfig) return;

  state.scheduledOneOffIds.add(instance.sourceActivityId);

  if (instance.completed) {
    state.completedOneOffIds.add(instance.sourceActivityId);
  } else if (date < today) {
    state.uncompleted.push({
      activity,
      instanceId: instance.id,
      fromDate: date,
    });
  }
}

/**
 * Scans all stored day plans in a single pass and returns:
 * - uncompleted: one-off instances from past days that were not completed
 * - scheduledOneOffIds: one-off source IDs with any concrete instance across all days
 * - completedOneOffIds: one-off source IDs whose instance is marked completed
 *
 * Repeating activities (those with repeatConfig) are excluded — their completion
 * is tracked per-instance in the day plan and they can recur.
 */
export async function fetchOneOffPlanningState(
  today: string,
  activityMap: Map<string, Activity>,
): Promise<OneOffPlanningState> {
  const state: OneOffPlanningState = {
    uncompleted: [],
    scheduledOneOffIds: new Set<string>(),
    completedOneOffIds: new Set<string>(),
  };

  const storedDates = await getAllStoredDates();

  const dayPlans = await Promise.all(
    storedDates.map((d) => fetchDayPlanForDate(d)),
  );

  for (const [i, dayPlan] of dayPlans.entries()) {
    if (!dayPlan?.plannedInstances) continue;
    const date = storedDates[i];

    for (const instance of dayPlan.plannedInstances) {
      processInstance(instance, date, today, activityMap, state);
    }
  }

  return state;
}

/** @deprecated Use fetchOneOffPlanningState instead */
export async function getUncompletedActivities(
  today: string,
  activityMap: Map<string, Activity>,
): Promise<{ activity: Activity; instanceId: string; fromDate: string }[]> {
  const { uncompleted } = await fetchOneOffPlanningState(today, activityMap);
  return uncompleted;
}

/**
 * Format a date string for display (e.g., "Tuesday, January 14, 2026")
 */
export function formatDateForDisplay(dateString: string): string {
  const date = new Date(`${dateString}T12:00:00`); // Add time to avoid timezone issues
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Check if a date string is today
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayDateString();
}

/**
 * Get the previous day's date string
 */
export function getPreviousDay(dateString: string): string {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
}

/**
 * Get the next day's date string
 */
export function getNextDay(dateString: string): string {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
}

/**
 * Generate a slug from a label (e.g., "Creative Energy" -> "creative-energy")
 */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a unique key from a label, ensuring no clashes with existing keys.
 * If a clash occurs, appends a numeric suffix (e.g., "physical-2").
 */
export function generateUniqueKey(
  label: string,
  existingKeys: string[],
): string {
  const baseKey = slugify(label);

  if (!existingKeys.includes(baseKey)) {
    return baseKey;
  }

  let suffix = 2;
  while (existingKeys.includes(`${baseKey}-${suffix}`)) {
    suffix++;
  }

  return `${baseKey}-${suffix}`;
}
