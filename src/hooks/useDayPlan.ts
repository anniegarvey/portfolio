"use client";

import { useEffect, useState } from "react";
import type { DayPlan } from "@/lib/energy-planner/schema";
import { defaultCapacity, loadInitialDayPlan } from "./utils";

export function useDayPlan() {
  const [dayPlan, setDayPlan] = useState<DayPlan>({
    date: new Date().toISOString().split("T")[0],
    selectedTaskIds: [],
    completedTaskIds: [],
    dailyCapacity: defaultCapacity,
  });

  useEffect(() => {
    loadInitialDayPlan(setDayPlan);
  }, []);

  useEffect(() => {
    localStorage.setItem("energy_planner_day_plan", JSON.stringify(dayPlan));
  }, [dayPlan]);

  const addToPlan = (taskId: string) => {
    setDayPlan((p) =>
      p.selectedTaskIds.includes(taskId)
        ? p
        : { ...p, selectedTaskIds: [...p.selectedTaskIds, taskId] },
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

  const toggleTaskCompletion = (taskId: string) => {
    setDayPlan((prev) => {
      const completed = prev.completedTaskIds;
      const isCompleted = completed.includes(taskId);
      return {
        ...prev,
        completedTaskIds: isCompleted
          ? completed.filter((id) => id !== taskId)
          : [...completed, taskId],
      };
    });
  };

  return { dayPlan, addToPlan, removeFromPlan, toggleTaskCompletion };
}
