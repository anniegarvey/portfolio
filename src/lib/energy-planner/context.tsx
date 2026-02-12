"use client";

import { createContext, type ReactNode, useContext } from "react";
import { useEnergyPlannerState } from "@/hooks/useEnergyPlannerState";
import type {
  Activity,
  DayPlan,
  EnergyCost,
  EnergyTypeConfig,
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
  navigateToDate: (date: string) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
  addToPlan: (activityId: string, zoneId?: string) => void;
  removeFromPlan: (activityId: string) => void;
  toggleActivityCompletion: (activityId: string) => void;
  markActivityCompleteOnDate: (activityId: string, date: string) => void;
  moveActivityToToday: (activityId: string, fromDate: string) => void;
  moveActivityToUnplanned: (activityId: string, fromDate: string) => void;
  calculateEnergyUsage: () => EnergyCost;
  checkExceedsCapacity: () => { exceeded: boolean; message?: string };
  uncompletedActivities: { activity: Activity; fromDate: string }[];
  availableActivities: Activity[];
  isLoading: boolean;
  energyTypes: EnergyTypeConfig[];
  addEnergyType: (typeData: Omit<EnergyTypeConfig, "id" | "isPreset">) => void;
  updateEnergyType: (updatedType: EnergyTypeConfig) => void;
  removeEnergyType: (typeId: string) => void;
  reorderPlannedActivities: (itemIds: string[]) => void;
  reorderActivities: (newActivities: Activity[]) => void;
  zones: ZoneConfig[];
  addZone: (zone: Omit<ZoneConfig, "id">) => void;
  updateZone: (zone: ZoneConfig) => void;
  removeZone: (zoneId: string) => void;
  reorderZones: (zones: ZoneConfig[]) => void;
  assignActivityToZone: (activityId: string, zoneId: string) => void;
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
  const context = useContext(EnergyPlannerContext);
  if (context === undefined) {
    throw new Error(
      "useEnergyPlanner must be used within an EnergyPlannerProvider",
    );
  }
  return context;
}
