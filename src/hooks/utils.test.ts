import { beforeEach, describe, expect, it } from "vitest";
import type { EnergyTypeConfig, Task } from "@/lib/energy-planner/schema";
import {
  createEmptyDayPlan,
  defaultCapacity,
  formatDateForDisplay,
  getAllPlannedTaskIds,
  getAllStoredDates,
  getDayPlanForDate,
  getDefaultCapacity,
  getNextDay,
  getPreviousDay,
  getTodayDateString,
  getUncompletedTasks,
  isToday,
  saveDayPlanForDate,
} from "./utils";

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test file with multiple test cases
describe("hooks/utils", () => {
  beforeEach(() => {
    localStorage.clear();
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

  describe("getDayPlanForDate and saveDayPlanForDate", () => {
    it("saves and retrieves day plan", () => {
      const plan = {
        date: "2026-01-14",
        selectedTaskIds: ["task-1"],
        completedTaskIds: [],
        dailyCapacity: defaultCapacity,
      };
      saveDayPlanForDate("2026-01-14", plan);

      const retrieved = getDayPlanForDate("2026-01-14");
      expect(retrieved).toEqual(plan);
    });

    it("returns null for non-existent date", () => {
      const result = getDayPlanForDate("1999-01-01");
      expect(result).toBeNull();
    });
  });

  describe("createEmptyDayPlan", () => {
    it("creates empty day plan with specified date", () => {
      const plan = createEmptyDayPlan("2026-01-15");
      expect(plan.date).toBe("2026-01-15");
      expect(plan.selectedTaskIds).toEqual([]);
      expect(plan.completedTaskIds).toEqual([]);
    });
  });

  describe("getAllStoredDates", () => {
    it("returns empty array when no dates stored", () => {
      expect(getAllStoredDates()).toEqual([]);
    });

    it("returns sorted dates", () => {
      saveDayPlanForDate("2026-01-15", createEmptyDayPlan("2026-01-15"));
      saveDayPlanForDate("2026-01-13", createEmptyDayPlan("2026-01-13"));
      saveDayPlanForDate("2026-01-14", createEmptyDayPlan("2026-01-14"));

      const dates = getAllStoredDates();
      expect(dates).toEqual(["2026-01-13", "2026-01-14", "2026-01-15"]);
    });
  });

  describe("getAllPlannedTaskIds", () => {
    it("returns empty set when no tasks planned", () => {
      const ids = getAllPlannedTaskIds();
      expect(ids.size).toBe(0);
    });

    it("returns task IDs from all stored dates", () => {
      saveDayPlanForDate("2026-01-13", {
        date: "2026-01-13",
        selectedTaskIds: ["task-a", "task-b"],
        completedTaskIds: [],
        dailyCapacity: defaultCapacity,
      });
      saveDayPlanForDate("2026-01-14", {
        date: "2026-01-14",
        selectedTaskIds: ["task-c"],
        completedTaskIds: [],
        dailyCapacity: defaultCapacity,
      });

      const ids = getAllPlannedTaskIds();
      expect(ids.has("task-a")).toBe(true);
      expect(ids.has("task-b")).toBe(true);
      expect(ids.has("task-c")).toBe(true);
    });

    it("handles plans without selectedTaskIds gracefully", () => {
      // Manually set a plan missing the selectedTaskIds array
      localStorage.setItem(
        "energy_planner_day_plan_2026-01-13",
        JSON.stringify({
          date: "2026-01-13",
          // missing selectedTaskIds
          completedTaskIds: [],
        }),
      );

      const ids = getAllPlannedTaskIds();
      expect(ids.size).toBe(0);
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

  // biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite with multiple cases
  describe("getUncompletedTasks", () => {
    const mockTasks: Task[] = [
      {
        id: "task-1",
        title: "Task 1",
        energyCost: { physical: 10, social: 10, executive: 10 },
        factors: {
          initiationDifficulty: 5,
          terminationDifficulty: 3,
          isRestorative: false,
        },
        createdAt: new Date(),
      },
      {
        id: "task-2",
        title: "Task 2",
        energyCost: { physical: 5, social: 5, executive: 5 },
        factors: {
          initiationDifficulty: 5,
          terminationDifficulty: 3,
          isRestorative: false,
        },
        createdAt: new Date(),
      },
    ];

    it("returns empty array when no dates stored", () => {
      const result = getUncompletedTasks(mockTasks, "2026-01-14");
      expect(result).toEqual([]);
    });

    it("returns uncompleted tasks from previous days", () => {
      saveDayPlanForDate("2026-01-13", {
        date: "2026-01-13",
        selectedTaskIds: ["task-1"],
        completedTaskIds: [],
        dailyCapacity: defaultCapacity,
      });

      const result = getUncompletedTasks(mockTasks, "2026-01-14");
      expect(result).toHaveLength(1);
      expect(result[0].task.id).toBe("task-1");
      expect(result[0].fromDate).toBe("2026-01-13");
    });

    it("excludes completed tasks", () => {
      saveDayPlanForDate("2026-01-13", {
        date: "2026-01-13",
        selectedTaskIds: ["task-1", "task-2"],
        completedTaskIds: ["task-1"],
        dailyCapacity: defaultCapacity,
      });

      const result = getUncompletedTasks(mockTasks, "2026-01-14");
      expect(result).toHaveLength(1);
      expect(result[0].task.id).toBe("task-2");
    });

    it("skipsfuture dates", () => {
      saveDayPlanForDate("2026-01-15", {
        date: "2026-01-15",
        selectedTaskIds: ["task-1"],
        completedTaskIds: [],
        dailyCapacity: defaultCapacity,
      });

      const result = getUncompletedTasks(mockTasks, "2026-01-14");
      expect(result).toHaveLength(0);
    });

    it("deduplicates tasks from multiple days", () => {
      saveDayPlanForDate("2026-01-12", {
        date: "2026-01-12",
        selectedTaskIds: ["task-1"],
        completedTaskIds: [],
        dailyCapacity: defaultCapacity,
      });
      saveDayPlanForDate("2026-01-13", {
        date: "2026-01-13",
        selectedTaskIds: ["task-1"],
        completedTaskIds: [],
        dailyCapacity: defaultCapacity,
      });

      const result = getUncompletedTasks(mockTasks, "2026-01-14");
      // Should only appear once, from the earlier date
      expect(result).toHaveLength(1);
      expect(result[0].fromDate).toBe("2026-01-12");
    });

    it("ignores tasks not in the task list", () => {
      saveDayPlanForDate("2026-01-13", {
        date: "2026-01-13",
        selectedTaskIds: ["nonexistent-task"],
        completedTaskIds: [],
        dailyCapacity: defaultCapacity,
      });

      const result = getUncompletedTasks(mockTasks, "2026-01-14");
      expect(result).toHaveLength(0);
    });

    it("handles corrupted day plan data gracefully", () => {
      // Create a key that exists but has invalid JSON
      localStorage.setItem(
        "energy_planner_day_plan_2026-01-10",
        "{invalid-json",
      );

      const result = getUncompletedTasks(mockTasks, "2026-01-14");
      // Should skip the invalid entry and not crash
      expect(result).toEqual([]);
    });
  });
});
