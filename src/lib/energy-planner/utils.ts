import type { DayPlan, EnergyCost, Task } from "./schema";

export const calculateEnergyUsage = (
  tasks: Task[],
  dayPlan: DayPlan,
): EnergyCost => {
  const selectedTasks = tasks.filter((t) =>
    dayPlan.selectedTaskIds.includes(t.id),
  );
  return selectedTasks.reduce(
    (acc, task) => ({
      physical: acc.physical + task.energyCost.physical,
      social: acc.social + task.energyCost.social,
      executive: acc.executive + task.energyCost.executive,
    }),
    { physical: 0, social: 0, executive: 0 },
  );
};

/**
 * Energy Planner Data Export/Import Utilities
 */

export interface EnergyPlannerExportData {
  version: string;
  exportDate: string;
  data: {
    tasks: string | null;
    capacity: string | null;
    dayPlan: string | null;
  };
}

const STORAGE_KEYS = {
  tasks: "energy_planner_tasks",
  capacity: "energy_planner_capacity",
  dayPlan: "energy_planner_day_plan",
} as const;

const EXPORT_VERSION = "1.0.0";

/**
 * Exports all energy planner data from localStorage to a JSON file
 */
export function exportEnergyPlannerData(): void {
  const exportData: EnergyPlannerExportData = {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    data: {
      tasks: localStorage.getItem(STORAGE_KEYS.tasks),
      capacity: localStorage.getItem(STORAGE_KEYS.capacity),
      dayPlan: localStorage.getItem(STORAGE_KEYS.dayPlan),
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
 * Imports energy planner data from a JSON file into localStorage
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
    localStorage.setItem(STORAGE_KEYS.tasks, data.data.tasks);
  }
  if (data.data.capacity) {
    localStorage.setItem(STORAGE_KEYS.capacity, data.data.capacity);
  }
  if (data.data.dayPlan) {
    localStorage.setItem(STORAGE_KEYS.dayPlan, data.data.dayPlan);
  }

  // Reload the page to reflect the imported data
  window.location.reload();
}
