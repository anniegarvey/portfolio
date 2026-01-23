"use client";

import { useCallback, useEffect, useState } from "react";
import type { EnergyCost, Task } from "@/lib/energy-planner/schema";
import { calculateEnergyUsage as calcUsage } from "@/lib/energy-planner/utils";
import { useDayPlan } from "./useDayPlan";
import { useEnergyTypes } from "./useEnergyTypes";
import { useTasks } from "./useTasks";
import { getUncompletedTasks } from "./utils";

export function useEnergyPlannerState() {
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
    addToPlan: addToPlanBase,
    removeFromPlan: removeFromPlanBase,
    toggleTaskCompletion,
    markTaskCompleteOnDate,
    moveTaskToToday,
    moveTaskToUnplanned: moveTaskToUnplannedBase,
    reorderPlannedTasks,
  } = useDayPlan();
  const {
    tasks,
    isLoading: tasksLoading,
    addTask,
    updateTask,
    removeTaskState,
    reorderTasks,
    addTaskToAvailable,
    removeTaskFromAvailable,
  } = useTasks();
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

  // Wrap addToPlan to also remove from local tasks state
  const addToPlan = useCallback(
    async (taskId: string) => {
      // Update storage and day plan first
      await addToPlanBase(taskId);
      // Then remove from local state
      removeTaskFromAvailable(taskId);
    },
    [addToPlanBase, removeTaskFromAvailable],
  );

  // Wrap removeFromPlan to also add back to local tasks state
  const removeFromPlan = useCallback(
    async (taskId: string) => {
      // Find the task in the day plan before removing
      const taskToRemove = dayPlan.tasks.find((t) => t.id === taskId);
      // Update storage and day plan first
      await removeFromPlanBase(taskId);
      // Then add to local state
      if (taskToRemove) {
        // Strip 'completed' when moving back to available tasks
        const { completed: _completed, ...rawTask } = taskToRemove;
        addTaskToAvailable(rawTask as Task);
      }
    },
    [dayPlan.tasks, addTaskToAvailable, removeFromPlanBase],
  );

  // Wrap moveTaskToUnplanned to also add back to local tasks state
  const moveTaskToUnplanned = useCallback(
    async (taskId: string, fromDate: string) => {
      // Get the task to add back to available tasks
      let taskToAdd: Task | undefined;

      if (fromDate === currentDate) {
        // For current date, get from local day plan
        const taskInPlan = dayPlan.tasks.find((t) => t.id === taskId);
        if (taskInPlan) {
          // Strip 'completed' when moving back to available tasks
          const { completed: _completed, ...rawTask } = taskInPlan;
          taskToAdd = rawTask as Task;
        }
      } else {
        // For other dates, we need to get from storage
        const { getDayPlanForDate } = await import("./utils");
        const plan = await getDayPlanForDate(fromDate);
        if (plan) {
          const taskInPlan = plan.tasks.find((t) => t.id === taskId);
          if (taskInPlan) {
            // Strip 'completed' when moving back to available tasks
            const { completed: _completed, ...rawTask } = taskInPlan;
            taskToAdd = rawTask as Task;
          }
        }
      }

      // Update storage and day plan first
      await moveTaskToUnplannedBase(taskId, fromDate);

      // Then add to local state
      if (taskToAdd) {
        addTaskToAvailable(taskToAdd);
      }
    },
    [currentDate, dayPlan.tasks, addTaskToAvailable, moveTaskToUnplannedBase],
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      // If it's in the one-off list, remove it
      if (tasks.find((t) => t.id === taskId)) {
        removeTaskState(taskId);
      }
      // If it's in the day plan, remove it (but don't add back to available)
      await removeFromPlanBase(taskId);
    },
    [tasks, removeTaskState, removeFromPlanBase],
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
