"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Task } from "@/lib/energy-planner/schema";
import {
  fetchOneOffTasks,
  fetchRepeatingTasks,
  storeOneOffTasks,
  storeRepeatingTasks,
} from "@/lib/energy-planner/storage";

export function useTasks() {
  const [oneOffTasks, setOneOffTasksState] = useState<Task[]>([]);
  const [repeatingTasks, setRepeatingTasksState] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load tasks on mount
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      const [storedTasks, storedRepeatingTasks] = await Promise.all([
        fetchOneOffTasks(),
        fetchRepeatingTasks(),
      ]);
      if (cancelled) return;
      setOneOffTasksState(storedTasks);
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
      storeOneOffTasks(oneOffTasks);
    }
  }, [oneOffTasks, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      storeRepeatingTasks(repeatingTasks);
    }
  }, [repeatingTasks, isLoading]);

  const addTask = (taskData: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      createdAt: new Date(),
    };

    if (taskData.repeatConfig) {
      const repeatingTask: Task = {
        ...newTask,
        repeatConfig: {
          ...taskData.repeatConfig,
          nextDueDate:
            taskData.repeatConfig.nextDueDate ||
            new Date().toISOString().split("T")[0],
        },
      };
      setRepeatingTasksState((prev) => [...prev, repeatingTask]);
      return repeatingTask;
    }

    setOneOffTasksState((prev) => [...prev, newTask]);
    return newTask;
  };

  const updateTask = (updatedTask: Task) => {
    if (updatedTask.repeatConfig) {
      // Updating a repeating task
      setRepeatingTasksState((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? (updatedTask as Task) : t)),
      );
      // Also check if it WAS a one-off task (migration case?)
      // For now, assume IDs don't collide, but good to be safe.
      setOneOffTasksState((prev) =>
        prev.filter((t) => t.id !== updatedTask.id),
      );
    } else {
      // Updating a one-off task
      setOneOffTasksState((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      );
      // Check if it WAS a repeating task
      setRepeatingTasksState((prev) =>
        prev.filter((t) => t.id !== updatedTask.id),
      );
    }
  };

  const removeTaskState = (taskId: string) => {
    setOneOffTasksState((prev) => prev.filter((t) => t.id !== taskId));
    setRepeatingTasksState((prev) => prev.filter((t) => t.id !== taskId));
  };

  const reorderTasks = (newTasks: Task[]) => {
    setOneOffTasksState(newTasks);
  };

  // Add task back to available tasks (used when unplanning a task)
  const addTaskToAvailable = (task: Task) => {
    // If it has repeat config, it goes to repeating tasks
    if (task.repeatConfig) {
      setRepeatingTasksState((prev) => {
        if (prev.some((t) => t.id === task.id)) return prev;
        return prev;
      });
      return;
    }

    setOneOffTasksState((prev) => {
      // Don't add if already exists
      if (prev.some((t) => t.id === task.id)) return prev;
      // Add to beginning (most recently unplanned appears first)
      return [task, ...prev];
    });
  };

  // Remove task from available tasks (used when planning a task)
  const removeTaskFromAvailable = (taskId: string) => {
    setOneOffTasksState((prev) => prev.filter((t) => t.id !== taskId));
    // Do NOT remove from repeating tasks when planning an instance!
    // "repeat tasks should remain visible... even after the first instance being planned in"
  };

  return {
    oneOffTasks,
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
