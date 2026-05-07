"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Activity } from "@/lib/energy-planner/schema";
import { fetchDayPlanForDate, getAllStoredDates } from "./utils";

interface OneOffPlanningState {
  uncompleted: { activity: Activity; instanceId: string; fromDate: string }[];
  /** Source activity IDs with a concrete instance in any day plan */
  scheduledOneOffIds: Set<string>;
  /** Source activity IDs whose instance is marked completed in any day plan */
  completedOneOffIds: Set<string>;
}

function processInstance(
  instance: {
    sourceActivityId: string;
    completed: boolean;
    isProjected?: boolean;
    id: string;
  },
  date: string,
  today: string,
  activityMap: Map<string, Activity>,
  state: OneOffPlanningState,
): void {
  if (instance.isProjected) return;

  const activity = activityMap.get(instance.sourceActivityId);
  if (!activity || activity.repeatConfig) return;

  state.scheduledOneOffIds.add(instance.sourceActivityId);

  if (instance.completed) {
    state.completedOneOffIds.add(instance.sourceActivityId);
  } else if (date < today) {
    state.uncompleted.push({
      activity,
      instanceId: instance.id,
      fromDate: date,
    });
  }
}

async function fetchOneOffPlanningState(
  today: string,
  activityMap: Map<string, Activity>,
): Promise<OneOffPlanningState> {
  const state: OneOffPlanningState = {
    uncompleted: [],
    scheduledOneOffIds: new Set<string>(),
    completedOneOffIds: new Set<string>(),
  };

  const storedDates = await getAllStoredDates();
  const dayPlans = await Promise.all(
    storedDates.map((d) => fetchDayPlanForDate(d)),
  );

  for (const [i, dayPlan] of dayPlans.entries()) {
    if (!dayPlan?.plannedInstances) continue;
    const date = storedDates[i];

    for (const instance of dayPlan.plannedInstances) {
      processInstance(instance, date, today, activityMap, state);
    }
  }

  return state;
}

export interface UseAvailableActivitiesOptions {
  date: string;
  oneOffActivities: Activity[];
  activityMap: Map<string, Activity>;
  activitiesLoading: boolean;
  dayPlanVersion: number;
}

export function useAvailableActivities({
  date,
  oneOffActivities,
  activityMap,
  activitiesLoading,
  dayPlanVersion,
}: UseAvailableActivitiesOptions) {
  const [planningState, setPlanningState] = useState<OneOffPlanningState>(
    () => ({
      uncompleted: [],
      scheduledOneOffIds: new Set<string>(),
      completedOneOffIds: new Set<string>(),
    }),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: dayPlanVersion intentionally triggers re-fetch after storage changes
  useEffect(() => {
    if (activitiesLoading) return;
    let cancelled = false;

    (async () => {
      const state = await fetchOneOffPlanningState(date, activityMap);
      if (!cancelled) setPlanningState(state);
    })();

    return () => {
      cancelled = true;
    };
  }, [activitiesLoading, date, dayPlanVersion, activityMap]);

  const scheduleActivity = useCallback((activityId: string) => {
    setPlanningState((prev) => {
      const scheduledOneOffIds = new Set(prev.scheduledOneOffIds);
      scheduledOneOffIds.add(activityId);
      return { ...prev, scheduledOneOffIds };
    });
  }, []);

  const unscheduleActivity = useCallback((activityId: string) => {
    setPlanningState((prev) => {
      const scheduledOneOffIds = new Set(prev.scheduledOneOffIds);
      const completedOneOffIds = new Set(prev.completedOneOffIds);
      scheduledOneOffIds.delete(activityId);
      completedOneOffIds.delete(activityId);
      return { ...prev, scheduledOneOffIds, completedOneOffIds };
    });
  }, []);

  const availableActivities = useMemo(
    () =>
      oneOffActivities.filter(
        (a) =>
          !(
            planningState.scheduledOneOffIds.has(a.id) ||
            planningState.completedOneOffIds.has(a.id)
          ),
      ),
    [
      oneOffActivities,
      planningState.scheduledOneOffIds,
      planningState.completedOneOffIds,
    ],
  );

  return {
    availableActivities,
    uncompletedActivities: planningState.uncompleted,
    scheduleActivity,
    unscheduleActivity,
  };
}
