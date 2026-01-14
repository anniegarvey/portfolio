import type {
  DayPlan,
  EnergyCost,
  EnergyTypeConfig,
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
 * Loads or creates initial day plan from localStorage
 */
export function loadInitialDayPlan(setDayPlan: (plan: DayPlan) => void) {
  const today = new Date().toISOString().split("T")[0];
  const stored = localStorage.getItem("energy_planner_day_plan");

  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.date === today) {
      setDayPlan(parsed);
      return;
    }
  }

  const cap = localStorage.getItem("energy_planner_capacity");
  let dailyCapacity = defaultCapacity;
  if (cap) {
    dailyCapacity = JSON.parse(cap);
  }

  setDayPlan({
    date: today,
    selectedTaskIds: [],
    completedTaskIds: [],
    dailyCapacity,
  });
}
