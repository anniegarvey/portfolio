import { vi } from "vitest";
import type { Task, ZoneConfig } from "@/lib/energy-planner/schema";

let mockTasks: Task[] = [];
let mockCapacity = { physical: 100, social: 100, executive: 100 };
// biome-ignore lint/suspicious/noExplicitAny: Mock storage
let mockDayPlans: Record<string, any> = {};

export const getOneOffTasks = vi.fn(async () => [...mockTasks]);
export const setOneOffTasks = vi.fn((tasks) => {
  mockTasks = [...tasks];
  return Promise.resolve();
});

export const getDailyCapacity = vi.fn(async () => ({ ...mockCapacity }));
export const setDailyCapacity = vi.fn((capacity) => {
  mockCapacity = { ...capacity };
  return Promise.resolve();
});

export const getDayPlan = vi.fn(async (date) => mockDayPlans[date] || null);
export const setDayPlan = vi.fn((date, plan) => {
  mockDayPlans[date] = plan;
  return Promise.resolve();
});

export const getDayPlanForDate = vi.fn(
  async (date) => mockDayPlans[date] || null,
);
export const saveDayPlanForDate = vi.fn((date, plan) => {
  mockDayPlans[date] = plan;
  return Promise.resolve();
});

export const deleteDayPlan = vi.fn((date) => {
  delete mockDayPlans[date];
  return Promise.resolve();
});

export const getAllDayPlanDates = vi.fn(async () => Object.keys(mockDayPlans));

export const getEnergyTypes = vi.fn(async () => [
  { id: "physical", label: "Physical", weight: 1 },
  { id: "social", label: "Social", weight: 1 },
  { id: "executive", label: "Executive", weight: 1 },
]);
export const setEnergyTypes = vi.fn(() => Promise.resolve());

export const clearAll = vi.fn(async () => {
  mockTasks = [];
  mockDayPlans = {};
  mockCapacity = { physical: 100, social: 100, executive: 100 };
});

// Helper to reset the mock store
let mockZones: ZoneConfig[] = [];

export const getZones = vi.fn(async () => mockZones);
export const setZones = vi.fn((zones) => {
  mockZones = zones;
  return Promise.resolve();
});

export const __reset = () => {
  mockTasks = [];
  mockCapacity = { physical: 100, social: 100, executive: 100 };
  mockDayPlans = {};
  mockZones = [];
};
