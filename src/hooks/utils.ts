import type {
  DayPlan,
  EnergyCost,
  EnergyTypeConfig,
  Task,
} from "@/lib/energy-planner/schema";
import { DEFAULT_ENERGY_TYPES } from "@/lib/energy-planner/schema";

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
 * Get the localStorage key for a specific date's day plan
 */
export function getStorageKeyForDate(date: string): string {
  return `energy_planner_day_plan_${date}`;
}

/**
 * Load a day plan for a specific date from localStorage
 */
export function getDayPlanForDate(date: string): DayPlan | null {
  const stored = localStorage.getItem(getStorageKeyForDate(date));
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error(`Failed to parse day plan for ${date}`, error);
    return null;
  }
}

/**
 * Save a day plan for a specific date to localStorage
 */
export function saveDayPlanForDate(date: string, plan: DayPlan): void {
  localStorage.setItem(getStorageKeyForDate(date), JSON.stringify(plan));
}

/**
 * Create a fresh day plan for a given date
 */
export function createEmptyDayPlan(date: string): DayPlan {
  const cap = localStorage.getItem("energy_planner_capacity");
  const dailyCapacity = cap ? JSON.parse(cap) : defaultCapacity;

  return {
    date,
    selectedTaskIds: [],
    completedTaskIds: [],
    dailyCapacity,
  };
}

/**
 * Get all stored day plan dates from localStorage
 */
export function getAllStoredDates(): string[] {
  if (!localStorage) return [];
  const dates: string[] = [];
  const prefix = "energy_planner_day_plan_";
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      dates.push(key.slice(prefix.length));
    }
  }
  return dates.sort();
}

/**
 * Get all task IDs that are planned for any day
 * Used to filter available tasks - tasks planned for any date should not appear as available
 */
export function getAllPlannedTaskIds(): Set<string> {
  const plannedIds = new Set<string>();
  const dates = getAllStoredDates();

  for (const date of dates) {
    const plan = getDayPlanForDate(date);
    if (plan?.selectedTaskIds) {
      for (const id of plan.selectedTaskIds) {
        plannedIds.add(id);
      }
    }
  }

  return plannedIds;
}

/**
 * Find uncompleted tasks from previous days
 * Returns tasks that were selected but not completed on days before today
 */
export function getUncompletedTasks(
  tasks: Task[],
  today: string,
): { task: Task; fromDate: string }[] {
  const uncompleted: { task: Task; fromDate: string }[] = [];
  const storedDates = getAllStoredDates();

  for (const date of storedDates) {
    if (date >= today) continue; // Skip today and future dates

    const dayPlan = getDayPlanForDate(date);
    if (!dayPlan) continue;

    const incompleteTaskIds = dayPlan.selectedTaskIds.filter(
      (id) => !dayPlan.completedTaskIds.includes(id),
    );

    for (const taskId of incompleteTaskIds) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        // Check if already added from an earlier date
        const existingIndex = uncompleted.findIndex(
          (u) => u.task.id === taskId,
        );
        if (existingIndex === -1) {
          uncompleted.push({ task, fromDate: date });
        }
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
