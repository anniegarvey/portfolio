import { vi } from "vitest";
import type { Activity, ZoneConfig } from "@/lib/energy-planner/schema";

let mockActivities: Activity[] = [];
let mockRepeatingActivities: Activity[] = [];
let mockCapacity = { physical: 100, social: 100, executive: 100 };
let mockDayPlans: Record<string, unknown> = {};

export const fetchOneOffActivities = vi.fn(async () => [...mockActivities]);
export const storeOneOffActivities = vi.fn((activities) => {
  mockActivities = [...activities];
  return Promise.resolve();
});

export const fetchRepeatingActivities = vi.fn(async () => [
  ...mockRepeatingActivities,
]);
export const storeRepeatingActivities = vi.fn((activities) => {
  mockRepeatingActivities = [...activities];
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
  mockActivities = [];
  mockRepeatingActivities = [];
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
  mockActivities = [];
  mockRepeatingActivities = [];
  mockCapacity = { physical: 100, social: 100, executive: 100 };
  mockDayPlans = {};
  mockZones = [];
};
