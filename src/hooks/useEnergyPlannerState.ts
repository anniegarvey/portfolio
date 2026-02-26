"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Activity,
  EnergyCost,
  PlannedInstance,
  ResolvedActivity,
} from "@/lib/energy-planner/schema";
import { calculateEnergyUsage as calcUsage } from "@/lib/energy-planner/utils";
import { useActivities } from "./useActivities";
import { useDayPlan } from "./useDayPlan";
import { useEnergyTypes } from "./useEnergyTypes";
import { useZones } from "./useZones";
import { getUncompletedActivities } from "./utils";

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

  // Build an activity map for fast lookups — used for resolving instances
  const activityMap = useMemo(
    () => new Map(activities.map((a) => [a.id, a])),
    [activities],
  );

  // Resolve the current day plan's instances against the activity store
  const resolvedActivities: ResolvedActivity[] = useMemo(
    () => resolveActivities(activityMap),
    [resolveActivities, activityMap],
  );

  // Uncompleted activities from previous days
  const [uncompletedActivities, setUncompletedActivities] = useState<
    { activity: Activity; instanceId: string; fromDate: string }[]
  >([]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: dayPlanVersion intentionally triggers re-fetch after storage changes
  useEffect(() => {
    if (activitiesLoading) return;

    (async () => {
      const uncompleted = await getUncompletedActivities(
        currentDate,
        activityMap,
      );
      setUncompletedActivities(uncompleted);
    })();
  }, [activitiesLoading, currentDate, dayPlanVersion, activityMap]);

  const addActivity = useCallback(
    (activityData: Omit<Activity, "id" | "createdAt">) => {
      return addActivityBase(activityData);
    },
    [addActivityBase],
  );

  // Add a one-off activity to the plan for the current day
  const addToPlan = useCallback(
    (activityId: string, zoneId?: string, knownActivity?: Activity) => {
      const activity =
        knownActivity ?? activities.find((a) => a.id === activityId);
      if (!activity || activity.repeatConfig) {
        // Repeating activities are projected automatically — don't manually add
        return;
      }
      addActivityToDayPlan(activity, zoneId);
    },
    [activities, addActivityToDayPlan],
  );

  // Remove a one-off instance from the plan (instance stays in activity store)
  const removeFromPlan = useCallback(
    (instanceId: string) => {
      removeFromPlanBase(instanceId);
    },
    [removeFromPlanBase],
  );

  // Move an unplanned instance back from any date
  const moveActivityToUnplanned = useCallback(
    async (instanceId: string, fromDate: string) => {
      await moveActivityToUnplannedBase(instanceId, fromDate);
    },
    [moveActivityToUnplannedBase],
  );

  const removeActivity = useCallback(
    async (activityId: string) => {
      // Remove any planned instance for this activity from the current view
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
      updateActivityBase(activity);

      // For projected repeating instances, remove them from the day plan so that
      // the re-projection logic can re-evaluate based on the updated nextDueDate.
      const projectedInstance = dayPlan.plannedInstances.find(
        (i) => i.sourceActivityId === activity.id && i.isProjected,
      );
      if (projectedInstance && activity.repeatConfig) {
        deleteFromPlan(projectedInstance.id);
      }
    },
    [updateActivityBase, deleteFromPlan, dayPlan.plannedInstances],
  );

  const isLoading =
    activitiesLoading || dayPlanLoading || typesLoading || zonesLoading;

  // Available activities = one-offs not currently in the day plan
  const plannedSourceIds = new Set(
    dayPlan.plannedInstances.map((i: PlannedInstance) => i.sourceActivityId),
  );
  const availableActivities = oneOffActivities.filter(
    (a) => !plannedSourceIds.has(a.id),
  );

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
