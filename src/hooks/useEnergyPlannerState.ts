"use client";

import { useCallback, useEffect, useState } from "react";
import type { Activity, EnergyCost } from "@/lib/energy-planner/schema";
import { calculateEnergyUsage as calcUsage } from "@/lib/energy-planner/utils";
import { useActivities } from "./useActivities";
import { useDayPlan } from "./useDayPlan";
import { useEnergyTypes } from "./useEnergyTypes";
import { useZones } from "./useZones";
import { getUncompletedActivities } from "./utils";

export function useEnergyPlannerState() {
  const {
    oneOffActivities,
    repeatingActivities,
    isLoading: activitiesLoading,
    addActivity: addActivityBase,
    updateActivity: updateActivityBase,
    removeActivityState,
    reorderActivities,
    addActivityToAvailable,
    removeActivityFromAvailable,
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
    updatePlannedActivity,
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

  // State for async-computed values
  const [uncompletedActivities, setUncompletedActivities] = useState<
    { activity: Activity; fromDate: string }[]
  >([]);

  const availableActivities = oneOffActivities;

  // Load uncompleted activities from previous days
  // Re-run when dayPlanVersion changes (after uncompleted activity actions)
  // biome-ignore lint/correctness/useExhaustiveDependencies: dayPlanVersion intentionally triggers re-fetch after storage changes
  useEffect(() => {
    if (activitiesLoading) return;

    (async () => {
      const uncompleted = await getUncompletedActivities(currentDate);
      setUncompletedActivities(uncompleted);
    })();
  }, [activitiesLoading, currentDate, dayPlanVersion]);

  const addActivity = useCallback(
    (activityData: Omit<Activity, "id" | "createdAt">) => {
      const newActivity = addActivityBase(activityData);

      // If it's repeating, the projection logic in useDayPlan will handle showing it
      // based on the nextDueDate (which defaults to today for new activities).
      // So no need to manually add to plan.

      return newActivity;
    },
    [addActivityBase],
  );

  // Add activity to day plan - finds activity and coordinates state
  const addToPlan = useCallback(
    (activityId: string, zoneId?: string) => {
      // Find activity in one-off activities
      const activity = oneOffActivities.find((a) => a.id === activityId);
      if (!activity) {
        // Not a one-off activity - might be a repeating activity (handled elsewhere)
        return;
      }

      // Add to day plan
      addActivityToDayPlan(activity, zoneId);
      // Remove from available activities
      removeActivityFromAvailable(activityId);
    },
    [oneOffActivities, addActivityToDayPlan, removeActivityFromAvailable],
  );

  // Remove activity from day plan and return to available activities
  const removeFromPlan = useCallback(
    (activityId: string) => {
      // Remove from day plan (returns the removed activity)
      const removedActivity = removeFromPlanBase(activityId);
      // Add back to available activities if found
      if (removedActivity) {
        // Strip 'completed' when moving back to available activities
        const { completed: _completed, ...rawActivity } = removedActivity;
        addActivityToAvailable(rawActivity as Activity);
      }
    },
    [addActivityToAvailable, removeFromPlanBase],
  );

  // Move activity from day plan to available activities
  const moveActivityToUnplanned = useCallback(
    async (activityId: string, fromDate: string) => {
      // Remove from day plan (returns the removed activity)
      const removedActivity = await moveActivityToUnplannedBase(
        activityId,
        fromDate,
      );
      // Add back to available activities if found
      if (removedActivity) {
        // Strip 'completed' when moving back to available activities
        const { completed: _completed, ...rawActivity } = removedActivity;
        addActivityToAvailable(rawActivity as Activity);
      }
    },
    [addActivityToAvailable, moveActivityToUnplannedBase],
  );

  const removeActivity = useCallback(
    async (activityId: string) => {
      // If it's in the day plan, remove it (but don't add back to available)
      deleteFromPlan(activityId);
      // Remove from activity lists (one-off and repeating)
      removeActivityState(activityId);
    },
    [removeActivityState, deleteFromPlan],
  );

  const calculateEnergyUsage = useCallback((): EnergyCost => {
    return calcUsage(dayPlan);
  }, [dayPlan]);

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

  // Wrap updateActivity to handle both stores
  const handleUpdateActivity = useCallback(
    (activity: Activity) => {
      // Update in master lists
      updateActivityBase(activity);
      // Update in day plan (if present)
      updatePlannedActivity(activity);
    },
    [updateActivityBase, updatePlannedActivity],
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
    zones,
    addZone,
    updateZone,
    removeZone,
    reorderZones,
    assignActivityToZone,
  };
}
