import type {
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
