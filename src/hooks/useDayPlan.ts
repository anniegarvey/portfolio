"use client";

import { useCallback, useEffect, useState } from "react";
import type { DayPlan } from "@/lib/energy-planner/schema";
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
  // Initialize with default values - actual data loaded in useEffect for SSR compatibility
  const [dayPlan, setDayPlan] = useState<DayPlan>({
    date: getTodayDateString(),
    selectedTaskIds: [],
    completedTaskIds: [],
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

  const addToPlan = useCallback((taskId: string) => {
    setDayPlan((p) =>
      p.selectedTaskIds.includes(taskId)
        ? p
        : { ...p, selectedTaskIds: [...p.selectedTaskIds, taskId] },
    );
  }, []);

  const removeFromPlan = useCallback((taskId: string) => {
    setDayPlan((prev) => ({
      ...prev,
      selectedTaskIds: prev.selectedTaskIds.filter((id) => id !== taskId),
      completedTaskIds: (prev.completedTaskIds || []).filter(
        (id) => id !== taskId,
      ),
    }));
  }, []);

  const toggleTaskCompletion = useCallback((taskId: string) => {
    setDayPlan((prev) => {
      const completed = prev.completedTaskIds;
      const isCompleted = completed.includes(taskId);
      return {
        ...prev,
        completedTaskIds: isCompleted
          ? completed.filter((id) => id !== taskId)
          : [...completed, taskId],
      };
    });
  }, []);

  // Mark a task as complete on a specific date (for uncompleted tasks)
  const markTaskCompleteOnDate = useCallback(
    async (taskId: string, date: string) => {
      if (date === currentDate) {
        // If it's the current date, just toggle completion
        setDayPlan((prev) => ({
          ...prev,
          completedTaskIds: prev.completedTaskIds.includes(taskId)
            ? prev.completedTaskIds
            : [...prev.completedTaskIds, taskId],
        }));
      } else {
        // Update the plan for that specific date
        const plan = await getDayPlanForDate(date);
        if (plan) {
          await saveDayPlanForDate(date, {
            ...plan,
            completedTaskIds: plan.completedTaskIds.includes(taskId)
              ? plan.completedTaskIds
              : [...plan.completedTaskIds, taskId],
          });
        }
      }
    },
    [currentDate],
  );

  // Move a task from a past day to today
  const moveTaskToToday = useCallback(
    async (taskId: string, fromDate: string) => {
      const today = getTodayDateString();

      // Remove from the old date
      const oldPlan = await getDayPlanForDate(fromDate);
      if (oldPlan) {
        await saveDayPlanForDate(fromDate, {
          ...oldPlan,
          selectedTaskIds: oldPlan.selectedTaskIds.filter(
            (id) => id !== taskId,
          ),
          completedTaskIds: oldPlan.completedTaskIds.filter(
            (id) => id !== taskId,
          ),
        });
      }

      // Add to today
      if (currentDate === today) {
        setDayPlan((prev) => ({
          ...prev,
          selectedTaskIds: prev.selectedTaskIds.includes(taskId)
            ? prev.selectedTaskIds
            : [...prev.selectedTaskIds, taskId],
        }));
      } else {
        const todayPlan =
          (await getDayPlanForDate(today)) || (await createEmptyDayPlan(today));
        if (!todayPlan.selectedTaskIds.includes(taskId)) {
          await saveDayPlanForDate(today, {
            ...todayPlan,
            selectedTaskIds: [...todayPlan.selectedTaskIds, taskId],
          });
        }
      }
    },
    [currentDate],
  );

  // Return a task to unplanned (remove from day plan entirely)
  const moveTaskToUnplanned = useCallback(
    async (taskId: string, fromDate: string) => {
      if (fromDate === currentDate) {
        removeFromPlan(taskId);
      } else {
        const plan = await getDayPlanForDate(fromDate);
        if (plan) {
          await saveDayPlanForDate(fromDate, {
            ...plan,
            selectedTaskIds: plan.selectedTaskIds.filter((id) => id !== taskId),
            completedTaskIds: plan.completedTaskIds.filter(
              (id) => id !== taskId,
            ),
          });
        }
      }
    },
    [currentDate, removeFromPlan],
  );

  const reorderPlannedTasks = useCallback((itemIds: string[]) => {
    setDayPlan((prev) => ({
      ...prev,
      selectedTaskIds: itemIds,
    }));
  }, []);

  return {
    currentDate,
    dayPlan,
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
    reorderPlannedTasks,
  };
}
