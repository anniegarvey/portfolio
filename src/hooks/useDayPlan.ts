"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  Activity,
  DayPlan,
  PlannedInstance,
  ResolvedActivity,
} from "@/lib/energy-planner/schema";
import {
  calculateNextDueDate,
  checkIsActivityDue,
  mergeInstancesWithOrder,
  projectedInstanceId,
} from "./dayPlanUtils";
import {
  createEmptyDayPlan,
  defaultCapacity,
  fetchDayPlanForDate,
  getNextDay,
  getPreviousDay,
  getTodayDateString,
  saveDayPlanForDate,
} from "./utils";

export function useDayPlan(
  repeatingActivities: Activity[] = [],
  onUpdateActivity?: (activity: Activity) => void,
) {
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());
  const [isLoading, setIsLoading] = useState(true);
  // Version counter to trigger re-renders when storage is modified for other dates
  const [dayPlanVersion, storeDayPlanVersion] = useState(0);
  const [dayPlan, storeDayPlan] = useState<DayPlan>({
    date: getTodayDateString(),
    plannedInstances: [],
    dailyCapacity: defaultCapacity,
  });

  // Use refs to always have access to the latest values in callbacks
  const repeatingActivitiesRef = useRef(repeatingActivities);
  repeatingActivitiesRef.current = repeatingActivities;
  const onUpdateActivityRef = useRef(onUpdateActivity);
  onUpdateActivityRef.current = onUpdateActivity;

  const dayPlanRef = useRef(dayPlan);
  dayPlanRef.current = dayPlan;
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  // Load day plan when date changes
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      let basePlan: DayPlan | null = null;

      // Optimization: If staying on same day AND not initial load, use current state
      if (!isLoadingRef.current && currentDate === dayPlanRef.current.date) {
        basePlan = {
          ...dayPlanRef.current,
          plannedInstances: dayPlanRef.current.plannedInstances.filter(
            (i) => !i.isProjected,
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

      // Project repeating activities that don't already have a concrete instance
      // and weren't explicitly skipped for this date
      const storedSourceIds = new Set(
        basePlan.plannedInstances
          .filter((i) => !i.isProjected)
          .map((i) => i.sourceActivityId),
      );
      const skippedIds = new Set(basePlan.skippedSourceActivityIds ?? []);

      const projectedInstances: PlannedInstance[] = repeatingActivities
        .filter((ra) => !storedSourceIds.has(ra.id))
        .filter((ra) => !skippedIds.has(ra.id))
        .filter((ra) => checkIsActivityDue(ra, currentDate))
        .map(
          (ra): PlannedInstance => ({
            id: projectedInstanceId(ra.id, currentDate),
            sourceActivityId: ra.id,
            zoneId: ra.repeatConfig?.defaultZoneId,
            completed: false,
            isProjected: true,
          }),
        );

      // Merge stored and projected instances using persisted order
      const allInstances = [
        ...basePlan.plannedInstances,
        ...projectedInstances,
      ];
      const orderedInstances = mergeInstancesWithOrder(
        allInstances,
        basePlan.activityOrder,
      );

      storeDayPlan({
        date: basePlan.date,
        dailyCapacity: basePlan.dailyCapacity,
        plannedInstances: orderedInstances,
        activityOrder: basePlan.activityOrder,
        skippedSourceActivityIds: basePlan.skippedSourceActivityIds,
      });

      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentDate, repeatingActivities]);

  // Save day plan when it changes
  useEffect(() => {
    if (!isLoading) {
      // Filter out projected instances before saving
      const instancesToSave = dayPlan.plannedInstances.filter(
        (i) => !i.isProjected,
      );
      const activityOrder = dayPlan.plannedInstances.map((i) => i.id);
      saveDayPlanForDate(currentDate, {
        ...dayPlan,
        plannedInstances: instancesToSave,
        activityOrder,
      });
    }
  }, [dayPlan, currentDate, isLoading]);

  const toggleActivityCompletion = useCallback((instanceId: string) => {
    storeDayPlan((prev) => {
      const idx = prev.plannedInstances.findIndex((i) => i.id === instanceId);
      if (idx === -1) return prev;

      const instance = prev.plannedInstances[idx];
      const isCompleting = !instance.completed;
      const updatedInstance: PlannedInstance = {
        ...instance,
        completed: isCompleting,
        // Solidify on any interaction
        isProjected: undefined,
      };

      const newInstances = [...prev.plannedInstances];
      newInstances[idx] = updatedInstance;

      // When completing a projected repeating instance, advance the nextDueDate
      if (isCompleting && instance.isProjected) {
        const repeatingActivity = repeatingActivitiesRef.current.find(
          (ra) => ra.id === instance.sourceActivityId,
        );
        if (repeatingActivity?.repeatConfig && onUpdateActivityRef.current) {
          const nextDate = calculateNextDueDate(
            repeatingActivity.repeatConfig.nextDueDate,
            repeatingActivity.repeatConfig,
          );
          onUpdateActivityRef.current({
            ...repeatingActivity,
            repeatConfig: {
              ...repeatingActivity.repeatConfig,
              nextDueDate: nextDate,
            },
          });
        }
      }

      return { ...prev, plannedInstances: newInstances };
    });
  }, []);

  // Mark an instance as complete on a specific date (for uncompleted activities)
  const markActivityCompleteOnDate = useCallback(
    async (instanceId: string, date: string) => {
      if (date === currentDate) {
        toggleActivityCompletion(instanceId);
      } else {
        const plan = await fetchDayPlanForDate(date);
        if (plan) {
          const updatedInstances = plan.plannedInstances.map((i) =>
            i.id === instanceId ? { ...i, completed: true } : i,
          );
          await saveDayPlanForDate(date, {
            ...plan,
            plannedInstances: updatedInstances,
          });
          storeDayPlanVersion((v) => v + 1);
        }
      }
    },
    [currentDate, toggleActivityCompletion],
  );

  // Add a one-off activity to today's plan
  const addActivityToDayPlan = useCallback(
    (activity: Activity, zoneId?: string) => {
      storeDayPlan((prev) => {
        // Avoid duplicates (same sourceActivityId already in plan, explicitly concrete)
        if (
          prev.plannedInstances.some(
            (i) => i.sourceActivityId === activity.id && !i.isProjected,
          )
        ) {
          return prev;
        }

        const newInstance: PlannedInstance = {
          id: uuidv4(),
          sourceActivityId: activity.id,
          zoneId: zoneId ?? activity.defaultZoneId,
          completed: false,
        };
        return {
          ...prev,
          plannedInstances: [...prev.plannedInstances, newInstance],
        };
      });
    },
    [],
  );

  // Remove an instance from the current day plan (returns the instance for callers)
  const removeFromPlan = useCallback(
    (instanceId: string): PlannedInstance | undefined => {
      const removed = dayPlan.plannedInstances.find((i) => i.id === instanceId);
      if (!removed) return undefined;

      storeDayPlan((prev) => ({
        ...prev,
        plannedInstances: prev.plannedInstances.filter(
          (i) => i.id !== instanceId,
        ),
      }));

      return removed;
    },
    [dayPlan.plannedInstances],
  );

  // Forcefully remove an instance (no return value)
  const deleteFromPlan = useCallback((instanceId: string) => {
    storeDayPlan((prev) => ({
      ...prev,
      plannedInstances: prev.plannedInstances.filter(
        (i) => i.id !== instanceId,
      ),
    }));
  }, []);

  // Move an instance from a past day to today
  const moveActivityToToday = useCallback(
    async (instanceId: string, fromDate: string) => {
      const today = getTodayDateString();

      const oldPlan = await fetchDayPlanForDate(fromDate);
      if (!oldPlan) return;
      const instanceToMove = oldPlan.plannedInstances.find(
        (i) => i.id === instanceId,
      );
      if (!instanceToMove) return;

      // Remove from old date
      if (currentDate === fromDate) {
        storeDayPlan((prev) => ({
          ...prev,
          plannedInstances: prev.plannedInstances.filter(
            (i) => i.id !== instanceId,
          ),
        }));
      } else {
        await saveDayPlanForDate(fromDate, {
          ...oldPlan,
          plannedInstances: oldPlan.plannedInstances.filter(
            (i) => i.id !== instanceId,
          ),
        });
      }

      // Add to today
      if (currentDate === today) {
        storeDayPlan((prev) => {
          if (prev.plannedInstances.some((i) => i.id === instanceId))
            return prev;
          return {
            ...prev,
            plannedInstances: [...prev.plannedInstances, instanceToMove],
          };
        });
      } else {
        const todayPlan =
          (await fetchDayPlanForDate(today)) || createEmptyDayPlan(today);
        if (!todayPlan.plannedInstances.some((i) => i.id === instanceId)) {
          await saveDayPlanForDate(today, {
            ...todayPlan,
            plannedInstances: [...todayPlan.plannedInstances, instanceToMove],
          });
        }
      }

      storeDayPlanVersion((v) => v + 1);
    },
    [currentDate],
  );

  // Return an instance to "unplanned" — removes from plan, returns it to caller
  const moveActivityToUnplanned = useCallback(
    async (
      instanceId: string,
      fromDate: string,
    ): Promise<PlannedInstance | undefined> => {
      if (fromDate === currentDate) {
        return removeFromPlan(instanceId);
      }

      const plan = await fetchDayPlanForDate(fromDate);
      if (plan) {
        const instanceToRemove = plan.plannedInstances.find(
          (i) => i.id === instanceId,
        );
        if (instanceToRemove) {
          await saveDayPlanForDate(fromDate, {
            ...plan,
            plannedInstances: plan.plannedInstances.filter(
              (i) => i.id !== instanceId,
            ),
          });
          storeDayPlanVersion((v) => v + 1);
          return instanceToRemove;
        }
      }
      return undefined;
    },
    [currentDate, removeFromPlan],
  );

  // Move an instance to a specific future date (creates a fresh instance on that date)
  const moveActivityToDate = useCallback(
    async (instanceId: string, targetDate: string) => {
      const removedInstance = removeFromPlan(instanceId);
      if (!removedInstance) return;

      const targetPlan =
        (await fetchDayPlanForDate(targetDate)) ||
        createEmptyDayPlan(targetDate);

      // Create a clean new instance for the target date (not projected, not completed)
      const newInstance: PlannedInstance = {
        id: uuidv4(),
        sourceActivityId: removedInstance.sourceActivityId,
        zoneId: removedInstance.zoneId,
        completed: false,
      };

      await saveDayPlanForDate(targetDate, {
        ...targetPlan,
        plannedInstances: [...targetPlan.plannedInstances, newInstance],
      });
    },
    [removeFromPlan],
  );

  const skipActivity = useCallback(
    (instanceId: string) => {
      const instance = dayPlan.plannedInstances.find(
        (i) => i.id === instanceId,
      );
      if (!instance) return;

      const repeatingActivity = repeatingActivitiesRef.current.find(
        (ra) => ra.id === instance.sourceActivityId,
      );

      if (repeatingActivity?.repeatConfig && onUpdateActivityRef.current) {
        // Record the skip in the day plan so it survives a reload even if the
        // activity's nextDueDate update hasn't been flushed to IndexedDB yet.
        storeDayPlan((prev) => ({
          ...prev,
          plannedInstances: prev.plannedInstances.filter(
            (i) => i.id !== instanceId,
          ),
          skippedSourceActivityIds: [
            ...(prev.skippedSourceActivityIds ?? []),
            instance.sourceActivityId,
          ],
        }));

        const nextDate = calculateNextDueDate(
          currentDate,
          repeatingActivity.repeatConfig,
        );

        if (nextDate) {
          onUpdateActivityRef.current({
            ...repeatingActivity,
            repeatConfig: {
              ...repeatingActivity.repeatConfig,
              nextDueDate: nextDate,
            },
          });
        }
      }
    },
    [currentDate, dayPlan.plannedInstances],
  );

  const reorderPlannedActivitiesWithIds = useCallback((itemIds: string[]) => {
    storeDayPlan((prev) => {
      const instanceMap = new Map(prev.plannedInstances.map((i) => [i.id, i]));
      const newInstances = itemIds
        .map((id) => instanceMap.get(id))
        .filter((i): i is PlannedInstance => !!i);

      if (newInstances.length !== prev.plannedInstances.length) return prev;

      return { ...prev, plannedInstances: newInstances };
    });
  }, []);

  const assignActivityToZone = useCallback(
    (instanceId: string, zoneId: string) => {
      storeDayPlan((prev) => {
        const idx = prev.plannedInstances.findIndex((i) => i.id === instanceId);
        if (idx === -1) return prev;

        const newInstances = [...prev.plannedInstances];
        newInstances[idx] = {
          ...newInstances[idx],
          zoneId,
          // Solidify on any interaction
          isProjected: undefined,
        };

        return { ...prev, plannedInstances: newInstances };
      });
    },
    [],
  );

  const navigateToDate = useCallback((date: string) => {
    setIsLoading(true);
    setCurrentDate(date);
  }, []);

  const goToPreviousDay = useCallback(() => {
    setIsLoading(true);
    setCurrentDate((prev) => getPreviousDay(prev));
  }, []);

  const goToNextDay = useCallback(() => {
    setIsLoading(true);
    setCurrentDate((prev) => getNextDay(prev));
  }, []);

  const goToToday = useCallback(() => {
    setIsLoading(true);
    setCurrentDate(getTodayDateString());
  }, []);

  const setDailyCapacity = useCallback((capacity: DayPlan["dailyCapacity"]) => {
    storeDayPlan((prev) => ({ ...prev, dailyCapacity: capacity }));
  }, []);

  /**
   * Resolve the current day plan's instances against an activity map.
   * Returns only instances whose source activity still exists.
   */
  const resolveActivities = useCallback(
    (activityMap: Map<string, Activity>): ResolvedActivity[] => {
      return dayPlan.plannedInstances.flatMap((instance) => {
        const activity = activityMap.get(instance.sourceActivityId);
        if (!activity) return []; // Dangling reference — activity was deleted
        return [{ instance, activity }];
      });
    },
    [dayPlan.plannedInstances],
  );

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
    moveActivityToDate,
    reorderPlannedActivities: reorderPlannedActivitiesWithIds,
    assignActivityToZone,
    deleteFromPlan,
    resolveActivities,
    skipActivity,
  };
}
