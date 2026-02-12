"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { v4 as uuidv4 } from "uuid";
import type {
  Activity,
  DayPlan,
  PlannedActivity,
} from "@/lib/energy-planner/schema";
import {
  createEmptyDayPlan,
  defaultCapacity,
  fetchDayPlanForDate,
  getNextDay,
  getPreviousDay,
  getTodayDateString,
  saveDayPlanForDate,
} from "./utils";

function checkIsActivityDue(activity: Activity, date: string): boolean {
  if (!activity.repeatConfig?.nextDueDate) return false;
  const start = new Date(activity.repeatConfig.nextDueDate);
  const target = new Date(date);

  // Ignore time components
  start.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - start.getTime();
  if (diffTime < 0) return false;

  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const { frequency, unit } = activity.repeatConfig;

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
  repeatingActivities: Activity[] = [],
  onUpdateActivity?: (activity: Activity) => void,
) {
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());
  const [isLoading, setIsLoading] = useState(true);
  // Version counter to trigger re-renders when storage is modified for other dates
  const [dayPlanVersion, storeDayPlanVersion] = useState(0);
  // Initialize with default values - actual data loaded in useEffect for SSR compatibility
  const [dayPlan, storeDayPlan] = useState<DayPlan>({
    date: getTodayDateString(),
    activities: [],
    dailyCapacity: defaultCapacity,
  });

  // Use refs to always have access to the latest values in callbacks
  const repeatingActivitiesRef = useRef(repeatingActivities);
  repeatingActivitiesRef.current = repeatingActivities;
  const onUpdateActivityRef = useRef(onUpdateActivity);
  onUpdateActivityRef.current = onUpdateActivity;

  // Refs for state access inside effects without triggering re-runs
  const dayPlanRef = useRef(dayPlan);
  dayPlanRef.current = dayPlan;
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  // Helper to check if a activity is due on a given date
  const isActivityDueOnDate = useCallback(
    (activity: Activity, date: string) => {
      return checkIsActivityDue(activity, date);
    },
    [],
  );

  // Calculate next due date
  const calculateNextDueDate = useCallback(
    (
      currentDueDate: string | undefined,
      config: Activity["repeatConfig"],
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
      let basePlan: DayPlan | null = null;

      // Optimization: If staying on same day AND not initial load, use current state
      // This preserves unsaved edits that haven't been persisted to storage yet
      if (!isLoadingRef.current && currentDate === dayPlanRef.current.date) {
        basePlan = {
          ...dayPlanRef.current,
          activities: dayPlanRef.current.activities.filter(
            (a) => !a.isProjected,
          ),
        };
      }

      if (!basePlan) {
        basePlan = await fetchDayPlanForDate(currentDate);
      }

      if (cancelled) return;

      if (!basePlan) {
        basePlan = createEmptyDayPlan(currentDate);
      }

      // Project repeating activities
      // Filter out activities that already have a concrete instance in the stored plan
      const storedRepeatingIds = new Set(
        basePlan.activities.map((a) => a.repeatingActivityId).filter(Boolean),
      );

      const projectedActivities = repeatingActivities
        .filter((ra) => !storedRepeatingIds.has(ra.id))
        .filter((ra) => isActivityDueOnDate(ra, currentDate))
        .map((ra) => ({
          ...ra,
          // Create a virtual ID that is deterministic but unique for this date
          id: `virtual-${ra.id}-${currentDate}`,
          repeatingActivityId: ra.id,
          completed: false,
          // Use the default zone from the repeat config if available
          zoneId: ra.repeatConfig?.defaultZoneId,
          // Add a transient flag we can check at runtime (not in schema but handled in memory)
          isProjected: true,
        }));

      storeDayPlan({
        date: basePlan.date,
        dailyCapacity: basePlan.dailyCapacity,
        activities: [...basePlan.activities, ...projectedActivities],
      });

      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentDate, repeatingActivities, isActivityDueOnDate]);

  // Save day plan when it changes
  useEffect(() => {
    if (!isLoading) {
      // Filter out projected activities before saving!
      const activitiesToSave = dayPlan.activities.filter((a) => !a.isProjected);
      // We pass the filtered activities to save
      saveDayPlanForDate(currentDate, {
        ...dayPlan,
        activities: activitiesToSave,
      });
    }
  }, [dayPlan, currentDate, isLoading]);

  const toggleActivityCompletion = useCallback(
    async (activityId: string) => {
      // Get the current values from refs to avoid stale closures
      const currentRepeatingActivities = repeatingActivitiesRef.current;
      const currentOnUpdateActivity = onUpdateActivityRef.current;

      // Use a mutable holder object to capture values from inside the setState callback
      const holder: { update: Activity | null; plan: DayPlan | null } = {
        update: null,
        plan: null,
      };

      // Use flushSync to ensure the callback runs synchronously
      flushSync(() => {
        storeDayPlan((prev) => {
          const activityIndex = prev.activities.findIndex(
            (a) => a.id === activityId,
          );
          if (activityIndex === -1) return prev;

          const activity = prev.activities[activityIndex];
          let newActivity = { ...activity, completed: !activity.completed };

          // Handle Virtual Activity completion (Solidification)
          if (activity.isProjected && currentOnUpdateActivity) {
            // 1. Make concrete
            const concreteId = uuidv4();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { isProjected: _, ...params } = newActivity;
            newActivity = { ...params, id: concreteId, completed: true };

            // 2. Gather info for repeating activity update (will call after save)
            const repeatingActivity = currentRepeatingActivities.find(
              (ra) => ra.id === activity.repeatingActivityId,
            );
            if (repeatingActivity?.repeatConfig) {
              const nextDate = calculateNextDueDate(
                repeatingActivity.repeatConfig.nextDueDate,
                repeatingActivity.repeatConfig,
              );
              holder.update = {
                ...repeatingActivity,
                repeatConfig: {
                  ...repeatingActivity.repeatConfig,
                  nextDueDate: nextDate,
                },
              };
            }
          }

          const newActivities = [...prev.activities];
          newActivities[activityIndex] = newActivity;

          holder.plan = {
            ...prev,
            activities: newActivities,
          };

          return holder.plan;
        });
      });

      // If we have a pending repeating activity update, save first then call onUpdateActivity
      if (holder.update && currentOnUpdateActivity && holder.plan) {
        // Create local const to help TypeScript type narrowing
        const planToSave: DayPlan = holder.plan;
        // Save the updated state to storage
        const activitiesToSave = planToSave.activities.filter(
          (a) => !a.isProjected,
        );
        await saveDayPlanForDate(currentDate, {
          ...planToSave,
          activities: activitiesToSave,
        });
        currentOnUpdateActivity(holder.update);
      }
    },
    [calculateNextDueDate, currentDate],
  );

  // Mark a activity as complete on a specific date (for uncompleted activities)
  const markActivityCompleteOnDate = useCallback(
    async (activityId: string, date: string) => {
      if (date === currentDate) {
        toggleActivityCompletion(activityId);
      } else {
        const plan = await fetchDayPlanForDate(date);
        if (plan) {
          const updatedActivities = plan.activities.map((a: PlannedActivity) =>
            a.id === activityId ? { ...a, completed: true } : a,
          );
          await saveDayPlanForDate(date, {
            ...plan,
            activities: updatedActivities,
          });
          // Trigger refresh of uncompleted activities
          storeDayPlanVersion((v) => v + 1);
        }
      }
    },
    [currentDate, toggleActivityCompletion],
  );

  // Add a activity directly to the day plan (caller is responsible for managing activity state)
  const addActivityToDayPlan = useCallback(
    (activity: Activity, zoneId?: string) => {
      storeDayPlan((prev) => {
        // Avoid duplicates
        if (prev.activities.some((a) => a.id === activity.id)) return prev;
        return {
          ...prev,
          activities: [
            ...prev.activities,
            {
              ...activity,
              completed: false,
              zoneId: zoneId || activity.defaultZoneId,
            },
          ],
        };
      });
    },
    [],
  );

  // Remove a activity from the current day plan and return it (caller handles activity state)
  const removeFromPlan = useCallback(
    (activityId: string): PlannedActivity | undefined => {
      // Find the activity in current state BEFORE updating
      // This ensures we capture the activity before the state update
      const removedActivity = dayPlan.activities.find(
        (a) => a.id === activityId,
      );

      if (!removedActivity) return undefined;

      storeDayPlan((prev) => ({
        ...prev,
        activities: prev.activities.filter((a) => a.id !== activityId),
      }));

      return removedActivity;
    },
    [dayPlan.activities],
  );

  // Forcefully remove a activity from day plan (no return value, no dependency on current state)
  const deleteFromPlan = useCallback((activityId: string) => {
    storeDayPlan((prev) => ({
      ...prev,
      activities: prev.activities.filter((a) => a.id !== activityId),
    }));
  }, []);

  // Move a activity from a past day to today
  const moveActivityToToday = useCallback(
    async (activityId: string, fromDate: string) => {
      const today = getTodayDateString();

      // 1. Get from old date
      const oldPlan = await fetchDayPlanForDate(fromDate);
      if (!oldPlan) return;
      const activityToMove = oldPlan.activities.find(
        (a: PlannedActivity) => a.id === activityId,
      );
      if (!activityToMove) return;

      // 2. Remove from old date
      if (currentDate === fromDate) {
        // If we are viewing the fromDate, update state only.
        // The useEffect will handle saving to storage.
        storeDayPlan((prev) => ({
          ...prev,
          activities: prev.activities.filter(
            (a: PlannedActivity) => a.id !== activityId,
          ),
        }));
      } else {
        // Otherwise update storage directly
        const updatedOldActivities = oldPlan.activities.filter(
          (a: PlannedActivity) => a.id !== activityId,
        );
        await saveDayPlanForDate(fromDate, {
          ...oldPlan,
          activities: updatedOldActivities,
        });
      }

      // 3. Add to today
      if (currentDate === today) {
        storeDayPlan((prev) => {
          if (prev.activities.some((a: PlannedActivity) => a.id === activityId))
            return prev;
          return {
            ...prev,
            activities: [...prev.activities, activityToMove],
          };
        });
      } else {
        const todayPlan =
          (await fetchDayPlanForDate(today)) ||
          (await createEmptyDayPlan(today));
        if (
          !todayPlan.activities.some(
            (a: PlannedActivity) => a.id === activityId,
          )
        ) {
          await saveDayPlanForDate(today, {
            ...todayPlan,
            activities: [...todayPlan.activities, activityToMove],
          });
        }
      }
      // Trigger refresh of uncompleted activities
      storeDayPlanVersion((v) => v + 1);
    },
    [currentDate],
  );

  // Return a activity to unplanned (remove from day plan, returns the activity for caller to handle)
  const moveActivityToUnplanned = useCallback(
    async (
      activityId: string,
      fromDate: string,
    ): Promise<PlannedActivity | undefined> => {
      if (fromDate === currentDate) {
        return removeFromPlan(activityId);
      }

      // Remove from other date's plan
      const plan = await fetchDayPlanForDate(fromDate);
      if (plan) {
        const activityToRemove = plan.activities.find(
          (a: PlannedActivity) => a.id === activityId,
        );
        if (activityToRemove) {
          // Save plan without the activity
          const updatedActivities = plan.activities.filter(
            (a: PlannedActivity) => a.id !== activityId,
          );
          await saveDayPlanForDate(fromDate, {
            ...plan,
            activities: updatedActivities,
          });
          // Trigger refresh of uncompleted activities
          storeDayPlanVersion((v) => v + 1);
          return activityToRemove;
        }
      }
      return undefined;
    },
    [currentDate, removeFromPlan],
  );

  const reorderPlannedActivitiesWithIds = useCallback((itemIds: string[]) => {
    storeDayPlan((prev) => {
      const activityMap = new Map(
        prev.activities.map((a: PlannedActivity) => [a.id, a]),
      );
      const newActivities = itemIds
        .map((id) => activityMap.get(id))
        .filter((a): a is PlannedActivity => !!a); // filter loose undefineds

      // If length mismatch, simple safety fallback (don't reorder if data lost)
      if (newActivities.length !== prev.activities.length) return prev;

      return {
        ...prev,
        activities: newActivities,
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

  const assignActivityToZone = useCallback(
    (activityId: string, zoneId: string) => {
      storeDayPlan((prev) => {
        const activityIndex = prev.activities.findIndex(
          (a) => a.id === activityId,
        );
        if (activityIndex === -1) return prev;

        const activity = prev.activities[activityIndex];
        let newActivity = { ...activity, zoneId };

        // Handle Virtual Activity solidification
        if (activity.isProjected) {
          const concreteId = uuidv4();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { isProjected: _, ...params } = newActivity;
          newActivity = { ...params, id: concreteId };
        }

        const newActivities = [...prev.activities];
        newActivities[activityIndex] = newActivity;

        return {
          ...prev,
          activities: newActivities,
        };
      });
    },
    [],
  );

  const updatePlannedActivity = useCallback((updatedActivity: Activity) => {
    storeDayPlan((prev) => {
      const activityIndex = prev.activities.findIndex(
        (a) => a.id === updatedActivity.id,
      );
      if (activityIndex === -1) return prev;

      const existingActivity = prev.activities[activityIndex];
      const newActivity = {
        ...existingActivity,
        ...updatedActivity,
      };

      const newActivities = [...prev.activities];
      newActivities[activityIndex] = newActivity;

      return {
        ...prev,
        activities: newActivities,
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
    addActivityToDayPlan,
    removeFromPlan,
    toggleActivityCompletion,
    markActivityCompleteOnDate,
    moveActivityToToday,
    moveActivityToUnplanned,
    reorderPlannedActivities: reorderPlannedActivitiesWithIds,
    assignActivityToZone,
    deleteFromPlan,
    updatePlannedActivity,
  };
}
