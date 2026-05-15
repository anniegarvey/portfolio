"use client";

import { useEnergyPlanner } from "./context";

export function useDayPlanActions() {
  const {
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
    energyUsage,
    capacityWarnings,
    uncompletedActivities,
    reorderPlannedActivities,
    assignActivityToZone,
    skipActivity,
    isLoading,
  } = useEnergyPlanner();

  return {
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
    energyUsage,
    capacityWarnings,
    uncompletedActivities,
    reorderPlannedActivities,
    assignActivityToZone,
    skipActivity,
    isLoading,
  };
}

export function useActivityManagement() {
  const {
    oneOffActivities,
    repeatingActivities,
    availableActivities,
    addActivity,
    updateActivity,
    removeActivity,
    reorderActivities,
    reorderRepeatingActivities,
    isLoading,
  } = useEnergyPlanner();

  return {
    oneOffActivities,
    repeatingActivities,
    availableActivities,
    addActivity,
    updateActivity,
    removeActivity,
    reorderActivities,
    reorderRepeatingActivities,
    isLoading,
  };
}

export function useEnergyConfiguration() {
  const {
    energyTypes,
    addEnergyType,
    updateEnergyType,
    removeEnergyType,
    dailyCapacity,
    setDailyCapacity,
    zones,
    addZone,
    updateZone,
    removeZone,
    reorderZones,
    isLoading,
  } = useEnergyPlanner();

  return {
    energyTypes,
    addEnergyType,
    updateEnergyType,
    removeEnergyType,
    dailyCapacity,
    setDailyCapacity,
    zones,
    addZone,
    updateZone,
    removeZone,
    reorderZones,
    isLoading,
  };
}
