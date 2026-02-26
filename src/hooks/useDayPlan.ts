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

/**
 * Merge instances into a persisted order.
 * Instances in storedOrder are placed first in their stored positions,
 * then any new instances (not in storedOrder) are appended.
 */
function mergeInstancesWithOrder(
  instances: PlannedInstance[],
  storedOrder: string[] | undefined,
): PlannedInstance[] {
  if (!storedOrder || storedOrder.length === 0) {
    return instances;
  }

  const instanceMap = new Map(instances.map((i) => [i.id, i]));
  const ordered: PlannedInstance[] = [];

  for (const id of storedOrder) {
    const instance = instanceMap.get(id);
    if (instance) {
      ordered.push(instance);
      instanceMap.delete(id);
    }
  }

  // Append any instances not in the stored order (newly projected)
  for (const instance of instanceMap.values()) {
    ordered.push(instance);
  }

  return ordered;
}

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

  const isActivityDueOnDate = useCallback(
    (activity: Activity, date: string) => checkIsActivityDue(activity, date),
    [],
  );

  const calculateNextDueDate = useCallback(
    (
      currentDueDate: string | undefined,
      config: Activity["repeatConfig"],
    ): string | undefined => {
      if (!(config && currentDueDate)) return;
      const date = new Date(currentDueDate);
      const { frequency, unit } = config;

      // Use UTC methods to stay on the correct calendar date regardless of local time
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
      const storedSourceIds = new Set(
        basePlan.plannedInstances
          .filter((i) => !i.isProjected)
          .map((i) => i.sourceActivityId),
      );

      const projectedInstances: PlannedInstance[] = repeatingActivities
        .filter((ra) => !storedSourceIds.has(ra.id))
        .filter((ra) => isActivityDueOnDate(ra, currentDate))
        .map(
          (ra): PlannedInstance => ({
            id: uuidv4(),
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

  const toggleActivityCompletion = useCallback(
    (instanceId: string) => {
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
    },
    [calculateNextDueDate],
  );

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
        // Avoid duplicates (same sourceActivityId already in plan)
        if (
          prev.plannedInstances.some((i) => i.sourceActivityId === activity.id)
        )
          return prev;
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
        deleteFromPlan(instanceId);

        const nextDate = calculateNextDueDate(
          repeatingActivity.repeatConfig.nextDueDate,
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
    [calculateNextDueDate, dayPlan.plannedInstances, deleteFromPlan],
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
