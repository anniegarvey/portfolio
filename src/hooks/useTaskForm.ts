"use client";

import { useId, useState } from "react";
import { useEnergyPlanner } from "@/lib/energy-planner/context";
import type { EnergyCost, Task } from "@/lib/energy-planner/schema";

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
  const { addTask, updateTask, addToPlan, assignTaskToZone, isLoading } =
    useEnergyPlanner();
  const formId = useId();
  const [title, setTitle] = useState(initialData?.title || "");
  const [energyCost, setEnergyCost] = useState<EnergyCost>(
    initialData?.energyCost || { physical: 10, social: 10, executive: 10 },
  );
  const [factors, setFactors] = useState(
    initialData?.factors || {
      initiationDifficulty: 5,
      terminationDifficulty: 5,
      isRestorative: false,
    },
  );

  // Repeating Task State
  const [isRepeating, setIsRepeating] = useState(!!initialData?.repeatConfig);
  const [frequency, setFrequency] = useState(
    initialData?.repeatConfig?.frequency || 1,
  );
  const [unit, setUnit] = useState<"days" | "weeks" | "months" | "years">(
    initialData?.repeatConfig?.unit || "days",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || isLoading) return;

    const taskData: Partial<Task> = {
      title,
      energyCost,
      factors,
    };

    if (isRepeating) {
      taskData.repeatConfig = { frequency, unit };
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
    const baseData = { ...taskData, description: "" } as Omit<
      Task,
      "id" | "createdAt"
    >;

    // Check if we are creating a repeating task from a specific context
    if (isRepeating && initialContext?.date) {
      // augment with nextDueDate for Immediate Start
      const dataWithDate = {
        ...baseData,
        nextDueDate: initialContext.date,
      };
      const newRepeatingTask = addTask(dataWithDate);

      // If we have a zoneId, we must implicitly assign the first instance to that zone
      if (initialContext.zoneId) {
        // We know useDayPlan projects instances with this deterministic ID format
        const virtualId = `virtual-${newRepeatingTask.id}-${initialContext.date}`;
        assignTaskToZone(virtualId, initialContext.zoneId);
      }
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
      initialContext?.zoneId
    ) {
      addToPlan(newTask.id, initialContext.zoneId);
    }
  };

  const resetForm = () => {
    setTitle("");
    setEnergyCost({ physical: 10, social: 10, executive: 10 });
    setFactors({
      initiationDifficulty: 5,
      terminationDifficulty: 5,
      isRestorative: false,
    });
    setIsRepeating(false);
    setFrequency(1);
    setUnit("days");
  };

  return {
    title,
    setTitle,
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
    handleSubmit,
    formId,
    isLoading,
  };
}
