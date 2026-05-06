"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  Activity,
  DayPlan,
  PlannedInstance,
  ResolvedActivity,
} from "@/lib/energy-planner/schema";
import { mergeInstancesWithOrder } from "./dayPlanUtils";
import { useProjectedActivities } from "./useProjectedActivities";
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
  const [dayPlanVersion, storeDayPlanVersion] = useState(0);
  // basePlan holds only concrete (non-projected) instances
  const [basePlan, setBasePlan] = useState<DayPlan>({
    date: getTodayDateString(),
    plannedInstances: [],
    dailyCapacity: defaultCapacity,
  });

  const basePlanRef = useRef(basePlan);
  basePlanRef.current = basePlan;
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;
  const onUpdateActivityRef = useRef(onUpdateActivity);
  onUpdateActivityRef.current = onUpdateActivity;

  const onSkip = useCallback((sourceActivityId: string) => {
    setBasePlan((prev) => ({
      ...prev,
      skippedSourceActivityIds: [
        ...(prev.skippedSourceActivityIds ?? []),
        sourceActivityId,
      ],
    }));
  }, []);

  const { projectedInstances, handleComplete, handleSkip } =
    useProjectedActivities({
      repeatingActivities,
      basePlan,
      date: currentDate,
      onUpdateActivity: onUpdateActivityRef.current ?? (() => {}),
      onSkip,
    });

  // Merge concrete + projected instances into a single ordered list for consumers
  const dayPlan = useMemo(
    () => ({
      ...basePlan,
      plannedInstances: mergeInstancesWithOrder(
        [...basePlan.plannedInstances, ...projectedInstances],
        basePlan.activityOrder,
      ),
    }),
    [basePlan, projectedInstances],
  );

  const projectedInstancesRef = useRef(projectedInstances);
  projectedInstancesRef.current = projectedInstances;

  // Load day plan when date changes (no longer depends on repeatingActivities —
  // projections are derived reactively by useProjectedActivities)
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      let loaded: DayPlan | null = null;

      // Optimization: same day and not initial load — reuse current concrete state
      if (!isLoadingRef.current && currentDate === basePlanRef.current.date) {
        loaded = basePlanRef.current;
      }

      if (!loaded) {
        loaded = await fetchDayPlanForDate(currentDate);
      }

      if (cancelled) return;

      setBasePlan(loaded ?? createEmptyDayPlan(currentDate));
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentDate]);

  // Save whenever the concrete plan or projected order changes
  useEffect(() => {
    if (!isLoading) {
      saveDayPlanForDate(currentDate, {
        ...basePlan,
        activityOrder: mergeInstancesWithOrder(
          [...basePlan.plannedInstances, ...projectedInstancesRef.current],
          basePlan.activityOrder,
        ).map((i) => i.id),
      });
    }
  }, [basePlan, currentDate, isLoading]);

  const toggleActivityCompletion = useCallback(
    (instanceId: string) => {
      const projected = projectedInstancesRef.current.find(
        (i) => i.id === instanceId,
      );

      if (projected) {
        // Solidify the projected instance as a concrete completed instance
        setBasePlan((prev) => ({
          ...prev,
          plannedInstances: [
            ...prev.plannedInstances,
            { ...projected, completed: true, isProjected: undefined },
          ],
        }));
        handleComplete(instanceId);
        return;
      }

      setBasePlan((prev) => {
        const idx = prev.plannedInstances.findIndex((i) => i.id === instanceId);
        if (idx === -1) return prev;
        const instance = prev.plannedInstances[idx];
        const newInstances = [...prev.plannedInstances];
        newInstances[idx] = { ...instance, completed: !instance.completed };
        return { ...prev, plannedInstances: newInstances };
      });
    },
    [handleComplete],
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

  const addActivityToDayPlan = useCallback(
    (activity: Activity, zoneId?: string) => {
      setBasePlan((prev) => {
        if (
          prev.plannedInstances.some((i) => i.sourceActivityId === activity.id)
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

  const removeFromPlan = useCallback(
    (instanceId: string): PlannedInstance | undefined => {
      const removed = basePlanRef.current.plannedInstances.find(
        (i) => i.id === instanceId,
      );
      if (!removed) return undefined;

      setBasePlan((prev) => ({
        ...prev,
        plannedInstances: prev.plannedInstances.filter(
          (i) => i.id !== instanceId,
        ),
      }));

      return removed;
    },
    [],
  );

  const deleteFromPlan = useCallback((instanceId: string) => {
    setBasePlan((prev) => ({
      ...prev,
      plannedInstances: prev.plannedInstances.filter(
        (i) => i.id !== instanceId,
      ),
    }));
  }, []);

  const moveActivityToToday = useCallback(
    async (instanceId: string, fromDate: string) => {
      const today = getTodayDateString();

      const oldPlan = await fetchDayPlanForDate(fromDate);
      if (!oldPlan) return;
      const instanceToMove = oldPlan.plannedInstances.find(
        (i) => i.id === instanceId,
      );
      if (!instanceToMove) return;

      if (currentDate === fromDate) {
        setBasePlan((prev) => ({
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

      if (currentDate === today) {
        setBasePlan((prev) => {
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

  const moveActivityToDate = useCallback(
    async (instanceId: string, targetDate: string) => {
      // Check projected instances first — they're not in basePlan so removeFromPlan won't find them
      const projected = projectedInstancesRef.current.find(
        (i) => i.id === instanceId,
      );
      if (projected) {
        onSkip(projected.sourceActivityId);
        const targetPlan =
          (await fetchDayPlanForDate(targetDate)) ||
          createEmptyDayPlan(targetDate);
        const newInstance: PlannedInstance = {
          id: uuidv4(),
          sourceActivityId: projected.sourceActivityId,
          zoneId: projected.zoneId,
          completed: false,
        };
        await saveDayPlanForDate(targetDate, {
          ...targetPlan,
          plannedInstances: [...targetPlan.plannedInstances, newInstance],
        });
        return;
      }

      const removedInstance = removeFromPlan(instanceId);
      if (!removedInstance) return;

      const targetPlan =
        (await fetchDayPlanForDate(targetDate)) ||
        createEmptyDayPlan(targetDate);

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
    [removeFromPlan, onSkip],
  );

  const skipActivity = useCallback(
    (instanceId: string) => {
      handleSkip(instanceId);
    },
    [handleSkip],
  );

  const reorderPlannedActivitiesWithIds = useCallback((itemIds: string[]) => {
    setBasePlan((prev) => ({ ...prev, activityOrder: itemIds }));
  }, []);

  const assignActivityToZone = useCallback(
    (instanceId: string, zoneId: string) => {
      const projected = projectedInstancesRef.current.find(
        (i) => i.id === instanceId,
      );

      if (projected) {
        // Solidify with the requested zone, preserving the projected instance's ID
        setBasePlan((prev) => ({
          ...prev,
          plannedInstances: [
            ...prev.plannedInstances,
            { ...projected, zoneId, isProjected: undefined },
          ],
        }));
        return;
      }

      setBasePlan((prev) => {
        const idx = prev.plannedInstances.findIndex((i) => i.id === instanceId);
        if (idx === -1) return prev;
        const newInstances = [...prev.plannedInstances];
        newInstances[idx] = { ...newInstances[idx], zoneId };
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
    setBasePlan((prev) => ({ ...prev, dailyCapacity: capacity }));
  }, []);

  const resolveActivities = useCallback(
    (activityMap: Map<string, Activity>): ResolvedActivity[] => {
      return dayPlan.plannedInstances.flatMap((instance) => {
        const activity = activityMap.get(instance.sourceActivityId);
        if (!activity) return [];
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
