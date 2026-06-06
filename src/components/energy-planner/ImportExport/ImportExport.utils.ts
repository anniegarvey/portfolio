import { z } from "zod";
import type {
  Activity,
  DayPlan,
  EnergyTypeConfig,
  ZoneConfig,
} from "@/lib/energy-planner/schema";
import {
  fetchActivities,
  fetchAllDayPlanDates,
  fetchDayPlan,
  fetchEnergyTypes,
  fetchZones,
  storeActivities,
  storeDayPlan,
  storeEnergyTypes,
  storeZones,
} from "@/lib/energy-planner/storage";
import type { WellnessConfig, WellnessEntry } from "@/lib/wellness/schema";
import {
  WellnessConfigSchema,
  WellnessEntrySchema,
} from "@/lib/wellness/schema";
import {
  fetchWellnessConfig,
  fetchWellnessEntries,
  storeWellnessConfig,
  storeWellnessEntries,
} from "@/lib/wellness/storage";

export interface EnergyPlannerExportData {
  version: string;
  exportDate: string;
  data: {
    oneOffActivities: Activity[] | null;
    repeatingActivities: Activity[] | null;
    energyTypes: EnergyTypeConfig[] | null;
    zones: ZoneConfig[] | null;
    dayPlans: { date: string; plan: DayPlan }[] | null;
    wellnessConfig: WellnessConfig | null;
    wellnessEntries: WellnessEntry[] | null;
  };
}

const EXPORT_VERSION = "6.0.0"; // Added wellness config and entries to export

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

  const [allActivities, energyTypes, zones, wellnessConfig, wellnessEntries] =
    await Promise.all([
      fetchActivities(),
      fetchEnergyTypes(),
      fetchZones(),
      fetchWellnessConfig(),
      fetchWellnessEntries(),
    ]);

  const exportData: EnergyPlannerExportData = {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    data: {
      oneOffActivities: allActivities?.filter((a) => !a.repeatConfig) ?? null,
      repeatingActivities:
        allActivities?.filter((a) => !!a.repeatConfig) ?? null,
      energyTypes: energyTypes ?? null,
      zones: zones ?? null,
      dayPlans: dayPlans.length > 0 ? dayPlans : null,
      wellnessConfig: wellnessConfig ?? null,
      wellnessEntries: wellnessEntries.length > 0 ? wellnessEntries : null,
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
 * Validates and stores the wellness config and entries from imported data.
 * @throws Error if either the config or entries fail schema validation
 */
async function importWellnessData(
  data: EnergyPlannerExportData["data"],
): Promise<void> {
  if (data.wellnessConfig) {
    const configResult = WellnessConfigSchema.safeParse(data.wellnessConfig);
    if (!configResult.success) {
      throw new Error("Invalid wellness config in backup file.");
    }
    await storeWellnessConfig(configResult.data);
  }
  if (data.wellnessEntries) {
    const entriesResult = z
      .array(WellnessEntrySchema)
      .safeParse(data.wellnessEntries);
    if (!entriesResult.success) {
      throw new Error("Invalid wellness entries in backup file.");
    }
    await storeWellnessEntries(entriesResult.data);
  }
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

  // Import the data — merge both lists into the single unified store
  const allActivities: Activity[] = [
    ...(data.data.oneOffActivities ?? []),
    ...(data.data.repeatingActivities ?? []),
  ];
  if (allActivities.length > 0) {
    await storeActivities(allActivities);
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
  await importWellnessData(data.data);

  // Reload the page to reflect the imported data
  window.location.reload();
}
