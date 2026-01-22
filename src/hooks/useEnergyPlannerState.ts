"use client";

import { useCallback, useEffect, useState } from "react";
import type { EnergyCost, Task } from "@/lib/energy-planner/schema";
import { calculateEnergyUsage as calcUsage } from "@/lib/energy-planner/utils";
import { useDayPlan } from "./useDayPlan";
import { useEnergyTypes } from "./useEnergyTypes";
import { useTasks } from "./useTasks";
import { getUncompletedTasks } from "./utils";

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Hook aggregating multiple state management hooks
export function useEnergyPlannerState() {
  const {
    tasks,
    isLoading: tasksLoading,
    addTask,
    updateTask,
    removeTaskState,
    reorderTasks,
  } = useTasks();
  const {
    currentDate,
    dayPlan,
    dayPlanVersion,
    isLoading: dayPlanLoading,
    navigateToDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    setDailyCapacity,
    addToPlan,
    removeFromPlan,
    toggleTaskCompletion,
    markTaskCompleteOnDate,
    moveTaskToToday,
    moveTaskToUnplanned,
    reorderPlannedTasks,
  } = useDayPlan();
  const {
    energyTypes,
    isLoading: typesLoading,
    addEnergyType,
    updateEnergyType,
    removeEnergyType,
  } = useEnergyTypes();

  // State for async-computed values
  const [uncompletedTasks, setUncompletedTasks] = useState<
    { task: Task; fromDate: string }[]
  >([]);

  // Available tasks are just the one-off tasks
  const availableTasks = tasks;

  // Load uncompleted tasks from previous days
  // Re-run when dayPlanVersion changes (after uncompleted task actions)
  // biome-ignore lint/correctness/useExhaustiveDependencies: dayPlanVersion intentionally triggers re-fetch after storage changes
  useEffect(() => {
    if (tasksLoading) return;

    (async () => {
      const uncompleted = await getUncompletedTasks(currentDate);
      setUncompletedTasks(uncompleted);
    })();
  }, [tasksLoading, currentDate, dayPlanVersion]);

  const removeTask = useCallback(
    async (taskId: string) => {
      // If it's in the one-off list, remove it
      if (tasks.find((t) => t.id === taskId)) {
        removeTaskState(taskId);
      }
      // If it's in the day plan, remove it
      await removeFromPlan(taskId);
    },
    [tasks, removeTaskState, removeFromPlan],
  );

  const calculateEnergyUsage = useCallback((): EnergyCost => {
    return calcUsage(dayPlan);
  }, [dayPlan]);

  const checkExceedsCapacity = useCallback(() => {
    const usage = calculateEnergyUsage();
    const exceededTypes: string[] = [];

    energyTypes.forEach((type) => {
      const usageValue = usage[type.id] || 0;
      const capacityValue = dayPlan.dailyCapacity[type.id] || 0;
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
  }, [calculateEnergyUsage, energyTypes, dayPlan.dailyCapacity]);

  const isLoading = tasksLoading || dayPlanLoading || typesLoading;

  return {
    tasks,
    isLoading,
    addTask,
    updateTask,
    removeTask,
    dailyCapacity: dayPlan.dailyCapacity,
    setDailyCapacity,
    currentDate,
    dayPlan,
    navigateToDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    addToPlan,
    removeFromPlan,
    toggleTaskCompletion,
    markTaskCompleteOnDate,
    moveTaskToToday,
    moveTaskToUnplanned,
    calculateEnergyUsage,
    checkExceedsCapacity,
    uncompletedTasks,
    availableTasks,
    energyTypes,
    addEnergyType,
    updateEnergyType,
    removeEnergyType,
    reorderPlannedTasks: reorderPlannedTasks,
    reorderTasks: reorderTasks,
  };
}
