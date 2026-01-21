"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Task } from "@/lib/energy-planner/schema";
import { getTasks, setTasks as saveTasks } from "@/lib/energy-planner/storage";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getTasks().then((stored) => {
      setTasks(stored);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveTasks(tasks);
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

  return {
    tasks,
    isLoading,
    addTask,
    updateTask,
    removeTaskState,
    reorderTasks,
  };
}
