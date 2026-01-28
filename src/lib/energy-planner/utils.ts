import type { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { DayPlan, EnergyCost, Task } from "./schema";
import {
  fetchAllDayPlanDates,
  fetchDayPlan,
  fetchEnergyTypes,
  fetchOneOffTasks,
  storeDayPlan,
  storeEnergyTypes,
  storeOneOffTasks,
} from "./storage";

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

export const calculateEnergyUsage = (dayPlan: DayPlan): EnergyCost => {
  const selectedTasks = dayPlan.tasks ?? [];
  return selectedTasks.reduce(
    (acc, task) => {
      // Dynamically sum all energy type properties
      for (const key in task.energyCost) {
        acc[key] = (acc[key] || 0) + task.energyCost[key];
      }
      return acc;
    },
    { physical: 0, social: 0, executive: 0 } as EnergyCost,
  );
};

/**
 * Energy Planner Data Export/Import Utilities
 */

export interface EnergyPlannerExportData {
  version: string;
  exportDate: string;
  data: {
    oneOffTasks: Task[] | null;
    energyTypes: Awaited<ReturnType<typeof fetchEnergyTypes>> | null;
    dayPlans: { date: string; plan: DayPlan }[] | null;
  };
}

const EXPORT_VERSION = "3.0.0"; // Incremented for task structure change

/**
 * Exports all energy planner data from IndexedDB to a JSON file
 */
export async function exportEnergyPlannerData(): Promise<void> {
  const dates = await fetchAllDayPlanDates();
  const dayPlans: { date: string; plan: DayPlan }[] = [];

  for (const date of dates) {
    const plan = await fetchDayPlan(date);
    if (plan) {
      dayPlans.push({ date, plan });
    }
  }

  const exportData: EnergyPlannerExportData = {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    data: {
      oneOffTasks: await fetchOneOffTasks(),
      energyTypes: (await fetchEnergyTypes()) ?? null,
      dayPlans: dayPlans.length > 0 ? dayPlans : null,
    },
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `energy-planner-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Imports energy planner data from a JSON file into IndexedDB
 * @param file - The JSON file to import
 * @throws Error if file is invalid or parsing fails
 */
export async function importEnergyPlannerData(file: File): Promise<void> {
  if (!file.type.includes("json")) {
    throw new Error("Invalid file type. Please select a JSON file.");
  }

  const text = await file.text();
  const data = JSON.parse(text) as EnergyPlannerExportData;

  // Validate the structure
  if (!(data.version && data.data)) {
    throw new Error("Invalid file format. Missing required fields.");
  }

  // Import the data
  if (data.data.oneOffTasks) {
    await storeOneOffTasks(data.data.oneOffTasks);
  }
  if (data.data.energyTypes) {
    await storeEnergyTypes(data.data.energyTypes);
  }
  if (data.data.dayPlans) {
    for (const { date, plan } of data.data.dayPlans) {
      await storeDayPlan(date, plan);
    }
  }

  // Reload the page to reflect the imported data
  window.location.reload();
}
