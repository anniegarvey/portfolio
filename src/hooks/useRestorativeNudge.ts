"use client";

import { useCallback, useMemo, useState } from "react";
import type { Activity, ResolvedActivity } from "@/lib/energy-planner/schema";

const NON_RESTORATIVE_THRESHOLD = 3;

export const DEFAULT_RESTORATIVE_SUGGESTIONS = [
  "Short walk",
  "Listen to music",
  "Meditate",
];

export function useRestorativeNudge(
  resolvedActivities: ResolvedActivity[],
  availableActivities: Activity[],
) {
  const planKey = useMemo(
    () =>
      resolvedActivities
        .map((r) => r.instance.id)
        .sort()
        .join(","),
    [resolvedActivities],
  );

  const [dismissedPlanKey, setDismissedPlanKey] = useState<string | null>(null);

  const { nonRestorativeCount, hasRestorative } = useMemo(() => {
    let count = 0;
    let found = false;
    for (const { activity } of resolvedActivities) {
      if (activity.factors.isRestorative) {
        found = true;
      } else {
        count++;
      }
    }
    return { nonRestorativeCount: count, hasRestorative: found };
  }, [resolvedActivities]);

  const shouldNudge =
    nonRestorativeCount >= NON_RESTORATIVE_THRESHOLD && !hasRestorative;

  const shouldShow = shouldNudge && dismissedPlanKey !== planKey;

  const dismiss = useCallback(() => {
    setDismissedPlanKey(planKey);
  }, [planKey]);

  const restorativeSuggestions = useMemo(
    () =>
      availableActivities.filter((a) => a.factors.isRestorative).slice(0, 3),
    [availableActivities],
  );

  return {
    shouldShow,
    nonRestorativeCount,
    restorativeSuggestions,
    defaultSuggestions: DEFAULT_RESTORATIVE_SUGGESTIONS,
    dismiss,
  };
}
