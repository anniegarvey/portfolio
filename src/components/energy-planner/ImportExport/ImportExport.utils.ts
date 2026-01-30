import type {
  DayPlan,
  EnergyTypeConfig,
  Task,
  ZoneConfig,
} from "@/lib/energy-planner/schema";
import {
  fetchAllDayPlanDates,
  fetchDayPlan,
  fetchEnergyTypes,
  fetchOneOffTasks,
  fetchRepeatingTasks,
  fetchZones,
  storeDayPlan,
  storeEnergyTypes,
  storeOneOffTasks,
  storeRepeatingTasks,
  storeZones,
} from "@/lib/energy-planner/storage";

export interface EnergyPlannerExportData {
  version: string;
  exportDate: string;
  data: {
    oneOffTasks: Task[] | null;
    repeatingTasks: Task[] | null;
    energyTypes: EnergyTypeConfig[] | null;
    zones: ZoneConfig[] | null;
    dayPlans: { date: string; plan: DayPlan }[] | null;
  };
}

const EXPORT_VERSION = "3.1.0"; // Incremented for added support for zones and repeating tasks

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
      repeatingTasks: await fetchRepeatingTasks(),
      energyTypes: (await fetchEnergyTypes()) ?? null,
      zones: (await fetchZones()) ?? null,
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
  if (data.data.repeatingTasks) {
    await storeRepeatingTasks(data.data.repeatingTasks);
  }
  if (data.data.energyTypes) {
    await storeEnergyTypes(data.data.energyTypes);
  }
  if (data.data.zones) {
    await storeZones(data.data.zones);
  }
  if (data.data.dayPlans) {
    for (const { date, plan } of data.data.dayPlans) {
      await storeDayPlan(date, plan);
    }
  }

  // Reload the page to reflect the imported data
  window.location.reload();
}
