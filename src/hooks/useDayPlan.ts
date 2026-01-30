"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { v4 as uuidv4 } from "uuid";
import type { DayPlan, PlannedTask, Task } from "@/lib/energy-planner/schema";
import {
  createEmptyDayPlan,
  defaultCapacity,
  fetchDayPlanForDate,
  getNextDay,
  getPreviousDay,
  getTodayDateString,
  saveDayPlanForDate,
} from "./utils";

function checkIsTaskDue(task: Task, date: string): boolean {
  if (!task.repeatConfig?.nextDueDate) return false;
  const start = new Date(task.repeatConfig.nextDueDate);
  const target = new Date(date);

  // Ignore time components
  start.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - start.getTime();
  if (diffTime < 0) return false;

  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const { frequency, unit } = task.repeatConfig;

  if (unit === "days") {
    return diffDays % frequency === 0;
  }
  if (unit === "weeks") {
    return diffDays % (frequency * 7) === 0;
  }
  if (unit === "months") {
    if (target.getDate() !== start.getDate()) return false;
    const months =
      (target.getFullYear() - start.getFullYear()) * 12 +
      (target.getMonth() - start.getMonth());
    return months % frequency === 0;
  }
  if (unit === "years") {
    if (target.getDate() !== start.getDate()) return false;
    if (target.getMonth() !== start.getMonth()) return false;
    const years = target.getFullYear() - start.getFullYear();
    return years % frequency === 0;
  }
  return false;
}

export function useDayPlan(
  repeatingTasks: Task[] = [],
  onUpdateTask?: (task: Task) => void,
) {
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());
  const [isLoading, setIsLoading] = useState(true);
  // Version counter to trigger re-renders when storage is modified for other dates
  const [dayPlanVersion, storeDayPlanVersion] = useState(0);
  // Initialize with default values - actual data loaded in useEffect for SSR compatibility
  const [dayPlan, storeDayPlan] = useState<DayPlan>({
    date: getTodayDateString(),
    tasks: [],
    dailyCapacity: defaultCapacity,
  });

  // Use refs to always have access to the latest values in callbacks
  const repeatingTasksRef = useRef(repeatingTasks);
  repeatingTasksRef.current = repeatingTasks;
  const onUpdateTaskRef = useRef(onUpdateTask);
  onUpdateTaskRef.current = onUpdateTask;

  // Helper to check if a task is due on a given date
  const isTaskDueOnDate = useCallback((task: Task, date: string) => {
    return checkIsTaskDue(task, date);
  }, []);

  // Calculate next due date
  const calculateNextDueDate = useCallback(
    (
      currentDueDate: string | undefined,
      config: Task["repeatConfig"],
    ): string | undefined => {
      if (!(config && currentDueDate)) return;
      const date = new Date(currentDueDate);
      const { frequency, unit } = config;

      // Use UTC methods to ensure we stay on the correct "Calendar Date" regardless of local time
      if (unit === "days") date.setUTCDate(date.getUTCDate() + frequency);
      if (unit === "weeks") date.setUTCDate(date.getUTCDate() + frequency * 7);
      if (unit === "months") date.setUTCMonth(date.getUTCMonth() + frequency);
      if (unit === "years")
        date.setUTCFullYear(date.getUTCFullYear() + frequency);

      return date.toISOString().split("T")[0];
    },
    [],
  );

  // Load day plan when date changes
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      const stored = await fetchDayPlanForDate(currentDate);
      if (cancelled) return;

      let basePlan = stored;
      if (!basePlan) {
        basePlan = createEmptyDayPlan(currentDate);
      }

      // Project repeating tasks
      // Filter out tasks that already have a concrete instance in the stored plan
      const storedRepeatingIds = new Set(
        basePlan.tasks.map((t) => t.repeatingTaskId).filter(Boolean),
      );

      const projectedTasks = repeatingTasks
        .filter((rt) => !storedRepeatingIds.has(rt.id))
        .filter((rt) => isTaskDueOnDate(rt, currentDate))
        .map((rt) => ({
          ...rt,
          // Create a virtual ID that is deterministic but unique for this date
          id: `virtual-${rt.id}-${currentDate}`,
          repeatingTaskId: rt.id,
          completed: false,
          // Use the default zone from the repeat config if available
          zoneId: rt.repeatConfig?.defaultZoneId,
          // Add a transient flag we can check at runtime (not in schema but handled in memory)
          isProjected: true,
        }));

      storeDayPlan({
        ...basePlan,
        tasks: [...basePlan.tasks, ...projectedTasks],
      });

      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentDate, repeatingTasks, isTaskDueOnDate]);

  // Save day plan when it changes
  useEffect(() => {
    if (!isLoading) {
      // Filter out projected tasks before saving!
      const tasksToSave = dayPlan.tasks.filter((t) => !t.isProjected);
      // We pass the filtered tasks to save
      saveDayPlanForDate(currentDate, { ...dayPlan, tasks: tasksToSave });
    }
  }, [dayPlan, currentDate, isLoading]);

  const toggleTaskCompletion = useCallback(
    async (taskId: string) => {
      // Get the current values from refs to avoid stale closures
      const currentRepeatingTasks = repeatingTasksRef.current;
      const currentOnUpdateTask = onUpdateTaskRef.current;

      // Use a mutable holder object to capture values from inside the setState callback
      const holder: { update: Task | null; plan: DayPlan | null } = {
        update: null,
        plan: null,
      };

      // Use flushSync to ensure the callback runs synchronously
      flushSync(() => {
        storeDayPlan((prev) => {
          const taskIndex = prev.tasks.findIndex((t) => t.id === taskId);
          if (taskIndex === -1) return prev;

          const task = prev.tasks[taskIndex];
          let newTask = { ...task, completed: !task.completed };

          // Handle Virtual Task completion (Solidification)
          if (task.isProjected && currentOnUpdateTask) {
            // 1. Make concrete
            const concreteId = uuidv4();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { isProjected: _, ...params } = newTask;
            newTask = { ...params, id: concreteId, completed: true };

            // 2. Gather info for repeating task update (will call after save)
            const repeatingTask = currentRepeatingTasks.find(
              (rt) => rt.id === task.repeatingTaskId,
            );
            if (repeatingTask?.repeatConfig) {
              const nextDate = calculateNextDueDate(
                repeatingTask.repeatConfig.nextDueDate,
                repeatingTask.repeatConfig,
              );
              holder.update = {
                ...repeatingTask,
                repeatConfig: {
                  ...repeatingTask.repeatConfig,
                  nextDueDate: nextDate,
                },
              };
            }
          }

          const newTasks = [...prev.tasks];
          newTasks[taskIndex] = newTask;

          holder.plan = {
            ...prev,
            tasks: newTasks,
          };

          return holder.plan;
        });
      });

      // If we have a pending repeating task update, save first then call onUpdateTask
      if (holder.update && currentOnUpdateTask && holder.plan) {
        // Create local const to help TypeScript type narrowing
        const planToSave: DayPlan = holder.plan;
        // Save the updated state to storage
        const tasksToSave = planToSave.tasks.filter((t) => !t.isProjected);
        await saveDayPlanForDate(currentDate, {
          ...planToSave,
          tasks: tasksToSave,
        });
        currentOnUpdateTask(holder.update);
      }
    },
    [calculateNextDueDate, currentDate],
  );

  // Mark a task as complete on a specific date (for uncompleted tasks)
  const markTaskCompleteOnDate = useCallback(
    async (taskId: string, date: string) => {
      if (date === currentDate) {
        toggleTaskCompletion(taskId);
      } else {
        const plan = await fetchDayPlanForDate(date);
        if (plan) {
          const updatedTasks = plan.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: true } : t,
          );
          await saveDayPlanForDate(date, { ...plan, tasks: updatedTasks });
          // Trigger refresh of uncompleted tasks
          storeDayPlanVersion((v) => v + 1);
        }
      }
    },
    [currentDate, toggleTaskCompletion],
  );

  // Add a task directly to the day plan (caller is responsible for managing task state)
  const addTaskToDayPlan = useCallback((task: Task, zoneId?: string) => {
    storeDayPlan((prev) => {
      // Avoid duplicates
      if (prev.tasks.some((t) => t.id === task.id)) return prev;
      return {
        ...prev,
        tasks: [...prev.tasks, { ...task, completed: false, zoneId }],
      };
    });
  }, []);

  // Remove a task from the current day plan and return it (caller handles task state)
  const removeFromPlan = useCallback(
    (taskId: string): PlannedTask | undefined => {
      // Find the task in current state BEFORE updating
      // This ensures we capture the task before the state update
      const removedTask = dayPlan.tasks.find((t) => t.id === taskId);

      if (!removedTask) return undefined;

      storeDayPlan((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
      }));

      return removedTask;
    },
    [dayPlan.tasks],
  );

  // Forcefully remove a task from day plan (no return value, no dependency on current state)
  const deleteFromPlan = useCallback((taskId: string) => {
    storeDayPlan((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
  }, []);

  // Move a task from a past day to today
  const moveTaskToToday = useCallback(
    async (taskId: string, fromDate: string) => {
      const today = getTodayDateString();

      // 1. Get from old date
      const oldPlan = await fetchDayPlanForDate(fromDate);
      if (!oldPlan) return;
      const taskToMove = oldPlan.tasks.find((t) => t.id === taskId);
      if (!taskToMove) return;

      // 2. Remove from old date
      if (currentDate === fromDate) {
        // If we are viewing the fromDate, update state only.
        // The useEffect will handle saving to storage.
        storeDayPlan((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== taskId),
        }));
      } else {
        // Otherwise update storage directly
        const updatedOldTasks = oldPlan.tasks.filter((t) => t.id !== taskId);
        await saveDayPlanForDate(fromDate, {
          ...oldPlan,
          tasks: updatedOldTasks,
        });
      }

      // 3. Add to today
      if (currentDate === today) {
        storeDayPlan((prev) => {
          if (prev.tasks.some((t) => t.id === taskId)) return prev;
          return {
            ...prev,
            tasks: [...prev.tasks, taskToMove],
          };
        });
      } else {
        const todayPlan =
          (await fetchDayPlanForDate(today)) ||
          (await createEmptyDayPlan(today));
        if (!todayPlan.tasks.some((t) => t.id === taskId)) {
          await saveDayPlanForDate(today, {
            ...todayPlan,
            tasks: [...todayPlan.tasks, taskToMove],
          });
        }
      }
      // Trigger refresh of uncompleted tasks
      storeDayPlanVersion((v) => v + 1);
    },
    [currentDate],
  );

  // Return a task to unplanned (remove from day plan, returns the task for caller to handle)
  const moveTaskToUnplanned = useCallback(
    async (
      taskId: string,
      fromDate: string,
    ): Promise<PlannedTask | undefined> => {
      if (fromDate === currentDate) {
        return removeFromPlan(taskId);
      }

      // Remove from other date's plan
      const plan = await fetchDayPlanForDate(fromDate);
      if (plan) {
        const taskToRemove = plan.tasks.find((t) => t.id === taskId);
        if (taskToRemove) {
          // Save plan without the task
          const updatedTasks = plan.tasks.filter((t) => t.id !== taskId);
          await saveDayPlanForDate(fromDate, {
            ...plan,
            tasks: updatedTasks,
          });
          // Trigger refresh of uncompleted tasks
          storeDayPlanVersion((v) => v + 1);
          return taskToRemove;
        }
      }
      return undefined;
    },
    [currentDate, removeFromPlan],
  );

  const reorderPlannedTasksWithIds = useCallback((itemIds: string[]) => {
    storeDayPlan((prev) => {
      const taskMap = new Map(prev.tasks.map((t) => [t.id, t]));
      const newTasks = itemIds
        .map((id) => taskMap.get(id))
        .filter((t): t is typeof t & {} => !!t); // filter loose undefineds

      // If length mismatch, simple safety fallback (don't reorder if data lost)
      if (newTasks.length !== prev.tasks.length) return prev;

      return {
        ...prev,
        tasks: newTasks,
      };
    });
  }, []);

  const navigateToDate = useCallback((date: string) => {
    setCurrentDate(date);
  }, []);

  const goToPreviousDay = useCallback(() => {
    setCurrentDate((prev) => getPreviousDay(prev));
  }, []);

  const goToNextDay = useCallback(() => {
    setCurrentDate((prev) => getNextDay(prev));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(getTodayDateString());
  }, []);

  const setDailyCapacity = useCallback((capacity: DayPlan["dailyCapacity"]) => {
    storeDayPlan((prev) => ({
      ...prev,
      dailyCapacity: capacity,
    }));
  }, []);

  const assignTaskToZone = useCallback((taskId: string, zoneId: string) => {
    storeDayPlan((prev) => {
      const taskIndex = prev.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return prev;

      const task = prev.tasks[taskIndex];
      let newTask = { ...task, zoneId };

      // Handle Virtual Task solidification
      if (task.isProjected) {
        const concreteId = uuidv4();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { isProjected: _, ...params } = newTask;
        newTask = { ...params, id: concreteId };
      }

      const newTasks = [...prev.tasks];
      newTasks[taskIndex] = newTask;

      return {
        ...prev,
        tasks: newTasks,
      };
    });
  }, []);

  return {
    currentDate,
    dayPlan,
    dayPlanVersion,
    isLoading,
    navigateToDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    setDailyCapacity,
    addTaskToDayPlan,
    removeFromPlan,
    toggleTaskCompletion,
    markTaskCompleteOnDate,
    moveTaskToToday,
    moveTaskToUnplanned,
    reorderPlannedTasks: reorderPlannedTasksWithIds,
    assignTaskToZone,
    deleteFromPlan,
  };
}
