"use client";

import { useCallback, useEffect, useState } from "react";
import type { EnergyCost, Task } from "@/lib/energy-planner/schema";
import { calculateEnergyUsage as calcUsage } from "@/lib/energy-planner/utils";
import { useDayPlan } from "./useDayPlan";
import { useEnergyTypes } from "./useEnergyTypes";
import { useTasks } from "./useTasks";
import { useZones } from "./useZones";
import { getUncompletedTasks } from "./utils";

export function useEnergyPlannerState() {
  const {
    oneOffTasks,
    repeatingTasks,
    isLoading: tasksLoading,
    addTask: addTaskBase,
    updateTask,
    removeTaskState,
    reorderTasks,
    addTaskToAvailable,
    removeTaskFromAvailable,
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
    addTaskToDayPlan,
    removeFromPlan: removeFromPlanBase,
    toggleTaskCompletion,
    markTaskCompleteOnDate,
    moveTaskToToday,
    moveTaskToUnplanned: moveTaskToUnplannedBase,
    reorderPlannedTasks,
    assignTaskToZone,
  } = useDayPlan(repeatingTasks, updateTask);
  const {
    energyTypes,
    isLoading: typesLoading,
    addEnergyType,
    updateEnergyType,
    removeEnergyType,
  } = useEnergyTypes();
  const {
    zones,
    isLoading: zonesLoading,
    addZone,
    updateZone,
    removeZone,
    reorderZones,
  } = useZones();

  // State for async-computed values
  const [uncompletedTasks, setUncompletedTasks] = useState<
    { task: Task; fromDate: string }[]
  >([]);

  const availableTasks = oneOffTasks;

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

  const addTask = useCallback(
    (taskData: Omit<Task, "id" | "createdAt">) => {
      const newTask = addTaskBase(taskData);

      // If it's repeating, the projection logic in useDayPlan will handle showing it
      // based on the nextDueDate (which defaults to today for new tasks).
      // So no need to manually add to plan.

      return newTask;
    },
    [addTaskBase],
  );

  // Add task to day plan - finds task and coordinates state
  const addToPlan = useCallback(
    (taskId: string, zoneId?: string) => {
      // Find task in one-off tasks
      const task = oneOffTasks.find((t) => t.id === taskId);
      if (!task) {
        // Not a one-off task - might be a repeating task (handled elsewhere)
        return;
      }

      // Add to day plan
      addTaskToDayPlan(task, zoneId);
      // Remove from available tasks
      removeTaskFromAvailable(taskId);
    },
    [oneOffTasks, addTaskToDayPlan, removeTaskFromAvailable],
  );

  // Remove task from day plan and return to available tasks
  const removeFromPlan = useCallback(
    (taskId: string) => {
      // Remove from day plan (returns the removed task)
      const removedTask = removeFromPlanBase(taskId);
      // Add back to available tasks if found
      if (removedTask) {
        // Strip 'completed' when moving back to available tasks
        const { completed: _completed, ...rawTask } = removedTask;
        addTaskToAvailable(rawTask as Task);
      }
    },
    [addTaskToAvailable, removeFromPlanBase],
  );

  // Move task from day plan to available tasks
  const moveTaskToUnplanned = useCallback(
    async (taskId: string, fromDate: string) => {
      // Remove from day plan (returns the removed task)
      const removedTask = await moveTaskToUnplannedBase(taskId, fromDate);
      // Add back to available tasks if found
      if (removedTask) {
        // Strip 'completed' when moving back to available tasks
        const { completed: _completed, ...rawTask } = removedTask;
        addTaskToAvailable(rawTask as Task);
      }
    },
    [addTaskToAvailable, moveTaskToUnplannedBase],
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      // If it's in the one-off list, remove it
      if (oneOffTasks.find((t) => t.id === taskId)) {
        removeTaskState(taskId);
      }
      // If it's in the day plan, remove it (but don't add back to available)
      await removeFromPlanBase(taskId);
    },
    [oneOffTasks, removeTaskState, removeFromPlanBase],
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

  const isLoading =
    tasksLoading || dayPlanLoading || typesLoading || zonesLoading;

  return {
    oneOffTasks,
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
    repeatingTasks,
    energyTypes,
    addEnergyType,
    updateEnergyType,
    removeEnergyType,
    reorderPlannedTasks,
    reorderTasks,
    zones,
    addZone,
    updateZone,
    removeZone,
    reorderZones,
    assignTaskToZone,
  };
}
