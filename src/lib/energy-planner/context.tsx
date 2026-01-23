"use client";

import { createContext, type ReactNode, useContext } from "react";
import { useEnergyPlannerState } from "@/hooks/useEnergyPlannerState";
import type {
  DayPlan,
  EnergyCost,
  EnergyTypeConfig,
  Task,
  ZoneConfig,
} from "./schema";

interface EnergyPlannerContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  dailyCapacity: EnergyCost;
  setDailyCapacity: (capacity: EnergyCost) => void;
  currentDate: string;
  dayPlan: DayPlan;
  navigateToDate: (date: string) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
  addToPlan: (taskId: string, zoneId?: string) => void;
  removeFromPlan: (taskId: string) => void;
  toggleTaskCompletion: (taskId: string) => void;
  markTaskCompleteOnDate: (taskId: string, date: string) => void;
  moveTaskToToday: (taskId: string, fromDate: string) => void;
  moveTaskToUnplanned: (taskId: string, fromDate: string) => void;
  calculateEnergyUsage: () => EnergyCost;
  checkExceedsCapacity: () => { exceeded: boolean; message?: string };
  uncompletedTasks: { task: Task; fromDate: string }[];
  availableTasks: Task[];
  isLoading: boolean;
  energyTypes: EnergyTypeConfig[];
  addEnergyType: (typeData: Omit<EnergyTypeConfig, "id" | "isPreset">) => void;
  updateEnergyType: (updatedType: EnergyTypeConfig) => void;
  removeEnergyType: (typeId: string) => void;
  reorderPlannedTasks: (itemIds: string[]) => void;
  reorderTasks: (newTasks: Task[]) => void;
  zones: ZoneConfig[];
  addZone: (zone: Omit<ZoneConfig, "id">) => void;
  updateZone: (zone: ZoneConfig) => void;
  removeZone: (zoneId: string) => void;
  reorderZones: (zones: ZoneConfig[]) => void;
  assignTaskToZone: (taskId: string, zoneId: string) => void;
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

export function useEnergyPlanner() {
  const context = useContext(EnergyPlannerContext);
  if (context === undefined) {
    throw new Error(
      "useEnergyPlanner must be used within an EnergyPlannerProvider",
    );
  }
  return context;
}
