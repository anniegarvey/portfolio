"use client";

import { useId, useState } from "react";
import { useEnergyPlanner } from "@/lib/energy-planner/context";
import type {
  Activity,
  EnergyCost,
  RepeatUnit,
} from "@/lib/energy-planner/schema";

interface UseActivityFormProps {
  initialData?: Activity;
  initialContext?: {
    date: string; // The date we are viewing/planning for
    zoneId?: string; // The zone we clicked "Add Activity" from
  };
  onClose?: () => void;
  // Called after a new one-off activity is successfully created with context
  onCreated?: () => void;
}

export function useActivityForm({
  initialData,
  initialContext,
  onClose,
  onCreated,
}: UseActivityFormProps) {
  const { addActivity, updateActivity, addToPlan, isLoading, zones } =
    useEnergyPlanner();
  const formId = useId();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [energyCost, setEnergyCost] = useState<EnergyCost>(
    initialData?.energyCost || { physical: 0, social: 0, executive: 0 },
  );
  const [factors, setFactors] = useState(
    initialData?.factors || {
      initiationDifficulty: 0,
      terminationDifficulty: 0,
      isRestorative: false,
    },
  );
  const [defaultZoneId, setDefaultZoneId] = useState(
    initialData?.defaultZoneId ||
      initialData?.repeatConfig?.defaultZoneId ||
      initialContext?.zoneId ||
      undefined,
  );

  // Repeating Activity State
  const [isRepeating, setIsRepeating] = useState(!!initialData?.repeatConfig);
  const [frequency, setFrequency] = useState(
    initialData?.repeatConfig?.frequency || 1,
  );
  const [unit, setUnit] = useState<RepeatUnit>(
    initialData?.repeatConfig?.unit || "days",
  );
  // Default to initial context date only if creating a new repeating activity contextually
  const [nextDueDate, setNextDueDate] = useState(
    initialData?.repeatConfig?.nextDueDate || initialContext?.date || "",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || isLoading) return;

    const activityData: Partial<Activity> = {
      title,
      description,
      energyCost,
      factors,
      defaultZoneId,
    };

    if (isRepeating) {
      activityData.repeatConfig = {
        ...(initialData?.repeatConfig || {}),
        frequency,
        unit,
        nextDueDate: nextDueDate || undefined,
        defaultZoneId: defaultZoneId || undefined,
      };
    } else {
      activityData.repeatConfig = undefined;
    }

    if (initialData) {
      updateActivity({ ...initialData, ...activityData });
    } else {
      handleCreate(activityData);
    }

    if (onClose) {
      onClose();
    } else {
      resetForm();
    }
  };

  const handleCreate = (activityData: Partial<Activity>) => {
    const baseData = { ...activityData } as Omit<Activity, "id" | "createdAt">;

    // Check if we are creating a repeating activity
    // We prioritize the explicit repeatConfig.nextDueDate if set (via the form state nextDueDate)
    if (isRepeating && activityData.repeatConfig) {
      const config = activityData.repeatConfig;
      if (!(config.frequency && config.unit)) {
        throw new Error("Repeat config is required for repeating activities");
      }

      const dataWithConfig = {
        ...baseData,
        repeatConfig: {
          ...config,
          nextDueDate: config.nextDueDate,
          defaultZoneId:
            config.defaultZoneId || defaultZoneId || initialContext?.zoneId,
        },
      };
      addActivity(dataWithConfig);
      return;
    }

    // Standard creation
    const newActivity = addActivity(baseData);

    // If we have context (and it's not repeating), plan it immediately!
    // Only plan if we have a specific ZONE. If it's a global "New Activity", just add to pool.
    if (
      newActivity &&
      !isRepeating &&
      initialContext?.date &&
      (initialContext?.zoneId || newActivity.defaultZoneId)
    ) {
      addToPlan(
        newActivity.id,
        initialContext?.zoneId || newActivity.defaultZoneId,
        newActivity,
      );
      onCreated?.();
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEnergyCost({ physical: 0, social: 0, executive: 0 });
    setFactors({
      initiationDifficulty: 0,
      terminationDifficulty: 0,
      isRestorative: false,
    });
    setIsRepeating(false);
    setFrequency(1);
    setUnit("days");
    setNextDueDate("");
    setDefaultZoneId(initialContext?.zoneId);
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    energyCost,
    setEnergyCost,
    factors,
    setFactors,
    isRepeating,
    setIsRepeating,
    frequency,
    setFrequency,
    unit,
    setUnit,
    nextDueDate,
    setNextDueDate,
    handleSubmit,
    formId,
    isLoading,
    zones,
    defaultZoneId,
    setDefaultZoneId,
  };
}
