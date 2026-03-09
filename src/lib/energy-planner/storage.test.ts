import { clear, createStore, get, set } from "idb-keyval";
import { beforeEach, describe, expect, it } from "vitest";
import type { Activity } from "./schema";
import {
  fetchActivities,
  fetchDayPlan,
  migrateStorageIfNeeded,
} from "./storage";

// Access to the same store instance used in storage.ts
const store = createStore("energy-planner-db", "data");

const mockActivity1: Activity = {
  id: "activity-1",
  title: "Test One-Off",
  createdAt: new Date("2024-01-01"),
  energyCost: { physical: 10 },
  factors: {
    initiationDifficulty: 1,
    terminationDifficulty: 1,
    isRestorative: false,
  },
};

const mockActivity2: Activity = {
  id: "activity-2",
  title: "Test Repeating",
  createdAt: new Date("2024-01-02"),
  energyCost: { social: 20 },
  factors: {
    initiationDifficulty: 2,
    terminationDifficulty: 2,
    isRestorative: false,
  },
  repeatConfig: { frequency: 1, unit: "days" },
};

describe("storage migration", () => {
  beforeEach(async () => {
    await clear(store);
  });

  it("migrates legacy split activities to single store", async () => {
    // Set up legacy state
    await set("one-off-activities", [mockActivity1], store);
    await set("repeating-activities", [mockActivity2], store);

    await migrateStorageIfNeeded();

    const activities = await fetchActivities();
    expect(activities).toHaveLength(2);
    expect(activities.find((a) => a.id === "activity-1")).toBeDefined();
    expect(activities.find((a) => a.id === "activity-2")).toBeDefined();

    // Legacy keys must be removed so migration doesn't run again on reload
    expect(await get("one-off-activities", store)).toBeUndefined();
    expect(await get("repeating-activities", store)).toBeUndefined();
  });

  it("does nothing if no legacy data exists", async () => {
    // Normal state
    await set("activities", [mockActivity1], store);

    await migrateStorageIfNeeded();

    const activities = await fetchActivities();
    expect(activities).toHaveLength(1);
  });

  it("migrates full PlannedActivity records to PlannedInstances in day plans", async () => {
    await set("one-off-activities", [mockActivity1], store);
    await set("repeating-activities", [mockActivity2], store);

    // Legacy day plan with full activities embedded
    await set(
      "day-2024-01-03",
      {
        dailyCapacity: { physical: 100 },
        activities: [
          {
            ...mockActivity1,
            id: "activity-1", // one-offs kept their original IDs
            completed: true,
            zoneId: "morning",
          },
          {
            ...mockActivity2,
            id: "virtual-activity-2-2024-01-03",
            repeatingActivityId: "activity-2",
            completed: false,
            isProjected: false, // concrete instance
          },
          {
            ...mockActivity2,
            id: "virtual-activity-2-projected",
            repeatingActivityId: "activity-2",
            isProjected: true, // should be dropped
          },
        ],
      },
      store,
    );

    await migrateStorageIfNeeded();

    const dayPlan = await fetchDayPlan("2024-01-03");
    expect(dayPlan).toBeDefined();
    expect(dayPlan?.plannedInstances).toHaveLength(2);

    // Check one-off migration
    const instance1 = dayPlan?.plannedInstances?.find(
      (i) => i.id === "activity-1",
    );
    expect(instance1).toBeDefined();
    expect(instance1?.sourceActivityId).toBe("activity-1"); // restored source ID from legacy activity ID
    expect(instance1?.completed).toBe(true);
    expect(instance1?.zoneId).toBe("morning");

    // Check repeating migration
    const instance2 = dayPlan?.plannedInstances?.find(
      (i) => i.id === "virtual-activity-2-2024-01-03",
    );
    expect(instance2).toBeDefined();
    expect(instance2?.sourceActivityId).toBe("activity-2");
    expect(instance2?.completed).toBe(false);
  });

  it("does not migrate day plans that already use plannedInstances", async () => {
    await set("one-off-activities", [mockActivity1], store);

    // Already migrated day plan
    await set(
      "day-2024-01-04",
      {
        dailyCapacity: { physical: 100 },
        plannedInstances: [
          { id: "inst-1", sourceActivityId: "activity-1", completed: false },
        ],
      },
      store,
    );

    await migrateStorageIfNeeded();

    const dayPlan = await fetchDayPlan("2024-01-04");
    expect(dayPlan?.plannedInstances).toHaveLength(1);
    expect(dayPlan?.plannedInstances?.[0].id).toBe("inst-1");
  });
});
