import { beforeEach, describe, expect, it } from "vitest";
import type { EnergyTypeConfig } from "@/lib/energy-planner/schema";
import { clearAll } from "@/lib/energy-planner/storage";
import {
  createEmptyDayPlan,
  defaultCapacity,
  fetchDayPlanForDate,
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
    it("returns capacity object with 50 for each energy type", () => {
      const energyTypes: EnergyTypeConfig[] = [
        { id: "physical", label: "Physical", color: "#ff0000", isPreset: true },
        { id: "social", label: "Social", color: "#00ff00", isPreset: true },
      ];

      const capacity = getDefaultCapacity(energyTypes);

      expect(capacity).toEqual({
        physical: 50,
        social: 50,
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
        custom: 50,
      });
    });
  });

  describe("defaultCapacity", () => {
    it("is defined with default energy types", () => {
      expect(defaultCapacity).toBeDefined();
      expect(defaultCapacity.physical).toBe(50);
      expect(defaultCapacity.social).toBe(50);
      expect(defaultCapacity.executive).toBe(50);
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
        activities: [
          {
            id: "activity-1",
            title: "Activity 1",
            createdAt: new Date(),
            energyCost: { physical: 10, social: 10, executive: 10 },
            factors: {
              initiationDifficulty: 1,
              terminationDifficulty: 1,
              isRestorative: false,
            },
            completed: false,
          },
        ],
        dailyCapacity: defaultCapacity,
      };
      await saveDayPlanForDate("2026-01-14", plan);

      const retrieved = await fetchDayPlanForDate("2026-01-14");
      // JSON serialization converts Date to string, so we need to match loosely or adjust expectations
      // Using basic structural match
      expect(retrieved?.date).toBe(plan.date);
      expect(retrieved?.activities).toHaveLength(1);
      expect(retrieved?.activities[0].id).toBe("activity-1");
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
      expect(plan.activities).toEqual([]);
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
    it("returns empty array when no dates stored", async () => {
      const result = await getUncompletedActivities("2026-01-14");
      expect(result).toEqual([]);
    });

    it("returns uncompleted activities from previous days", async () => {
      await saveDayPlanForDate("2026-01-13", {
        date: "2026-01-13",
        activities: [
          {
            id: "activity-1",
            title: "Activity 1",
            energyCost: { physical: 10, social: 10, executive: 10 },
            factors: {
              initiationDifficulty: 5,
              terminationDifficulty: 3,
              isRestorative: false,
            },
            createdAt: new Date(),
            completed: false,
          },
        ],
        dailyCapacity: defaultCapacity,
      });

      const result = await getUncompletedActivities("2026-01-14");
      expect(result).toHaveLength(1);
      expect(result[0].activity.id).toBe("activity-1");
      expect(result[0].fromDate).toBe("2026-01-13");
    });

    it("excludes completed activities", async () => {
      await saveDayPlanForDate("2026-01-13", {
        date: "2026-01-13",
        activities: [
          {
            id: "activity-1",
            title: "Activity 1",
            energyCost: { physical: 10 },
            factors: {
              initiationDifficulty: 1,
              terminationDifficulty: 1,
              isRestorative: false,
            },
            createdAt: new Date(),
            completed: true,
          },
          {
            id: "activity-2",
            title: "Activity 2",
            energyCost: { physical: 10 },
            factors: {
              initiationDifficulty: 1,
              terminationDifficulty: 1,
              isRestorative: false,
            },
            createdAt: new Date(),
            completed: false,
          },
        ],
        dailyCapacity: defaultCapacity,
      });

      const result = await getUncompletedActivities("2026-01-14");
      expect(result).toHaveLength(1);
      expect(result[0].activity.id).toBe("activity-2");
    });

    it("skips future dates", async () => {
      await saveDayPlanForDate("2026-01-15", {
        date: "2026-01-15",
        activities: [
          {
            id: "activity-1",
            title: "Activity 1",
            energyCost: { physical: 10 },
            factors: {
              initiationDifficulty: 1,
              terminationDifficulty: 1,
              isRestorative: false,
            },
            createdAt: new Date(),
            completed: false,
          },
        ],
        dailyCapacity: defaultCapacity,
      });

      const result = await getUncompletedActivities("2026-01-14");
      expect(result).toHaveLength(0);
    });

    it("returns activities from multiple past days", async () => {
      await saveDayPlanForDate("2026-01-12", {
        date: "2026-01-12",
        activities: [
          {
            id: "activity-1",
            title: "A1",
            energyCost: { physical: 10, social: 10, executive: 10 },
            factors: {
              initiationDifficulty: 1,
              terminationDifficulty: 1,
              isRestorative: false,
            },
            createdAt: new Date(),
            completed: false,
          },
        ],
        dailyCapacity: defaultCapacity,
      });
      await saveDayPlanForDate("2026-01-13", {
        date: "2026-01-13",
        activities: [
          {
            id: "activity-1",
            title: "A1",
            energyCost: { physical: 10, social: 10, executive: 10 },
            factors: {
              initiationDifficulty: 1,
              terminationDifficulty: 1,
              isRestorative: false,
            },
            createdAt: new Date(),
            completed: false,
          },
        ],
        dailyCapacity: defaultCapacity,
      });

      const result = await getUncompletedActivities("2026-01-14");
      expect(result.length).toBeGreaterThanOrEqual(2);
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
