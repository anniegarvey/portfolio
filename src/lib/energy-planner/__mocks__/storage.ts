import { vi } from "vitest";
import type {
  Activity,
  PlannedInstance,
  ZoneConfig,
} from "@/lib/energy-planner/schema";

let mockActivities: Activity[] = [];
let mockDayPlans: Record<string, unknown> = {};
let mockZones: ZoneConfig[] = [];

export const fetchActivities = vi.fn(async () => [...mockActivities]);
export const storeActivities = vi.fn((activities: Activity[]) => {
  mockActivities = [...activities];
  return Promise.resolve();
});

export const fetchDayPlan = vi.fn(
  async (date: string) => mockDayPlans[date] || null,
);
export const storeDayPlan = vi.fn((date: string, plan: unknown) => {
  mockDayPlans[date] = plan;
  return Promise.resolve();
});

export const deleteDayPlan = vi.fn((date: string) => {
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

export const fetchZones = vi.fn(async () => mockZones);
export const storeZones = vi.fn((zones: ZoneConfig[]) => {
  mockZones = zones;
  return Promise.resolve();
});

export const clearAll = vi.fn(async () => {
  mockActivities = [];
  mockDayPlans = {};
  mockZones = [];
});

export const migrateStorageIfNeeded = vi.fn(async () => {});

// --- Helpers also used directly by tests ---

/** Build a minimal stored day plan shape for test setup */
export function makeStoredDayPlan(instances: PlannedInstance[] = []) {
  return {
    plannedInstances: instances,
    dailyCapacity: { physical: 100, social: 100, executive: 100 },
  };
}

export const __reset = () => {
  mockActivities = [];
  mockDayPlans = {};
  mockZones = [];
  vi.clearAllMocks();
  // Restore default implementations after clearAllMocks
  fetchActivities.mockImplementation(async () => [...mockActivities]);
  storeActivities.mockImplementation((activities: Activity[]) => {
    mockActivities = [...activities];
    return Promise.resolve();
  });
  fetchDayPlan.mockImplementation(
    async (date: string) => mockDayPlans[date] || null,
  );
  storeDayPlan.mockImplementation((date: string, plan: unknown) => {
    mockDayPlans[date] = plan;
    return Promise.resolve();
  });
  deleteDayPlan.mockImplementation((date: string) => {
    delete mockDayPlans[date];
    return Promise.resolve();
  });
  fetchAllDayPlanDates.mockImplementation(async () =>
    Object.keys(mockDayPlans),
  );
  fetchZones.mockImplementation(async () => mockZones);
  storeZones.mockImplementation((zones: ZoneConfig[]) => {
    mockZones = zones;
    return Promise.resolve();
  });
  migrateStorageIfNeeded.mockImplementation(async () => {});
};
