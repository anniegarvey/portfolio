"use client";

import { useDailyCapacity, useDayPlan, useTasks } from "./hooks-slices";
import type { EnergyCost } from "./schema";
import { calculateEnergyUsage as calcUsage } from "./utils";

export function useEnergyPlannerState() {
  const { tasks, addTask, updateTask, removeTaskState } = useTasks();
  const { dailyCapacity, setDailyCapacity } = useDailyCapacity();
  const { dayPlan, addToPlan, removeFromPlan, toggleTaskCompletion } =
    useDayPlan();

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

    if (usage.physical > dailyCapacity.physical) exceededTypes.push("Physical");
    if (usage.social > dailyCapacity.social) exceededTypes.push("Social");
    if (usage.executive > dailyCapacity.executive)
      exceededTypes.push("Executive");

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
  };
}
