"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Activity } from "@/lib/energy-planner/schema";
import {
  fetchOneOffActivities,
  fetchRepeatingActivities,
  storeOneOffActivities,
  storeRepeatingActivities,
} from "@/lib/energy-planner/storage";

export function useActivities() {
  const [oneOffActivities, setOneOffActivitiesState] = useState<Activity[]>([]);
  const [repeatingActivities, setRepeatingActivitiesState] = useState<
    Activity[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load activities on mount
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      const [storedActivities, storedRepeatingActivities] = await Promise.all([
        fetchOneOffActivities(),
        fetchRepeatingActivities(),
      ]);
      if (cancelled) return;
      setOneOffActivitiesState(storedActivities);
      setRepeatingActivitiesState(storedRepeatingActivities);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Save activities whenever they change (and loading is done)
  useEffect(() => {
    if (!isLoading) {
      storeOneOffActivities(oneOffActivities);
    }
  }, [oneOffActivities, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      storeRepeatingActivities(repeatingActivities);
    }
  }, [repeatingActivities, isLoading]);

  const addActivity = (activityData: Omit<Activity, "id" | "createdAt">) => {
    const newActivity: Activity = {
      ...activityData,
      id: uuidv4(),
      createdAt: new Date(),
    };

    if (activityData.repeatConfig) {
      const repeatingActivity: Activity = {
        ...newActivity,
        repeatConfig: {
          ...activityData.repeatConfig,
          nextDueDate:
            activityData.repeatConfig.nextDueDate ||
            new Date().toISOString().split("T")[0],
        },
      };
      setRepeatingActivitiesState((prev) => [...prev, repeatingActivity]);
      return repeatingActivity;
    }

    setOneOffActivitiesState((prev) => [...prev, newActivity]);
    return newActivity;
  };

  /* optimized update activity */
  const updateActivity = (updatedActivity: Activity) => {
    if (updatedActivity.repeatConfig) {
      // Updating a repeating activity
      setRepeatingActivitiesState((prev) => {
        const index = prev.findIndex((a) => a.id === updatedActivity.id);
        if (index !== -1) {
          // Already was repeating, just update
          return prev.map((a) =>
            a.id === updatedActivity.id ? (updatedActivity as Activity) : a,
          );
        }
        // Was one-off, now repeating - add to repeating list
        return [...prev, updatedActivity];
      });

      // Remove from one-off if it was there
      setOneOffActivitiesState((prev) =>
        prev.filter((a) => a.id !== updatedActivity.id),
      );
    } else {
      // Updating a one-off activity
      setOneOffActivitiesState((prev) => {
        const index = prev.findIndex((a) => a.id === updatedActivity.id);
        if (index !== -1) {
          // Already was one-off, just update
          return prev.map((a) =>
            a.id === updatedActivity.id ? updatedActivity : a,
          );
        }
        // Was repeating, now one-off - add to one-off list
        return [...prev, updatedActivity];
      });

      // Remove from repeating if it was there
      setRepeatingActivitiesState((prev) =>
        prev.filter((a) => a.id !== updatedActivity.id),
      );
    }
  };

  /* optimized remove activity state */
  const removeActivityState = (activityId: string) => {
    setOneOffActivitiesState((prev) => {
      const filtered = prev.filter((a) => a.id !== activityId);
      return filtered.length !== prev.length ? filtered : prev;
    });
    setRepeatingActivitiesState((prev) => {
      const filtered = prev.filter((a) => a.id !== activityId);
      return filtered.length !== prev.length ? filtered : prev;
    });
  };

  const reorderActivities = (newActivities: Activity[]) => {
    setOneOffActivitiesState(newActivities);
  };

  const reorderRepeatingActivities = (newActivities: Activity[]) => {
    setRepeatingActivitiesState(newActivities);
  };

  // Add activity back to available activities (used when unplanning a activity)
  const addActivityToAvailable = (activity: Activity) => {
    // If it has repeat config, it goes to repeating activities
    if (activity.repeatConfig) {
      setRepeatingActivitiesState((prev) => {
        if (prev.some((a) => a.id === activity.id)) return prev;
        return prev;
      });
      return;
    }

    setOneOffActivitiesState((prev) => {
      // Don't add if already exists
      if (prev.some((a) => a.id === activity.id)) return prev;
      // Add to beginning (most recently unplanned appears first)
      return [activity, ...prev];
    });
  };

  // Remove activity from available activities (used when planning a activity)
  const removeActivityFromAvailable = (activityId: string) => {
    setOneOffActivitiesState((prev) => prev.filter((a) => a.id !== activityId));
    // Do NOT remove from repeating activities when planning an instance!
  };

  return {
    oneOffActivities,
    repeatingActivities,
    isLoading,
    addActivity,
    updateActivity,
    removeActivityState,
    reorderActivities,
    reorderRepeatingActivities,
    addActivityToAvailable,
    removeActivityFromAvailable,
  };
}
