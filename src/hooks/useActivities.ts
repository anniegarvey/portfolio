"use client";

import { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Activity } from "@/lib/energy-planner/schema";
import { fetchActivities, storeActivities } from "@/lib/energy-planner/storage";

export function useActivities() {
  const [activities, setActivitiesState] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load activities on mount
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      const stored = await fetchActivities();
      if (cancelled) return;
      setActivitiesState(stored);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Save activities whenever they change (and loading is done)
  useEffect(() => {
    if (!isLoading) {
      storeActivities(activities);
    }
  }, [activities, isLoading]);

  const addActivity = (activityData: Omit<Activity, "id" | "createdAt">) => {
    const newActivity: Activity = {
      ...activityData,
      id: uuidv4(),
      createdAt: new Date(),
      // Ensure repeating activities have a nextDueDate
      ...(activityData.repeatConfig && {
        repeatConfig: {
          ...activityData.repeatConfig,
          nextDueDate:
            activityData.repeatConfig.nextDueDate ||
            new Date().toISOString().split("T")[0],
        },
      }),
    };

    setActivitiesState((prev) => [...prev, newActivity]);
    return newActivity;
  };

  const updateActivity = (updatedActivity: Activity) => {
    setActivitiesState((prev) => {
      const index = prev.findIndex((a) => a.id === updatedActivity.id);
      if (index !== -1) {
        return prev.map((a) =>
          a.id === updatedActivity.id ? updatedActivity : a,
        );
      }
      // Not found — append (handles edge cases during migration)
      return [...prev, updatedActivity];
    });
  };

  const removeActivityState = (activityId: string) => {
    setActivitiesState((prev) => {
      const filtered = prev.filter((a) => a.id !== activityId);
      return filtered.length !== prev.length ? filtered : prev;
    });
  };

  const reorderActivities = (newOrder: Activity[]) => {
    setActivitiesState(newOrder);
  };

  const reorderRepeatingActivities = (reorderedRepeating: Activity[]) => {
    setActivitiesState((prev) => {
      const repeatingIds = new Set(reorderedRepeating.map((a) => a.id));
      const nonRepeating = prev.filter((a) => !repeatingIds.has(a.id));
      // Preserve non-repeating activities, replace repeating subset in its new order
      return [...nonRepeating, ...reorderedRepeating];
    });
  };

  // Derived lists — memoized so consumers' useEffects don't re-fire on every render
  const oneOffActivities = useMemo(
    () => activities.filter((a) => !a.repeatConfig),
    [activities],
  );
  const repeatingActivities = useMemo(
    () => activities.filter((a) => !!a.repeatConfig),
    [activities],
  );

  return {
    activities,
    oneOffActivities,
    repeatingActivities,
    isLoading,
    addActivity,
    updateActivity,
    removeActivityState,
    reorderActivities,
    reorderRepeatingActivities,
  };
}
