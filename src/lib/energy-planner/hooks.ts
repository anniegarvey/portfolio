"use client";

import {
  useDailyCapacity,
  useDayPlan,
  useEnergyTypes,
  useTasks,
} from "./hooks-slices";
import type { EnergyCost } from "./schema";
import { calculateEnergyUsage as calcUsage } from "./utils";

export function useEnergyPlannerState() {
  const { tasks, addTask, updateTask, removeTaskState } = useTasks();
  const { dailyCapacity, setDailyCapacity } = useDailyCapacity();
  const { dayPlan, addToPlan, removeFromPlan, toggleTaskCompletion } =
    useDayPlan();
  const { energyTypes, addEnergyType, updateEnergyType, removeEnergyType } =
    useEnergyTypes();

  const removeTask = (taskId: string) => {
    removeTaskState(taskId);
    removeFromPlan(taskId);
  };

  const calculateEnergyUsage = (): EnergyCost => {
    return calcUsage(tasks, dayPlan);
  };

  const checkExceedsCapacity = () => {
    const usage = calculateEnergyUsage();
    const exceededTypes: string[] = [];

    energyTypes.forEach((type) => {
      const usageValue = usage[type.id] || 0;
      const capacityValue = dailyCapacity[type.id] || 0;
      if (usageValue > capacityValue) {
        exceededTypes.push(type.label);
      }
    });

    if (exceededTypes.length > 0) {
      return {
        exceeded: true,
        message: `Warning: You have exceeded your ${exceededTypes.join(", ")} energy capacity!`,
      };
    }
    return { exceeded: false };
  };

  return {
    tasks,
    addTask,
    updateTask,
    removeTask,
    dailyCapacity,
    setDailyCapacity,
    dayPlan,
    addToPlan,
    removeFromPlan,
    toggleTaskCompletion,
    calculateEnergyUsage,
    checkExceedsCapacity,
    energyTypes,
    addEnergyType,
    updateEnergyType,
    removeEnergyType,
  };
}
