"use client";

import { createContext, type ReactNode, useContext } from "react";
import { useEnergyPlannerState } from "./hooks";
import type { DayPlan, EnergyCost, Task } from "./schema";

interface EnergyPlannerContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  dailyCapacity: EnergyCost;
  setDailyCapacity: (capacity: EnergyCost) => void;
  dayPlan: DayPlan;
  addToPlan: (taskId: string) => void;
  removeFromPlan: (taskId: string) => void;
  toggleTaskCompletion: (taskId: string) => void;
  calculateEnergyUsage: () => EnergyCost;
  checkExceedsCapacity: () => { exceeded: boolean; message?: string };
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
