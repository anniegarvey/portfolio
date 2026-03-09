import type { Activity, PlannedInstance } from "@/lib/energy-planner/schema";
import type { StoredDayPlan } from "@/lib/energy-planner/storage";

export const TODAY = new Date().toISOString().split("T")[0];
export const YESTERDAY = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
})();

export const DEFAULT_CAPACITY = {
  physical: 49,
  social: 50,
  executive: 51,
};

export const mockOneOffActivity: Activity = {
  id: "aaaaaaaa-0000-0000-0000-000000000001",
  title: "Morning Exercise",
  energyCost: { physical: 30, social: 5, executive: 10 },
  factors: {
    initiationDifficulty: 7,
    terminationDifficulty: 3,
    isRestorative: true,
  },
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
};

export const mockRepeatingActivity: Activity = {
  id: "bbbbbbbb-0000-0000-0000-000000000001",
  title: "Daily Yoga",
  energyCost: { physical: 20, social: 0, executive: 5 },
  factors: {
    initiationDifficulty: 3,
    terminationDifficulty: 1,
    isRestorative: true,
  },
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  repeatConfig: {
    frequency: 1,
    unit: "days",
    nextDueDate: TODAY,
  },
};

export function mockPlannedInstance(
  activityId: string,
  overrides?: Partial<PlannedInstance>,
): PlannedInstance {
  return {
    id: `cccccccc-0000-0000-0000-${activityId.slice(-12)}`,
    sourceActivityId: activityId,
    completed: false,
    ...overrides,
  };
}

export function mockStoredDayPlan(
  instances: PlannedInstance[],
  capacity = DEFAULT_CAPACITY,
): StoredDayPlan {
  return {
    dailyCapacity: capacity,
    plannedInstances: instances.length > 0 ? instances : undefined,
  };
}
