import type {
  DayPlan,
  EnergyCost,
  EnergyTypeConfig,
  Task,
} from "@/lib/energy-planner/schema";
import { DEFAULT_ENERGY_TYPES } from "@/lib/energy-planner/schema";
import {
  getAllDayPlanDates,
  getDayPlan,
  setDayPlan,
} from "@/lib/energy-planner/storage";

/**
 * Creates a default capacity object from energy types
 */
export function getDefaultCapacity(
  energyTypes: EnergyTypeConfig[],
): EnergyCost {
  return energyTypes.reduce((acc, type) => {
    acc[type.id] = 50;
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
export async function getDayPlanForDate(date: string): Promise<DayPlan | null> {
  return getDayPlan(date);
}

/**
 * Save a day plan for a specific date to IndexedDB
 */
export async function saveDayPlanForDate(
  date: string,
  plan: DayPlan,
): Promise<void> {
  await setDayPlan(date, plan);
}

/**
 * Create a fresh day plan for a given date
 */
export function createEmptyDayPlan(date: string): DayPlan {
  return {
    date,
    tasks: [],
    dailyCapacity: defaultCapacity,
  };
}

/**
 * Get all stored day plan dates from IndexedDB
 */
export async function getAllStoredDates(): Promise<string[]> {
  return getAllDayPlanDates();
}

/**
 * Find uncompleted tasks from previous days
 * Returns tasks that were planned but not completed on days before today
 */
export async function getUncompletedTasks(
  today: string,
): Promise<{ task: Task; fromDate: string }[]> {
  const uncompleted: { task: Task; fromDate: string }[] = [];
  const storedDates = await getAllStoredDates();

  for (const date of storedDates) {
    if (date >= today) continue; // Skip today and future dates

    const dayPlan = await getDayPlanForDate(date);
    if (!dayPlan?.tasks) continue;

    for (const task of dayPlan.tasks) {
      if (!task.completed) {
        // Check if already added (though physically distinct copies)
        // We probably want to show instances from previous days
        uncompleted.push({ task, fromDate: date });
      }
    }
  }

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
