import type { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { DayPlan, EnergyCost, Task } from "./schema";
import {
  getAllDayPlanDates,
  getDailyCapacity,
  getDayPlan,
  getEnergyTypes,
  getTasks,
  setDailyCapacity,
  setDayPlan,
  setEnergyTypes,
  setTasks,
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

export const calculateEnergyUsage = (
  tasks: Task[],
  dayPlan: DayPlan,
): EnergyCost => {
  const selectedTasks = tasks.filter((t) =>
    dayPlan.selectedTaskIds.includes(t.id),
  );
  return selectedTasks.reduce((acc, task) => {
    // Dynamically sum all energy type properties
    for (const key in task.energyCost) {
      acc[key] = (acc[key] || 0) + task.energyCost[key];
    }
    return acc;
  }, {} as EnergyCost);
};

/**
 * Energy Planner Data Export/Import Utilities
 */

export interface EnergyPlannerExportData {
  version: string;
  exportDate: string;
  data: {
    tasks: Task[] | null;
    capacity: EnergyCost | null;
    energyTypes: Awaited<ReturnType<typeof getEnergyTypes>> | null;
    dayPlans: { date: string; plan: DayPlan }[] | null;
  };
}

const EXPORT_VERSION = "2.0.0"; // Incremented for IndexedDB format

/**
 * Exports all energy planner data from IndexedDB to a JSON file
 */
export async function exportEnergyPlannerData(): Promise<void> {
  const dates = await getAllDayPlanDates();
  const dayPlans: { date: string; plan: DayPlan }[] = [];

  for (const date of dates) {
    const plan = await getDayPlan(date);
    if (plan) {
      dayPlans.push({ date, plan });
    }
  }

  const exportData: EnergyPlannerExportData = {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    data: {
      tasks: await getTasks(),
      capacity: (await getDailyCapacity()) ?? null,
      energyTypes: (await getEnergyTypes()) ?? null,
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
  if (data.data.tasks) {
    await setTasks(data.data.tasks);
  }
  if (data.data.capacity) {
    await setDailyCapacity(data.data.capacity);
  }
  if (data.data.energyTypes) {
    await setEnergyTypes(data.data.energyTypes);
  }
  if (data.data.dayPlans) {
    for (const { date, plan } of data.data.dayPlans) {
      await setDayPlan(date, plan);
    }
  }

  // Reload the page to reflect the imported data
  window.location.reload();
}
