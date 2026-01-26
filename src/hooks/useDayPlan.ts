"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { DayPlan, RepeatingTask, Task } from "@/lib/energy-planner/schema";
import { getOneOffTasks, setOneOffTasks } from "@/lib/energy-planner/storage";
import {
  createEmptyDayPlan,
  defaultCapacity,
  getDayPlanForDate,
  getNextDay,
  getPreviousDay,
  getTodayDateString,
  saveDayPlanForDate,
} from "./utils";

function checkIsTaskDue(task: RepeatingTask, date: string): boolean {
  const start = new Date(task.nextDueDate);
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
  repeatingTasks: RepeatingTask[] = [],
  onUpdateTask?: (task: Task) => void,
) {
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());
  const [isLoading, setIsLoading] = useState(true);
  // Version counter to trigger re-renders when storage is modified for other dates
  const [dayPlanVersion, setDayPlanVersion] = useState(0);
  // Initialize with default values - actual data loaded in useEffect for SSR compatibility
  const [dayPlan, setDayPlan] = useState<DayPlan>({
    date: getTodayDateString(),
    tasks: [],
    dailyCapacity: defaultCapacity,
  });

  // Helper to check if a task is due on a given date
  const isTaskDueOnDate = useCallback((task: RepeatingTask, date: string) => {
    return checkIsTaskDue(task, date);
  }, []);

  // Calculate next due date
  const calculateNextDueDate = useCallback(
    (currentDueDate: string, config: RepeatingTask["repeatConfig"]): string => {
      const date = new Date(currentDueDate);
      const { frequency, unit } = config;

      if (unit === "days") date.setDate(date.getDate() + frequency);
      if (unit === "weeks") date.setDate(date.getDate() + frequency * 7);
      if (unit === "months") date.setMonth(date.getMonth() + frequency);
      if (unit === "years") date.setFullYear(date.getFullYear() + frequency);

      return date.toISOString().split("T")[0];
    },
    [],
  );

  // Load day plan when date changes
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      const stored = await getDayPlanForDate(currentDate);
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
          // Add a transient flag we can check at runtime (not in schema but handled in memory)
          isProjected: true,
        }));

      setDayPlan({
        ...basePlan,
        tasks: [...basePlan.tasks, ...projectedTasks],
      });

      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentDate, repeatingTasks, isTaskDueOnDate]); // Added repeatingTasks dependency

  // Save day plan when it changes
  useEffect(() => {
    if (!isLoading) {
      // Filter out projected tasks before saving!
      const tasksToSave = dayPlan.tasks.filter((t) => !t.isProjected);
      // Only save if we have actual changes (optimization? checking strict equality might be enough if react handles it)
      // We pass the filtered tasks to save
      saveDayPlanForDate(currentDate, { ...dayPlan, tasks: tasksToSave });
    }
  }, [dayPlan, currentDate, isLoading]);

  const toggleTaskCompletion = useCallback(
    (taskId: string) => {
      setDayPlan((prev) => {
        const taskIndex = prev.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex === -1) return prev;

        const task = prev.tasks[taskIndex];
        const isProjected = task.isProjected;

        let newTask = { ...task, completed: !task.completed };

        // Handle Virtual Task completion (Solidification)
        if (isProjected && onUpdateTask) {
          // 1. Make concrete
          const concreteId = uuidv4();
          // Remove isProjected flag
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { isProjected: _, ...params } = newTask;
          newTask = { ...params, id: concreteId, completed: true }; // Assuming user clicked to complete

          // 2. Update Repeating Task Definition (Shift schedule)
          const repeatingTask = repeatingTasks.find(
            (rt) => rt.id === task.repeatingTaskId,
          );
          if (repeatingTask) {
            const nextDate = calculateNextDueDate(
              repeatingTask.nextDueDate,
              repeatingTask.repeatConfig,
            );
            onUpdateTask({ ...repeatingTask, nextDueDate: nextDate } as Task);
          }
        }

        const newTasks = [...prev.tasks];
        newTasks[taskIndex] = newTask;

        return {
          ...prev,
          tasks: newTasks,
        };
      });
    },
    [repeatingTasks, onUpdateTask, calculateNextDueDate],
  );

  // Mark a task as complete on a specific date (for uncompleted tasks)
  const markTaskCompleteOnDate = useCallback(
    async (taskId: string, date: string) => {
      if (date === currentDate) {
        toggleTaskCompletion(taskId);
      } else {
        const plan = await getDayPlanForDate(date);
        if (plan) {
          const updatedTasks = plan.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: true } : t,
          );
          await saveDayPlanForDate(date, { ...plan, tasks: updatedTasks });
          // Trigger refresh of uncompleted tasks
          setDayPlanVersion((v) => v + 1);
        }
      }
    },
    [currentDate, toggleTaskCompletion],
  );

  const addToPlan = useCallback(async (taskId: string, zoneId?: string) => {
    // 1. Get task from one-off store
    const oneOffTasks = await getOneOffTasks();
    const taskIndex = oneOffTasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      // Task might already be in the plan (race condition?) or doesn't exist
      // Or it is a repeating task (handled elsewhere)
      return;
    }
    const task = oneOffTasks[taskIndex];

    // 2. Remove from one-off store
    const newOneOffTasks = [...oneOffTasks];
    newOneOffTasks.splice(taskIndex, 1);
    await setOneOffTasks(newOneOffTasks);

    // 3. Add to day plan with optional zone assignment
    setDayPlan((prev) => {
      // Avoid duplicates just in case
      if (prev.tasks.some((t) => t.id === taskId)) return prev;
      return {
        ...prev,
        tasks: [...prev.tasks, { ...task, completed: false, zoneId }],
      };
    });
  }, []);

  const removeFromPlan = useCallback(async (taskId: string) => {
    // We typically only remove from the *current* day plan in this hook's context
    // But we need to handle the transaction: remove from day, add to one-off

    // NOTE: We can't easily perform this transaction purely synchronously with setDayPlan
    // because we need to read/write one-off tasks.
    // However, for UI responsiveness, we update local state immediately.

    setDayPlan((prev) => {
      const taskToRemove = prev.tasks.find((t) => t.id === taskId);
      if (!taskToRemove) return prev;

      // Async side effect to update one-off tasks
      // This is a bit risky if component unmounts, but typical for this simple app
      (async () => {
        const oneOffTasks = await getOneOffTasks();
        // Check if already there
        if (!oneOffTasks.some((t) => t.id === taskId)) {
          // Strip 'completed' when moving back to one-off
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { completed: _completed, ...rawTask } = taskToRemove;
          await setOneOffTasks([...oneOffTasks, rawTask]);
        }
      })();

      return {
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
      };
    });
  }, []);

  // Move a task from a past day to today
  const moveTaskToToday = useCallback(
    async (taskId: string, fromDate: string) => {
      const today = getTodayDateString();

      // 1. Get from old date
      const oldPlan = await getDayPlanForDate(fromDate);
      if (!oldPlan) return;
      const taskToMove = oldPlan.tasks.find((t) => t.id === taskId);
      if (!taskToMove) return;

      // 2. Remove from old date
      if (currentDate === fromDate) {
        // If we are viewing the fromDate, update state only.
        // The useEffect will handle saving to storage.
        setDayPlan((prev) => ({
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
        setDayPlan((prev) => {
          if (prev.tasks.some((t) => t.id === taskId)) return prev;
          return {
            ...prev,
            tasks: [...prev.tasks, taskToMove],
          };
        });
      } else {
        const todayPlan =
          (await getDayPlanForDate(today)) || (await createEmptyDayPlan(today));
        if (!todayPlan.tasks.some((t) => t.id === taskId)) {
          await saveDayPlanForDate(today, {
            ...todayPlan,
            tasks: [...todayPlan.tasks, taskToMove],
          });
        }
      }
      // Trigger refresh of uncompleted tasks
      setDayPlanVersion((v) => v + 1);
    },
    [currentDate],
  );

  // Return a task to unplanned (remove from day plan entirely)
  const moveTaskToUnplanned = useCallback(
    async (taskId: string, fromDate: string) => {
      if (fromDate === currentDate) {
        removeFromPlan(taskId);
      } else {
        // Remove from other date's plan
        const plan = await getDayPlanForDate(fromDate);
        if (plan) {
          const taskToRemove = plan.tasks.find((t) => t.id === taskId);
          if (taskToRemove) {
            // Add back to one-off
            const oneOffTasks = await getOneOffTasks();
            if (!oneOffTasks.some((t) => t.id === taskId)) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { ...rawTask } = taskToRemove;
              await setOneOffTasks([...oneOffTasks, rawTask]);
            }

            // Save plan
            const updatedTasks = plan.tasks.filter((t) => t.id !== taskId);
            await saveDayPlanForDate(fromDate, {
              ...plan,
              tasks: updatedTasks,
            });
            // Trigger refresh of uncompleted tasks
            setDayPlanVersion((v) => v + 1);
          }
        }
      }
    },
    [currentDate, removeFromPlan],
  );

  const reorderPlannedTasksWithIds = useCallback((itemIds: string[]) => {
    setDayPlan((prev) => {
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

  const setDailyCapacity = useCallback((capacity: any) => {
    setDayPlan((prev) => ({
      ...prev,
      dailyCapacity: capacity,
    }));
  }, []);

  const assignTaskToZone = useCallback((taskId: string, zoneId: string) => {
    setDayPlan((prev) => {
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
    addToPlan,
    removeFromPlan,
    toggleTaskCompletion,
    markTaskCompleteOnDate,
    moveTaskToToday,
    moveTaskToUnplanned,
    reorderPlannedTasks: reorderPlannedTasksWithIds,
    assignTaskToZone,
  };
}
