"use client";

import { useId, useState } from "react";
import { useEnergyPlanner } from "@/lib/energy-planner/context";
import type { EnergyCost, Task } from "@/lib/energy-planner/schema";

interface UseTaskFormProps {
  initialData?: Task;
  onClose?: () => void;
}

export function useTaskForm({ initialData, onClose }: UseTaskFormProps) {
  const { addTask, updateTask } = useEnergyPlanner();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const taskData = { title, energyCost, factors };

    if (initialData) {
      updateTask({ ...initialData, ...taskData });
    } else {
      addTask({ ...taskData, description: "" });
    }

    if (onClose) {
      onClose();
    } else {
      setTitle("");
      setEnergyCost({ physical: 10, social: 10, executive: 10 });
      setFactors({
        initiationDifficulty: 5,
        terminationDifficulty: 5,
        isRestorative: false,
      });
    }
  };

  return {
    title,
    setTitle,
    energyCost,
    setEnergyCost,
    factors,
    setFactors,
    handleSubmit,
    formId,
  };
}
