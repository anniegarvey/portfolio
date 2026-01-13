import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { DayPlan, EnergyCost, EnergyTypeConfig, Task } from "./schema";
import { DEFAULT_ENERGY_TYPES } from "./schema";

function getDefaultCapacity(energyTypes: EnergyTypeConfig[]): EnergyCost {
  return energyTypes.reduce((acc, type) => {
    acc[type.id] = 50;
    return acc;
  }, {} as EnergyCost);
}

const defaultCapacity: EnergyCost = getDefaultCapacity(DEFAULT_ENERGY_TYPES);

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("energy_planner_tasks");
    if (stored) setTasks(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("energy_planner_tasks", JSON.stringify(tasks));
  }, [tasks]);

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

  return { tasks, addTask, updateTask, removeTaskState };
}

export function useDailyCapacity() {
  const [dailyCapacity, setDailyCapacity] =
    useState<EnergyCost>(defaultCapacity);

  useEffect(() => {
    const stored = localStorage.getItem("energy_planner_capacity");
    if (stored) setDailyCapacity(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "energy_planner_capacity",
      JSON.stringify(dailyCapacity),
    );
  }, [dailyCapacity]);

  return { dailyCapacity, setDailyCapacity };
}

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

function loadInitialDayPlan(setDayPlan: (plan: DayPlan) => void) {
  const today = new Date().toISOString().split("T")[0];
  const stored = localStorage.getItem("energy_planner_day_plan");

  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.date === today) {
      setDayPlan(parsed);
      return;
    }
  }

  const cap = localStorage.getItem("energy_planner_capacity");
  let dailyCapacity = defaultCapacity;
  if (cap) {
    dailyCapacity = JSON.parse(cap);
  }

  setDayPlan({
    date: today,
    selectedTaskIds: [],
    completedTaskIds: [],
    dailyCapacity,
  });
}

export function useEnergyTypes() {
  const [energyTypes, setEnergyTypes] =
    useState<EnergyTypeConfig[]>(DEFAULT_ENERGY_TYPES);

  useEffect(() => {
    const stored = localStorage.getItem("energy_planner_types");
    if (stored) {
      setEnergyTypes(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("energy_planner_types", JSON.stringify(energyTypes));
  }, [energyTypes]);

  const addEnergyType = (
    typeData: Omit<EnergyTypeConfig, "id" | "isPreset">,
  ) => {
    const newType: EnergyTypeConfig = {
      ...typeData,
      id: uuidv4(),
      isPreset: false,
    };
    setEnergyTypes((prev) => [...prev, newType]);
  };

  const updateEnergyType = (updatedType: EnergyTypeConfig) => {
    setEnergyTypes((prev) =>
      prev.map((t) => (t.id === updatedType.id ? updatedType : t)),
    );
  };

  const removeEnergyType = (typeId: string) => {
    setEnergyTypes((prev) => prev.filter((t) => t.id !== typeId));
  };

  return { energyTypes, addEnergyType, updateEnergyType, removeEnergyType };
}
