"use client";

import { useCallback, useMemo, useRef } from "react";
import type {
  Activity,
  DayPlan,
  PlannedInstance,
} from "@/lib/energy-planner/schema";
import {
  calculateNextDueDate,
  checkIsActivityDue,
  projectedInstanceId,
} from "./dayPlanUtils";

interface UseProjectedActivitiesParams {
  repeatingActivities: Activity[];
  basePlan: DayPlan;
  date: string;
  onUpdateActivity: (activity: Activity) => void;
  onSkip: (sourceActivityId: string) => void;
}

export function useProjectedActivities({
  repeatingActivities,
  basePlan,
  date,
  onUpdateActivity,
  onSkip,
}: UseProjectedActivitiesParams) {
  const onUpdateActivityRef = useRef(onUpdateActivity);
  onUpdateActivityRef.current = onUpdateActivity;
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;
  const repeatingActivitiesRef = useRef(repeatingActivities);
  repeatingActivitiesRef.current = repeatingActivities;
  const dateRef = useRef(date);
  dateRef.current = date;

  const projectedInstances = useMemo(() => {
    const storedSourceIds = new Set(
      basePlan.plannedInstances.map((i) => i.sourceActivityId),
    );
    const skippedIds = new Set(basePlan.skippedSourceActivityIds ?? []);

    return repeatingActivities
      .filter((ra) => !storedSourceIds.has(ra.id))
      .filter((ra) => !skippedIds.has(ra.id))
      .filter((ra) => checkIsActivityDue(ra, date))
      .map(
        (ra): PlannedInstance => ({
          id: projectedInstanceId(ra.id, date),
          sourceActivityId: ra.id,
          zoneId: ra.repeatConfig?.defaultZoneId,
          completed: false,
          isProjected: true,
        }),
      );
  }, [
    repeatingActivities,
    basePlan.plannedInstances,
    basePlan.skippedSourceActivityIds,
    date,
  ]);

  const projectedInstancesRef = useRef(projectedInstances);
  projectedInstancesRef.current = projectedInstances;

  // Advance nextDueDate from the activity's scheduled due date (completion respects the schedule)
  const handleComplete = useCallback((instanceId: string) => {
    const instance = projectedInstancesRef.current.find(
      (i) => i.id === instanceId,
    );
    if (!instance) return;

    const activity = repeatingActivitiesRef.current.find(
      (ra) => ra.id === instance.sourceActivityId,
    );
    if (!activity?.repeatConfig) return;

    const nextDate = calculateNextDueDate(
      activity.repeatConfig.nextDueDate,
      activity.repeatConfig,
    );
    onUpdateActivityRef.current({
      ...activity,
      repeatConfig: { ...activity.repeatConfig, nextDueDate: nextDate },
    });
  }, []);

  // Advance nextDueDate from the current date (skip advances from today, not due date)
  const handleSkip = useCallback((instanceId: string) => {
    const instance = projectedInstancesRef.current.find(
      (i) => i.id === instanceId,
    );
    if (!instance) return;

    const activity = repeatingActivitiesRef.current.find(
      (ra) => ra.id === instance.sourceActivityId,
    );
    if (!activity?.repeatConfig) return;

    const nextDate = calculateNextDueDate(
      dateRef.current,
      activity.repeatConfig,
    );
    onUpdateActivityRef.current({
      ...activity,
      repeatConfig: { ...activity.repeatConfig, nextDueDate: nextDate },
    });
    onSkipRef.current(instance.sourceActivityId);
  }, []);

  return { projectedInstances, handleComplete, handleSkip };
}
