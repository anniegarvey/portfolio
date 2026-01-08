"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { DayPlan, EnergyCost, Task } from "./schema";

const defaultCapacity: EnergyCost = { physical: 50, social: 50, executive: 50 };

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: State logic is cohesive
export function useEnergyPlannerState() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dailyCapacity, setDailyCapacity] =
    useState<EnergyCost>(defaultCapacity);
  const [dayPlan, setDayPlan] = useState<DayPlan>({
    date: new Date().toISOString().split("T")[0],
    selectedTaskIds: [],
    completedTaskIds: [],
    dailyCapacity: defaultCapacity,
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem("energy_planner_tasks");
      const storedCapacity = localStorage.getItem("energy_planner_capacity");
      const storedPlan = localStorage.getItem("energy_planner_day_plan");

      if (storedTasks) setTasks(JSON.parse(storedTasks));
      if (storedCapacity) setDailyCapacity(JSON.parse(storedCapacity));
      if (storedPlan) {
        const parsedPlan = JSON.parse(storedPlan);
        if (parsedPlan.date === new Date().toISOString().split("T")[0]) {
          setDayPlan(parsedPlan);
        } else {
          setDayPlan({
            date: new Date().toISOString().split("T")[0],
            selectedTaskIds: [],
            completedTaskIds: [],
            dailyCapacity: storedCapacity
              ? JSON.parse(storedCapacity)
              : defaultCapacity,
          });
        }
      }
    } catch (e) {
      console.error("Failed to load energy planner data", e);
    }
  }, []);

  // Save changes
  useEffect(() => {
    localStorage.setItem("energy_planner_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(
      "energy_planner_capacity",
      JSON.stringify(dailyCapacity),
    );
  }, [dailyCapacity]);

  useEffect(() => {
    localStorage.setItem("energy_planner_day_plan", JSON.stringify(dayPlan));
  }, [dayPlan]);

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

  const removeFromPlan = (taskId: string) => {
    setDayPlan((prev) => ({
      ...prev,
      selectedTaskIds: prev.selectedTaskIds.filter((id) => id !== taskId),
      completedTaskIds: (prev.completedTaskIds || []).filter(
        (id) => id !== taskId,
      ),
    }));
  };

  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    removeFromPlan(taskId);
  };

  const addToPlan = (taskId: string) => {
    if (!dayPlan.selectedTaskIds.includes(taskId)) {
      setDayPlan((prev) => ({
        ...prev,
        selectedTaskIds: [...prev.selectedTaskIds, taskId],
      }));
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    setDayPlan((prev) => {
      const completed = prev.completedTaskIds || [];
      const isCompleted = completed.includes(taskId);
      return {
        ...prev,
        completedTaskIds: isCompleted
          ? completed.filter((id) => id !== taskId)
          : [...completed, taskId],
      };
    });
  };

  const calculateEnergyUsage = (): EnergyCost => {
    const selectedTasks = tasks.filter((t) =>
      dayPlan.selectedTaskIds.includes(t.id),
    );
    return selectedTasks.reduce(
      (acc, task) => ({
        physical: acc.physical + task.energyCost.physical,
        social: acc.social + task.energyCost.social,
        executive: acc.executive + task.energyCost.executive,
      }),
      { physical: 0, social: 0, executive: 0 },
    );
  };

  const checkExceedsCapacity = () => {
    const usage = calculateEnergyUsage();
    const exceededTypes: string[] = [];

    if (usage.physical > dailyCapacity.physical) exceededTypes.push("Physical");
    if (usage.social > dailyCapacity.social) exceededTypes.push("Social");
    if (usage.executive > dailyCapacity.executive)
      exceededTypes.push("Executive");

    if (exceededTypes.length > 0) {
      return {
        exceeded: true,
        message: `Warning: You have exceeded your ${exceededTypes.join(", ")} energy capacity!`,
      };
    }
    return { exceeded: false };
  };

  return {
    tasks,
    addTask,
    updateTask,
    removeTask,
    dailyCapacity,
    setDailyCapacity,
    dayPlan,
    addToPlan,
    removeFromPlan,
    toggleTaskCompletion,
    calculateEnergyUsage,
    checkExceedsCapacity,
  };
}
