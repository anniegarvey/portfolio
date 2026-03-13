"use client";

import { createContext, type ReactNode, use } from "react";
import { useEnergyPlannerState } from "@/hooks/useEnergyPlannerState";
import type {
  Activity,
  DayPlan,
  EnergyCost,
  EnergyTypeConfig,
  ResolvedActivity,
  ZoneConfig,
} from "./schema";

interface EnergyPlannerContextType {
  oneOffActivities: Activity[];
  repeatingActivities: Activity[];
  addActivity: (activity: Omit<Activity, "id" | "createdAt">) => Activity;
  updateActivity: (activity: Activity) => void;
  removeActivity: (activityId: string) => void;
  dailyCapacity: EnergyCost;
  setDailyCapacity: (capacity: EnergyCost) => void;
  currentDate: string;
  dayPlan: DayPlan;
  resolvedActivities: ResolvedActivity[];
  navigateToDate: (date: string) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
  addToPlan: (
    activityId: string,
    zoneId?: string,
    knownActivity?: Activity,
  ) => void;
  removeFromPlan: (instanceId: string) => void;
  toggleActivityCompletion: (instanceId: string) => void;
  markActivityCompleteOnDate: (instanceId: string, date: string) => void;
  moveActivityToToday: (instanceId: string, fromDate: string) => void;
  moveActivityToUnplanned: (instanceId: string, fromDate: string) => void;
  moveActivityToDate: (instanceId: string, targetDate: string) => void;
  calculateEnergyUsage: () => EnergyCost;
  checkExceedsCapacity: () => { exceeded: boolean; message?: string };
  uncompletedActivities: {
    activity: Activity;
    instanceId: string;
    fromDate: string;
  }[];
  availableActivities: Activity[];
  isLoading: boolean;
  energyTypes: EnergyTypeConfig[];
  addEnergyType: (typeData: Omit<EnergyTypeConfig, "id" | "isPreset">) => void;
  updateEnergyType: (updatedType: EnergyTypeConfig) => void;
  removeEnergyType: (typeId: string) => void;
  reorderPlannedActivities: (itemIds: string[]) => void;
  reorderActivities: (newActivities: Activity[]) => void;
  reorderRepeatingActivities: (newActivities: Activity[]) => void;
  zones: ZoneConfig[];
  addZone: (zone: Omit<ZoneConfig, "id">) => void;
  updateZone: (zone: ZoneConfig) => void;
  removeZone: (zoneId: string) => void;
  reorderZones: (zones: ZoneConfig[]) => void;
  assignActivityToZone: (instanceId: string, zoneId: string) => void;
  skipActivity: (instanceId: string) => void;
}

const EnergyPlannerContext = createContext<
  EnergyPlannerContextType | undefined
>(undefined);

export function EnergyPlannerProvider({ children }: { children: ReactNode }) {
  const energyPlannerState = useEnergyPlannerState();

  return (
    <EnergyPlannerContext.Provider value={energyPlannerState}>
      {children}
    </EnergyPlannerContext.Provider>
  );
}

// biome-ignore lint/style/useComponentExportOnlyModules: Standard pattern for Context + Hook
export function useEnergyPlanner() {
  const context = use(EnergyPlannerContext);
  if (context === undefined) {
    throw new Error(
      "useEnergyPlanner must be used within an EnergyPlannerProvider",
    );
  }
  return context;
}
