"use client";

import { useId, useState } from "react";
import { useEnergyPlanner } from "@/lib/energy-planner/context";
import type { EnergyCost, RepeatUnit, Task } from "@/lib/energy-planner/schema";

interface UseTaskFormProps {
  initialData?: Task;
  initialContext?: {
    date: string; // The date we are viewing/planning for
    zoneId?: string; // The zone we clicked "Add Task" from
  };
  onClose?: () => void;
}

export function useTaskForm({
  initialData,
  initialContext,
  onClose,
}: UseTaskFormProps) {
  const { addTask, updateTask, addToPlan, isLoading, zones } =
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
      undefined,
  );

  // Repeating Task State
  const [isRepeating, setIsRepeating] = useState(!!initialData?.repeatConfig);
  const [frequency, setFrequency] = useState(
    initialData?.repeatConfig?.frequency || 1,
  );
  const [unit, setUnit] = useState<RepeatUnit>(
    initialData?.repeatConfig?.unit || "days",
  );
  // Default to initial context date only if creating a new repeating task contextually
  const [nextDueDate, setNextDueDate] = useState(
    initialData?.repeatConfig?.nextDueDate || initialContext?.date || "",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || isLoading) return;

    const taskData: Partial<Task> = {
      title,
      description,
      energyCost,
      factors,
      defaultZoneId,
    };

    if (isRepeating) {
      taskData.repeatConfig = {
        ...(initialData?.repeatConfig || {}),
        frequency,
        unit,
        nextDueDate: nextDueDate || undefined,
        defaultZoneId: defaultZoneId || undefined,
      };
    } else {
      taskData.repeatConfig = undefined;
    }

    if (initialData) {
      updateTask({ ...initialData, ...taskData });
    } else {
      handleCreate(taskData);
    }

    if (onClose) {
      onClose();
    } else {
      resetForm();
    }
  };

  const handleCreate = (taskData: Partial<Task>) => {
    const baseData = { ...taskData } as Omit<Task, "id" | "createdAt">;

    // Check if we are creating a repeating task
    // We prioritize the explicit repeatConfig.nextDueDate if set (via the form state nextDueDate)
    if (isRepeating && taskData.repeatConfig) {
      const config = taskData.repeatConfig;
      if (!(config.frequency && config.unit)) {
        throw new Error("Repeat config is required for repeating tasks");
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
      addTask(dataWithConfig);
      return;
    }

    // Standard creation
    const newTask = addTask(baseData);

    // If we have context (and it's not repeating), plan it immediately!
    // Only plan if we have a specific ZONE. If it's a global "New Task", just add to pool.
    if (
      newTask &&
      !isRepeating &&
      initialContext?.date &&
      (initialContext?.zoneId || newTask.defaultZoneId)
    ) {
      addToPlan(newTask.id, initialContext?.zoneId || newTask.defaultZoneId);
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
    setDefaultZoneId(undefined);
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
