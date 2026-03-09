import { beforeEach, describe, expect, it } from "vitest";
import type { Activity, EnergyTypeConfig } from "@/lib/energy-planner/schema";
import { clearAll } from "@/lib/energy-planner/storage";
import {
  createEmptyDayPlan,
  defaultCapacity,
  fetchDayPlanForDate,
  fetchOneOffPlanningState,
  formatDateForDisplay,
  generateUniqueKey,
  getAllStoredDates,
  getDefaultCapacity,
  getNextDay,
  getPreviousDay,
  getTodayDateString,
  getUncompletedActivities,
  isToday,
  saveDayPlanForDate,
  slugify,
} from "./utils";

describe("hooks/utils", () => {
  beforeEach(async () => {
    await clearAll();
  });

  describe("getDefaultCapacity", () => {
    it("returns capacity object with 0 for each energy type", () => {
      const energyTypes: EnergyTypeConfig[] = [
        { id: "physical", label: "Physical", color: "#ff0000", isPreset: true },
        { id: "social", label: "Social", color: "#00ff00", isPreset: true },
      ];

      const capacity = getDefaultCapacity(energyTypes);

      expect(capacity).toEqual({
        physical: 0,
        social: 0,
      });
    });

    it("returns empty object for empty energy types array", () => {
      const capacity = getDefaultCapacity([]);

      expect(capacity).toEqual({});
    });

    it("includes custom energy types", () => {
      const energyTypes: EnergyTypeConfig[] = [
        { id: "custom", label: "Custom", color: "#0000ff", isPreset: false },
      ];

      const capacity = getDefaultCapacity(energyTypes);

      expect(capacity).toEqual({
        custom: 0,
      });
    });
  });

  describe("defaultCapacity", () => {
    it("is defined with default energy types", () => {
      expect(defaultCapacity).toBeDefined();
      expect(defaultCapacity.physical).toBe(0);
      expect(defaultCapacity.social).toBe(0);
      expect(defaultCapacity.executive).toBe(0);
    });
  });

  describe("getTodayDateString", () => {
    it("returns today's date in YYYY-MM-DD format", () => {
      const result = getTodayDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("fetchDayPlanForDate and saveDayPlanForDate", () => {
    it("saves and retrieves day plan", async () => {
      const plan = {
        date: "2026-01-14",
        plannedInstances: [
          {
            id: "instance-1",
            sourceActivityId: "activity-1",
            completed: false,
          },
        ],
        dailyCapacity: defaultCapacity,
      };
      await saveDayPlanForDate("2026-01-14", plan);

      const retrieved = await fetchDayPlanForDate("2026-01-14");
      expect(retrieved?.date).toBe(plan.date);
      expect(retrieved?.plannedInstances).toHaveLength(1);
      expect(retrieved?.plannedInstances[0].id).toBe("instance-1");
    });

    it("returns null for non-existent date", async () => {
      const result = await fetchDayPlanForDate("1999-01-01");
      expect(result).toBeNull();
    });
  });

  describe("createEmptyDayPlan", () => {
    it("creates empty day plan with specified date", async () => {
      const plan = await createEmptyDayPlan("2026-01-15");
      expect(plan.date).toBe("2026-01-15");
      expect(plan.plannedInstances).toEqual([]);
    });
  });

  describe("getAllStoredDates", () => {
    it("returns empty array when no dates stored", async () => {
      expect(await getAllStoredDates()).toEqual([]);
    });

    it("returns sorted dates", async () => {
      await saveDayPlanForDate(
        "2026-01-15",
        await createEmptyDayPlan("2026-01-15"),
      );
      await saveDayPlanForDate(
        "2026-01-13",
        await createEmptyDayPlan("2026-01-13"),
      );
      await saveDayPlanForDate(
        "2026-01-14",
        await createEmptyDayPlan("2026-01-14"),
      );

      const dates = await getAllStoredDates();
      expect(dates).toEqual(["2026-01-13", "2026-01-14", "2026-01-15"]);
    });
  });

  describe("formatDateForDisplay", () => {
    it("formats date for display", () => {
      const result = formatDateForDisplay("2026-01-14");
      expect(result).toContain("2026");
    });
  });

  describe("isToday", () => {
    it("returns true for today's date", () => {
      const today = getTodayDateString();
      expect(isToday(today)).toBe(true);
    });

    it("returns false for other dates", () => {
      expect(isToday("1999-01-01")).toBe(false);
    });
  });

  describe("getPreviousDay and getNextDay", () => {
    it("getPreviousDay returns previous day", () => {
      expect(getPreviousDay("2026-01-15")).toBe("2026-01-14");
    });

    it("getNextDay returns next day", () => {
      expect(getNextDay("2026-01-14")).toBe("2026-01-15");
    });
  });

  describe("getUncompletedActivities", () => {
    const makeActivity = (id: string, title: string): Activity => ({
      id,
      title,
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
    });

    it("returns empty array when no dates stored", async () => {
      const map = new Map<string, Activity>();
      const result = await getUncompletedActivities("2026-01-14", map);
      expect(result).toEqual([]);
    });

    it("returns uncompleted activities from previous days", async () => {
      const activity = makeActivity("activity-1", "Activity 1");
      const activityMap = new Map([["activity-1", activity]]);

      await saveDayPlanForDate("2026-01-13", {
        date: "2026-01-13",
        plannedInstances: [
          {
            id: "instance-1",
            sourceActivityId: "activity-1",
            completed: false,
          },
        ],
        dailyCapacity: defaultCapacity,
      });

      const result = await getUncompletedActivities("2026-01-14", activityMap);
      expect(result).toHaveLength(1);
      expect(result[0].activity.id).toBe("activity-1");
      expect(result[0].instanceId).toBe("instance-1");
      expect(result[0].fromDate).toBe("2026-01-13");
    });

    it("excludes completed activities", async () => {
      const a1 = makeActivity("activity-1", "Activity 1");
      const a2 = makeActivity("activity-2", "Activity 2");
      const activityMap = new Map([
        ["activity-1", a1],
        ["activity-2", a2],
      ]);

      await saveDayPlanForDate("2026-01-13", {
        date: "2026-01-13",
        plannedInstances: [
          { id: "instance-1", sourceActivityId: "activity-1", completed: true },
          {
            id: "instance-2",
            sourceActivityId: "activity-2",
            completed: false,
          },
        ],
        dailyCapacity: defaultCapacity,
      });

      const result = await getUncompletedActivities("2026-01-14", activityMap);
      expect(result).toHaveLength(1);
      expect(result[0].activity.id).toBe("activity-2");
    });

    it("skips future dates", async () => {
      const activity = makeActivity("activity-1", "Activity 1");
      const activityMap = new Map([["activity-1", activity]]);

      await saveDayPlanForDate("2026-01-15", {
        date: "2026-01-15",
        plannedInstances: [
          {
            id: "instance-1",
            sourceActivityId: "activity-1",
            completed: false,
          },
        ],
        dailyCapacity: defaultCapacity,
      });

      const result = await getUncompletedActivities("2026-01-14", activityMap);
      expect(result).toHaveLength(0);
    });

    it("returns instances from multiple past days", async () => {
      const a1 = makeActivity("activity-1", "A1");
      const activityMap = new Map([["activity-1", a1]]);

      await saveDayPlanForDate("2026-01-12", {
        date: "2026-01-12",
        plannedInstances: [
          { id: "inst-12", sourceActivityId: "activity-1", completed: false },
        ],
        dailyCapacity: defaultCapacity,
      });
      await saveDayPlanForDate("2026-01-13", {
        date: "2026-01-13",
        plannedInstances: [
          { id: "inst-13", sourceActivityId: "activity-1", completed: false },
        ],
        dailyCapacity: defaultCapacity,
      });

      const result = await getUncompletedActivities("2026-01-14", activityMap);
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it("ignores instances where source activity is not in activityMap", async () => {
      const activityMap = new Map<string, Activity>(); // empty — no activities known

      await saveDayPlanForDate("2026-01-13", {
        date: "2026-01-13",
        plannedInstances: [
          {
            id: "instance-1",
            sourceActivityId: "deleted-activity",
            completed: false,
          },
        ],
        dailyCapacity: defaultCapacity,
      });

      const result = await getUncompletedActivities("2026-01-14", activityMap);
      expect(result).toHaveLength(0);
    });
  });

  describe("fetchOneOffPlanningState", () => {
    const makeOneOff = (id: string, title: string): Activity => ({
      id,
      title,
      energyCost: { physical: 10 },
      factors: {
        initiationDifficulty: 1,
        terminationDifficulty: 1,
        isRestorative: false,
      },
      createdAt: new Date(),
    });

    const makeRepeating = (id: string, title: string): Activity => ({
      id,
      title,
      energyCost: { physical: 10 },
      factors: {
        initiationDifficulty: 1,
        terminationDifficulty: 1,
        isRestorative: false,
      },
      createdAt: new Date(),
      repeatConfig: { frequency: 1, unit: "days" as const },
    });

    it("returns empty sets when no data stored", async () => {
      const map = new Map<string, Activity>();
      const result = await fetchOneOffPlanningState("2026-01-14", map);
      expect(result.uncompleted).toEqual([]);
      expect(result.scheduledOneOffIds.size).toBe(0);
      expect(result.completedOneOffIds.size).toBe(0);
    });

    it("marks a scheduled one-off in scheduledOneOffIds", async () => {
      const activity = makeOneOff("a1", "A1");
      const activityMap = new Map([["a1", activity]]);

      await saveDayPlanForDate("2026-01-14", {
        date: "2026-01-14",
        plannedInstances: [
          { id: "inst-1", sourceActivityId: "a1", completed: false },
        ],
        dailyCapacity: defaultCapacity,
      });

      const result = await fetchOneOffPlanningState("2026-01-14", activityMap);
      expect(result.scheduledOneOffIds.has("a1")).toBe(true);
    });

    it("marks a completed one-off in completedOneOffIds", async () => {
      const activity = makeOneOff("a1", "A1");
      const activityMap = new Map([["a1", activity]]);

      await saveDayPlanForDate("2026-01-13", {
        date: "2026-01-13",
        plannedInstances: [
          { id: "inst-1", sourceActivityId: "a1", completed: true },
        ],
        dailyCapacity: defaultCapacity,
      });

      const result = await fetchOneOffPlanningState("2026-01-14", activityMap);
      expect(result.scheduledOneOffIds.has("a1")).toBe(true);
      expect(result.completedOneOffIds.has("a1")).toBe(true);
      expect(result.uncompleted).toHaveLength(0);
    });

    it("includes past uncompleted one-offs but not today or future", async () => {
      const activity = makeOneOff("a1", "A1");
      const activityMap = new Map([["a1", activity]]);

      // Past — should appear in uncompleted
      await saveDayPlanForDate("2026-01-12", {
        date: "2026-01-12",
        plannedInstances: [
          { id: "past", sourceActivityId: "a1", completed: false },
        ],
        dailyCapacity: defaultCapacity,
      });
      // Today — should NOT appear in uncompleted
      await saveDayPlanForDate("2026-01-14", {
        date: "2026-01-14",
        plannedInstances: [
          { id: "today", sourceActivityId: "a1", completed: false },
        ],
        dailyCapacity: defaultCapacity,
      });

      const result = await fetchOneOffPlanningState("2026-01-14", activityMap);
      expect(result.uncompleted.map((u) => u.instanceId)).toContain("past");
      expect(result.uncompleted.map((u) => u.instanceId)).not.toContain(
        "today",
      );
    });

    it("ignores projected instances", async () => {
      const activity = makeOneOff("a1", "A1");
      const activityMap = new Map([["a1", activity]]);

      await saveDayPlanForDate("2026-01-14", {
        date: "2026-01-14",
        plannedInstances: [
          {
            id: "proj",
            sourceActivityId: "a1",
            completed: false,
            isProjected: true,
          },
        ],
        dailyCapacity: defaultCapacity,
      });

      const result = await fetchOneOffPlanningState("2026-01-14", activityMap);
      expect(result.scheduledOneOffIds.has("a1")).toBe(false);
    });

    it("ignores repeating activities", async () => {
      const activity = makeRepeating("r1", "R1");
      const activityMap = new Map([["r1", activity]]);

      await saveDayPlanForDate("2026-01-14", {
        date: "2026-01-14",
        plannedInstances: [
          { id: "inst", sourceActivityId: "r1", completed: false },
        ],
        dailyCapacity: defaultCapacity,
      });

      const result = await fetchOneOffPlanningState("2026-01-14", activityMap);
      expect(result.scheduledOneOffIds.has("r1")).toBe(false);
    });
  });

  describe("slugify", () => {
    it("converts label to lowercase kebab-case", () => {
      expect(slugify("Creative Energy")).toBe("creative-energy");
    });

    it("handles single word", () => {
      expect(slugify("Physical")).toBe("physical");
    });

    it("removes special characters", () => {
      expect(slugify("Energy!@#$%^&*()Type")).toBe("energy-type");
    });

    it("trims whitespace", () => {
      expect(slugify("  Physical Energy  ")).toBe("physical-energy");
    });

    it("handles multiple spaces", () => {
      expect(slugify("My   Custom   Type")).toBe("my-custom-type");
    });

    it("handles numbers", () => {
      expect(slugify("Energy 2024")).toBe("energy-2024");
    });

    it("returns empty string for empty input", () => {
      expect(slugify("")).toBe("");
    });

    it("returns empty string for special chars only", () => {
      expect(slugify("!@#$%^")).toBe("");
    });
  });

  describe("generateUniqueKey", () => {
    it("returns slugified label when no clash", () => {
      const existingKeys = ["physical", "social"];
      expect(generateUniqueKey("Creative Energy", existingKeys)).toBe(
        "creative-energy",
      );
    });

    it("appends -2 suffix when key clashes", () => {
      const existingKeys = ["physical", "social", "creative-energy"];
      expect(generateUniqueKey("Creative Energy", existingKeys)).toBe(
        "creative-energy-2",
      );
    });

    it("appends -3 suffix when -2 also clashes", () => {
      const existingKeys = ["creative-energy", "creative-energy-2"];
      expect(generateUniqueKey("Creative Energy", existingKeys)).toBe(
        "creative-energy-3",
      );
    });

    it("handles empty existing keys", () => {
      expect(generateUniqueKey("New Type", [])).toBe("new-type");
    });

    it("handles key that matches exactly", () => {
      const existingKeys = ["physical"];
      expect(generateUniqueKey("Physical", existingKeys)).toBe("physical-2");
    });
  });
});
