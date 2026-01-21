"use client";

import { useCallback, useEffect, useState } from "react";
import type { EnergyCost, Task } from "@/lib/energy-planner/schema";
import { calculateEnergyUsage as calcUsage } from "@/lib/energy-planner/utils";
import { useDailyCapacity } from "./useDailyCapacity";
import { useDayPlan } from "./useDayPlan";
import { useEnergyTypes } from "./useEnergyTypes";
import { useTasks } from "./useTasks";
import { getAllPlannedTaskIds, getUncompletedTasks } from "./utils";

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
    dailyCapacity,
    isLoading: capacityLoading,
    setDailyCapacity,
  } = useDailyCapacity();
  const {
    currentDate,
    dayPlan,
    isLoading: dayPlanLoading,
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
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [uncompletedTasks, setUncompletedTasks] = useState<
    { task: Task; fromDate: string }[]
  >([]);

  // Load available tasks (tasks not planned for any day)
  useEffect(() => {
    if (tasksLoading) return;

    (async () => {
      const plannedIds = await getAllPlannedTaskIds();
      setAvailableTasks(tasks.filter((t) => !plannedIds.has(t.id)));
    })();
  }, [tasks, tasksLoading]); // Recompute when tasks change

  // Load uncompleted tasks from previous days
  useEffect(() => {
    if (tasksLoading) return;

    (async () => {
      const uncompleted = await getUncompletedTasks(tasks, currentDate);
      setUncompletedTasks(uncompleted);
    })();
  }, [tasks, tasksLoading, currentDate]);

  const removeTask = useCallback(
    (taskId: string) => {
      removeTaskState(taskId);
      removeFromPlan(taskId);
    },
    [removeTaskState, removeFromPlan],
  );

  const calculateEnergyUsage = useCallback((): EnergyCost => {
    return calcUsage(tasks, dayPlan);
  }, [tasks, dayPlan]);

  const checkExceedsCapacity = useCallback(() => {
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
  }, [calculateEnergyUsage, energyTypes, dailyCapacity]);

  const isLoading =
    tasksLoading || capacityLoading || dayPlanLoading || typesLoading;

  return {
    tasks,
    isLoading,
    addTask,
    updateTask,
    removeTask,
    dailyCapacity,
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
