import { vi } from "vitest";
import type { Task, ZoneConfig } from "@/lib/energy-planner/schema";

let mockTasks: Task[] = [];
let mockRepeatingTasks: Task[] = [];
let mockCapacity = { physical: 100, social: 100, executive: 100 };
let mockDayPlans: Record<string, unknown> = {};

export const fetchOneOffTasks = vi.fn(async () => [...mockTasks]);
export const storeOneOffTasks = vi.fn((tasks) => {
  mockTasks = [...tasks];
  return Promise.resolve();
});

export const fetchRepeatingTasks = vi.fn(async () => [...mockRepeatingTasks]);
export const storeRepeatingTasks = vi.fn((tasks) => {
  mockRepeatingTasks = [...tasks];
  return Promise.resolve();
});

export const getDailyCapacity = vi.fn(async () => ({ ...mockCapacity }));
export const setDailyCapacity = vi.fn((capacity) => {
  mockCapacity = { ...capacity };
  return Promise.resolve();
});

export const fetchDayPlan = vi.fn(async (date) => mockDayPlans[date] || null);
export const storeDayPlan = vi.fn((date, plan) => {
  mockDayPlans[date] = plan;
  return Promise.resolve();
});

export const fetchDayPlanForDate = vi.fn(
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

export const fetchAllDayPlanDates = vi.fn(async () =>
  Object.keys(mockDayPlans),
);

export const fetchEnergyTypes = vi.fn(async () => [
  { id: "physical", label: "Physical", weight: 1 },
  { id: "social", label: "Social", weight: 1 },
  { id: "executive", label: "Executive", weight: 1 },
]);
export const storeEnergyTypes = vi.fn(() => Promise.resolve());

export const clearAll = vi.fn(async () => {
  mockTasks = [];
  mockRepeatingTasks = [];
  mockDayPlans = {};
  mockCapacity = { physical: 100, social: 100, executive: 100 };
});

// Helper to reset the mock store
let mockZones: ZoneConfig[] = [];

export const fetchZones = vi.fn(async () => mockZones);
export const storeZones = vi.fn((zones) => {
  mockZones = zones;
  return Promise.resolve();
});

export const __reset = () => {
  mockTasks = [];
  mockRepeatingTasks = [];
  mockCapacity = { physical: 100, social: 100, executive: 100 };
  mockDayPlans = {};
  mockZones = [];
};
