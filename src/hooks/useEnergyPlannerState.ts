"use client";

import { useCallback, useMemo } from "react";
import type {
  Activity,
  EnergyCost,
  ResolvedActivity,
} from "@/lib/energy-planner/schema";
import { calculateEnergyUsage as calcUsage } from "@/lib/energy-planner/utils";
import { useActivities } from "./useActivities";
import { useAvailableActivities } from "./useAvailableActivities";
import { useDayPlan } from "./useDayPlan";
import { useEnergyTypes } from "./useEnergyTypes";
import { useZones } from "./useZones";

export function useEnergyPlannerState() {
  const {
    activities,
    oneOffActivities,
    repeatingActivities,
    isLoading: activitiesLoading,
    addActivity: addActivityBase,
    updateActivity: updateActivityBase,
    removeActivityState,
    reorderActivities,
    reorderRepeatingActivities,
  } = useActivities();

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
    addActivityToDayPlan,
    removeFromPlan: removeFromPlanBase,
    toggleActivityCompletion,
    markActivityCompleteOnDate,
    moveActivityToToday,
    moveActivityToUnplanned: moveActivityToUnplannedBase,
    reorderPlannedActivities,
    assignActivityToZone,
    deleteFromPlan,
    resolveActivities,
    moveActivityToDate,
    skipActivity,
  } = useDayPlan(repeatingActivities, updateActivityBase);

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

  const activityMap = useMemo(
    () => new Map(activities.map((a) => [a.id, a])),
    [activities],
  );

  const resolvedActivities: ResolvedActivity[] = useMemo(
    () => resolveActivities(activityMap),
    [resolveActivities, activityMap],
  );

  const {
    availableActivities,
    uncompletedActivities,
    scheduleActivity,
    unscheduleActivity,
  } = useAvailableActivities({
    date: currentDate,
    oneOffActivities,
    activityMap,
    activitiesLoading,
    dayPlanVersion,
  });

  const addActivity = useCallback(
    (activityData: Omit<Activity, "id" | "createdAt">) => {
      return addActivityBase(activityData);
    },
    [addActivityBase],
  );

  const addToPlan = useCallback(
    (activityId: string, zoneId?: string, knownActivity?: Activity) => {
      const activity = knownActivity ?? activityMap.get(activityId);
      if (!activity || activity.repeatConfig) {
        // Repeating activities are projected automatically — don't manually add
        return;
      }
      addActivityToDayPlan(activity, zoneId);
      scheduleActivity(activityId);
    },
    [activityMap, addActivityToDayPlan, scheduleActivity],
  );

  const removeFromPlan = useCallback(
    (instanceId: string) => {
      const instance = dayPlan.plannedInstances.find(
        (i) => i.id === instanceId,
      );
      const sourceActivityId = instance?.sourceActivityId;
      const activity = sourceActivityId
        ? activityMap.get(sourceActivityId)
        : undefined;

      removeFromPlanBase(instanceId);

      if (activity && !activity.repeatConfig && sourceActivityId) {
        unscheduleActivity(sourceActivityId);
      }
    },
    [
      removeFromPlanBase,
      dayPlan.plannedInstances,
      activityMap,
      unscheduleActivity,
    ],
  );

  const moveActivityToUnplanned = useCallback(
    async (instanceId: string, fromDate: string) => {
      let sourceActivityId: string | undefined;

      if (fromDate === currentDate) {
        const instance = dayPlan.plannedInstances.find(
          (i) => i.id === instanceId,
        );
        sourceActivityId = instance?.sourceActivityId;
      } else {
        const uncompletedItem = uncompletedActivities.find(
          (u) => u.instanceId === instanceId,
        );
        sourceActivityId = uncompletedItem?.activity.id;
      }

      const activity = sourceActivityId
        ? activityMap.get(sourceActivityId)
        : undefined;

      await moveActivityToUnplannedBase(instanceId, fromDate);

      if (activity && !activity.repeatConfig && sourceActivityId) {
        unscheduleActivity(sourceActivityId);
      }
    },
    [
      moveActivityToUnplannedBase,
      uncompletedActivities,
      dayPlan.plannedInstances,
      activityMap,
      currentDate,
      unscheduleActivity,
    ],
  );

  const removeActivity = useCallback(
    async (activityId: string) => {
      const instanceToRemove = dayPlan.plannedInstances.find(
        (i) => i.sourceActivityId === activityId,
      );
      if (instanceToRemove) {
        deleteFromPlan(instanceToRemove.id);
      }
      removeActivityState(activityId);
    },
    [removeActivityState, deleteFromPlan, dayPlan.plannedInstances],
  );

  const calculateEnergyUsage = useCallback((): EnergyCost => {
    return calcUsage(resolvedActivities);
  }, [resolvedActivities]);

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

  const handleUpdateActivity = useCallback(
    (activity: Activity) => {
      const projectedInstance = dayPlan.plannedInstances.find(
        (i) => i.sourceActivityId === activity.id && i.isProjected,
      );

      if (projectedInstance) {
        if (activity.repeatConfig) {
          // If it's still repeating but updated (e.g., date changed),
          // remove the old projection so `useDayPlan` can re-evaluate it.
          deleteFromPlan(projectedInstance.id);
        } else {
          // Converted from repeating to one-off: replace the projection with a
          // concrete instance and mark it as scheduled in the index.
          addActivityToDayPlan(activity, projectedInstance.zoneId);
          scheduleActivity(activity.id);
        }
      }

      updateActivityBase(activity);
    },
    [
      updateActivityBase,
      deleteFromPlan,
      dayPlan.plannedInstances,
      addActivityToDayPlan,
      scheduleActivity,
    ],
  );

  const isLoading =
    activitiesLoading || dayPlanLoading || typesLoading || zonesLoading;

  return {
    oneOffActivities,
    isLoading,
    addActivity,
    updateActivity: handleUpdateActivity,
    removeActivity,
    dailyCapacity: dayPlan.dailyCapacity,
    setDailyCapacity,
    currentDate,
    dayPlan,
    resolvedActivities,
    navigateToDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    addToPlan,
    removeFromPlan,
    toggleActivityCompletion,
    markActivityCompleteOnDate,
    moveActivityToToday,
    moveActivityToUnplanned,
    moveActivityToDate,
    calculateEnergyUsage,
    checkExceedsCapacity,
    uncompletedActivities,
    availableActivities,
    repeatingActivities,
    energyTypes,
    addEnergyType,
    updateEnergyType,
    removeEnergyType,
    reorderPlannedActivities,
    reorderActivities,
    reorderRepeatingActivities,
    zones,
    addZone,
    updateZone,
    removeZone,
    reorderZones,
    assignActivityToZone,
    skipActivity,
  };
}
