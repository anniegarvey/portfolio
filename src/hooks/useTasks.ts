"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { RepeatingTask, Task } from "@/lib/energy-planner/schema";
import {
  getOneOffTasks,
  getRepeatingTasks,
  setOneOffTasks,
  setRepeatingTasks,
} from "@/lib/energy-planner/storage";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [repeatingTasks, setRepeatingTasksState] = useState<RepeatingTask[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load tasks on mount
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      const storedTasks = await getOneOffTasks();
      const storedRepeatingTasks = await getRepeatingTasks();
      if (cancelled) return;
      setTasks(storedTasks);
      setRepeatingTasksState(storedRepeatingTasks);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Save tasks whenever they change (and loading is done)
  useEffect(() => {
    if (!isLoading) {
      setOneOffTasks(tasks);
    }
  }, [tasks, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      setRepeatingTasks(repeatingTasks);
    }
  }, [repeatingTasks, isLoading]);

  const addTask = (taskData: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      createdAt: new Date(),
    };

    if (taskData.repeatConfig) {
      // It's a repeating task
      // We set nextDueDate to today initially, or handle in the caller?
      // Requirement: "The first instance... will be planned".
      // For the Repeating Definition, we just set the nextDueDate.
      // If we want it to be projected on Today, set nextDueDate = Today.
      // However, the caller might want to explicitly plan it.
      const repeatingTask: RepeatingTask = {
        ...newTask,
        repeatConfig: taskData.repeatConfig,
        nextDueDate: new Date().toISOString().split("T")[0], // Default to today
      };
      setRepeatingTasksState((prev) => [...prev, repeatingTask]);
      return repeatingTask;
    }

    setTasks((prev) => [...prev, newTask]);
    return newTask;
  };

  const updateTask = (updatedTask: Task) => {
    if (updatedTask.repeatConfig) {
      // Updating a repeating task
      setRepeatingTasksState((prev) =>
        prev.map((t) =>
          t.id === updatedTask.id ? (updatedTask as RepeatingTask) : t,
        ),
      );
      // Also check if it WAS a one-off task (migration case?)
      // For now, assume IDs don't collide, but good to be safe.
      setTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
    } else {
      // Updating a one-off task
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      );
      // Check if it WAS a repeating task
      setRepeatingTasksState((prev) =>
        prev.filter((t) => t.id !== updatedTask.id),
      );
    }
  };

  const removeTaskState = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setRepeatingTasksState((prev) => prev.filter((t) => t.id !== taskId));
  };

  const reorderTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
  };

  // Add task back to available tasks (used when unplanning a task)
  const addTaskToAvailable = (task: Task) => {
    // If it has repeat config, it goes to repeating tasks
    if (task.repeatConfig) {
      setRepeatingTasksState((prev) => {
        if (prev.some((t) => t.id === task.id)) return prev;
        // We need to make sure it matches RepeatingTask schema (nextDueDate)
        // If taking from Planner, it might be missing nextDueDate if passed as generic Task
        // But unplanning a repeating *instance* shouldn't necessarily delete the definition.
        // Wait, "instances of repeat tasks that have been completed...".
        // "Return a task to unplanned" for a Repeater?
        // The logic in useDayPlan says "Add back to one-off".
        // For Repeating Tasks, "instances... visible... even after first instance".
        // So the Repeating Definition should ALREADY be there.
        // We shouldn't duplicate it.
        return prev;
      });
      return;
    }

    setTasks((prev) => {
      // Don't add if already exists
      if (prev.some((t) => t.id === task.id)) return prev;
      // Add to beginning (most recently unplanned appears first)
      return [task, ...prev];
    });
  };

  // Remove task from available tasks (used when planning a task)
  const removeTaskFromAvailable = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    // Do NOT remove from repeating tasks when planning an instance!
    // "repeat tasks should remain visible... even after the first instance being planned in"
  };

  return {
    tasks,
    repeatingTasks,
    isLoading,
    addTask,
    updateTask,
    removeTaskState,
    reorderTasks,
    addTaskToAvailable,
    removeTaskFromAvailable,
  };
}
