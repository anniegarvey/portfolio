"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Task } from "@/lib/energy-planner/schema";
import { getOneOffTasks, setOneOffTasks } from "@/lib/energy-planner/storage";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load tasks on mount
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      const storedTasks = await getOneOffTasks();
      if (cancelled) return;
      setTasks(storedTasks);
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

  const addTask = (taskData: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      createdAt: new Date(),
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    );
  };

  const removeTaskState = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const reorderTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
  };

  // Add task back to available tasks (used when unplanning a task)
  const addTaskToAvailable = (task: Task) => {
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
  };

  return {
    tasks,
    isLoading,
    addTask,
    updateTask,
    removeTaskState,
    reorderTasks,
    addTaskToAvailable,
    removeTaskFromAvailable,
  };
}
