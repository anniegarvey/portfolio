"use client";

import { useCallback, useEffect, useState } from "react";
import type { DayPlan } from "@/lib/energy-planner/schema";
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

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Hook with multiple state management functions
export function useDayPlan() {
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

  // Load day plan when date changes
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      const stored = await getDayPlanForDate(currentDate);
      if (cancelled) return;

      if (stored) {
        setDayPlan(stored);
      } else {
        const empty = await createEmptyDayPlan(currentDate);
        if (cancelled) return;
        setDayPlan(empty);
      }
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentDate]);

  // Save day plan when it changes
  useEffect(() => {
    if (!isLoading) {
      saveDayPlanForDate(currentDate, dayPlan);
    }
  }, [dayPlan, currentDate, isLoading]);

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

  const addToPlan = useCallback(async (taskId: string) => {
    // 1. Get task from one-off store
    const oneOffTasks = await getOneOffTasks();
    const taskIndex = oneOffTasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      console.error("Task not found in oneOffTasks", taskId);
      // Task might already be in the plan (race condition?) or doesn't exist
      return;
    }
    const task = oneOffTasks[taskIndex];

    // 2. Remove from one-off store
    const newOneOffTasks = [...oneOffTasks];
    newOneOffTasks.splice(taskIndex, 1);
    await setOneOffTasks(newOneOffTasks);

    // 3. Add to day plan
    setDayPlan((prev) => {
      // Avoid duplicates just in case
      if (prev.tasks.some((t) => t.id === taskId)) return prev;
      return {
        ...prev,
        tasks: [...prev.tasks, { ...task, completed: false }],
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

  const toggleTaskCompletion = useCallback((taskId: string) => {
    setDayPlan((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t,
      ),
    }));
  }, []);

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

  return {
    currentDate,
    dayPlan,
    dayPlanVersion,
    isLoading,
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
    reorderPlannedTasks: reorderPlannedTasksWithIds,
  };
}
