import { renderHook } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { useDayPlan } from "./useDayPlan";

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple test cases
describe("useDayPlan", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with today's date and empty lists", () => {
    const { result } = renderHook(() => useDayPlan());
    const today = new Date().toISOString().split("T")[0];

    expect(result.current.dayPlan.date).toBe(today);
    expect(result.current.dayPlan.selectedTaskIds).toEqual([]);
    expect(result.current.dayPlan.completedTaskIds).toEqual([]);
  });

  it("loads day plan from localStorage if date matches today", () => {
    const today = new Date().toISOString().split("T")[0];
    const storedPlan = {
      date: today,
      selectedTaskIds: ["task-1", "task-2"],
      completedTaskIds: ["task-1"],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    };
    localStorage.setItem(
      `energy_planner_day_plan_${today}`,
      JSON.stringify(storedPlan),
    );

    const { result } = renderHook(() => useDayPlan());

    expect(result.current.dayPlan.selectedTaskIds).toEqual([
      "task-1",
      "task-2",
    ]);
    expect(result.current.dayPlan.completedTaskIds).toEqual(["task-1"]);
  });

  it("navigates to previous day and keeps that day's plan separate", () => {
    const { result } = renderHook(() => useDayPlan());
    const today = new Date().toISOString().split("T")[0];

    act(() => {
      result.current.addToPlan("task-1");
    });

    act(() => {
      result.current.goToPreviousDay();
    });

    // Yesterday's plan should be empty (not have today's task)
    expect(result.current.dayPlan.selectedTaskIds).not.toContain("task-1");
    expect(result.current.currentDate).not.toBe(today);
  });

  it("adds a task to the plan", () => {
    const { result } = renderHook(() => useDayPlan());

    act(() => {
      result.current.addToPlan("task-1");
    });

    expect(result.current.dayPlan.selectedTaskIds).toContain("task-1");
  });

  it("does not duplicate task when added twice", () => {
    const { result } = renderHook(() => useDayPlan());

    act(() => {
      result.current.addToPlan("task-1");
      result.current.addToPlan("task-1");
    });

    expect(result.current.dayPlan.selectedTaskIds).toEqual(["task-1"]);
  });

  it("removes a task from the plan", () => {
    const { result } = renderHook(() => useDayPlan());

    act(() => {
      result.current.addToPlan("task-1");
    });

    act(() => {
      result.current.removeFromPlan("task-1");
    });

    expect(result.current.dayPlan.selectedTaskIds).not.toContain("task-1");
  });

  it("removes task from both selected and completed when removed from plan", () => {
    const { result } = renderHook(() => useDayPlan());

    act(() => {
      result.current.addToPlan("task-1");
      result.current.toggleTaskCompletion("task-1");
    });

    expect(result.current.dayPlan.completedTaskIds).toContain("task-1");

    act(() => {
      result.current.removeFromPlan("task-1");
    });

    expect(result.current.dayPlan.selectedTaskIds).not.toContain("task-1");
    expect(result.current.dayPlan.completedTaskIds).not.toContain("task-1");
  });

  it("toggles task completion on", () => {
    const { result } = renderHook(() => useDayPlan());

    act(() => {
      result.current.addToPlan("task-1");
      result.current.toggleTaskCompletion("task-1");
    });

    expect(result.current.dayPlan.completedTaskIds).toContain("task-1");
  });

  it("toggles task completion off", () => {
    const { result } = renderHook(() => useDayPlan());

    act(() => {
      result.current.addToPlan("task-1");
      result.current.toggleTaskCompletion("task-1");
    });

    expect(result.current.dayPlan.completedTaskIds).toContain("task-1");

    act(() => {
      result.current.toggleTaskCompletion("task-1");
    });

    expect(result.current.dayPlan.completedTaskIds).not.toContain("task-1");
  });

  it("toggles completion for only the specified task", () => {
    const { result } = renderHook(() => useDayPlan());

    act(() => {
      result.current.addToPlan("task-1");
      result.current.addToPlan("task-2");
      result.current.toggleTaskCompletion("task-1");
    });

    expect(result.current.dayPlan.completedTaskIds).toContain("task-1");
    expect(result.current.dayPlan.completedTaskIds).not.toContain("task-2");
  });

  it("persists day plan to localStorage", () => {
    const { result } = renderHook(() => useDayPlan());
    const today = new Date().toISOString().split("T")[0];

    act(() => {
      result.current.addToPlan("task-1");
    });

    const stored = localStorage.getItem(`energy_planner_day_plan_${today}`);
    expect(stored).not.toBeNull();
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.selectedTaskIds).toContain("task-1");
    }
  });

  it("handles missing completedTaskIds safely", () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(
      `energy_planner_day_plan_${today}`,
      JSON.stringify({
        date: today,
        selectedTaskIds: ["t1"],
        dailyCapacity: { physical: 100, social: 100, executive: 100 },
        // completedTaskIds missing
      }),
    );

    const { result } = renderHook(() => useDayPlan());

    expect(result.current.dayPlan.completedTaskIds).toBeUndefined();

    act(() => {
      result.current.removeFromPlan("t1");
    });

    // Should not crash
    expect(result.current.dayPlan.selectedTaskIds).not.toContain("t1");
  });

  it("loads capacity from storage if day plan is missing", () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.removeItem(`energy_planner_day_plan_${today}`);
    localStorage.setItem(
      "energy_planner_capacity",
      JSON.stringify({
        physical: 77,
        social: 88,
        executive: 99,
      }),
    );

    const { result } = renderHook(() => useDayPlan());

    expect(result.current.dayPlan.dailyCapacity).toEqual({
      physical: 77,
      social: 88,
      executive: 99,
    });
  });

  it("navigates to next day", () => {
    const { result } = renderHook(() => useDayPlan());
    const today = new Date().toISOString().split("T")[0];

    act(() => {
      result.current.goToNextDay();
    });

    expect(result.current.currentDate).not.toBe(today);
    // Should be one day after today
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(result.current.currentDate).toBe(
      tomorrow.toISOString().split("T")[0],
    );
  });

  it("navigates back to today", () => {
    const { result } = renderHook(() => useDayPlan());
    const today = new Date().toISOString().split("T")[0];

    act(() => {
      result.current.goToPreviousDay();
    });

    expect(result.current.currentDate).not.toBe(today);

    act(() => {
      result.current.goToToday();
    });

    expect(result.current.currentDate).toBe(today);
  });

  it("navigates to a specific date", () => {
    const { result } = renderHook(() => useDayPlan());
    const targetDate = "2026-01-01";

    act(() => {
      result.current.navigateToDate(targetDate);
    });

    expect(result.current.currentDate).toBe(targetDate);
    expect(result.current.dayPlan.date).toBe(targetDate);
  });

  it("marks task complete on a different date", () => {
    const { result } = renderHook(() => useDayPlan());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Set up yesterday's plan with a task
    localStorage.setItem(
      `energy_planner_day_plan_${yesterdayStr}`,
      JSON.stringify({
        date: yesterdayStr,
        selectedTaskIds: ["task-a"],
        completedTaskIds: [],
        dailyCapacity: { physical: 50, social: 50, executive: 50 },
      }),
    );

    act(() => {
      result.current.markTaskCompleteOnDate("task-a", yesterdayStr);
    });

    const storedPlan = JSON.parse(
      localStorage.getItem(`energy_planner_day_plan_${yesterdayStr}`) || "{}",
    );
    expect(storedPlan.completedTaskIds).toContain("task-a");
  });

  it("marks task complete on current date", () => {
    const { result } = renderHook(() => useDayPlan());
    const today = new Date().toISOString().split("T")[0];

    act(() => {
      result.current.addToPlan("task-b");
    });

    act(() => {
      result.current.markTaskCompleteOnDate("task-b", today);
    });

    expect(result.current.dayPlan.completedTaskIds).toContain("task-b");
  });

  it("moves task from past day to today", () => {
    const { result } = renderHook(() => useDayPlan());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Set up yesterday's plan
    localStorage.setItem(
      `energy_planner_day_plan_${yesterdayStr}`,
      JSON.stringify({
        date: yesterdayStr,
        selectedTaskIds: ["task-c"],
        completedTaskIds: [],
        dailyCapacity: { physical: 50, social: 50, executive: 50 },
      }),
    );

    act(() => {
      result.current.moveTaskToToday("task-c", yesterdayStr);
    });

    // Task should be in today's plan
    expect(result.current.dayPlan.selectedTaskIds).toContain("task-c");

    // Task should be removed from yesterday's plan
    const oldPlan = JSON.parse(
      localStorage.getItem(`energy_planner_day_plan_${yesterdayStr}`) || "{}",
    );
    expect(oldPlan.selectedTaskIds).not.toContain("task-c");
  });

  it("moves task to unplanned from past day", () => {
    const { result } = renderHook(() => useDayPlan());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Set up yesterday's plan
    localStorage.setItem(
      `energy_planner_day_plan_${yesterdayStr}`,
      JSON.stringify({
        date: yesterdayStr,
        selectedTaskIds: ["task-d"],
        completedTaskIds: [],
        dailyCapacity: { physical: 50, social: 50, executive: 50 },
      }),
    );

    act(() => {
      result.current.moveTaskToUnplanned("task-d", yesterdayStr);
    });

    // Task should be removed from yesterday's plan
    const oldPlan = JSON.parse(
      localStorage.getItem(`energy_planner_day_plan_${yesterdayStr}`) || "{}",
    );
    expect(oldPlan.selectedTaskIds).not.toContain("task-d");
  });

  it("moves task to unplanned from current day", () => {
    const { result } = renderHook(() => useDayPlan());
    const today = new Date().toISOString().split("T")[0];

    act(() => {
      result.current.addToPlan("task-e");
    });

    expect(result.current.dayPlan.selectedTaskIds).toContain("task-e");

    act(() => {
      result.current.moveTaskToUnplanned("task-e", today);
    });

    expect(result.current.dayPlan.selectedTaskIds).not.toContain("task-e");
  });

  it("moves task to today when viewing a different date", () => {
    const { result } = renderHook(() => useDayPlan());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Set up yesterday's plan with a task
    localStorage.setItem(
      `energy_planner_day_plan_${yesterdayStr}`,
      JSON.stringify({
        date: yesterdayStr,
        selectedTaskIds: ["task-f"],
        completedTaskIds: [],
        dailyCapacity: { physical: 50, social: 50, executive: 50 },
      }),
    );

    // Navigate to yesterday
    act(() => {
      result.current.goToPreviousDay();
    });

    expect(result.current.currentDate).toBe(yesterdayStr);

    // Move task to today while viewing yesterday
    act(() => {
      result.current.moveTaskToToday("task-f", yesterdayStr);
    });

    // Verify task was added to today's storage
    const todayStr = new Date().toISOString().split("T")[0];
    const todayPlan = JSON.parse(
      localStorage.getItem(`energy_planner_day_plan_${todayStr}`) || "{}",
    );
    expect(todayPlan.selectedTaskIds).toContain("task-f");
  });

  it("removes task from completedTaskIds when moving to unplanned", () => {
    const { result } = renderHook(() => useDayPlan());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Set up yesterday's plan with a completed task
    localStorage.setItem(
      `energy_planner_day_plan_${yesterdayStr}`,
      JSON.stringify({
        date: yesterdayStr,
        selectedTaskIds: ["task-g"],
        completedTaskIds: ["task-g"],
        dailyCapacity: { physical: 50, social: 50, executive: 50 },
      }),
    );

    act(() => {
      result.current.moveTaskToUnplanned("task-g", yesterdayStr);
    });

    const plan = JSON.parse(
      localStorage.getItem(`energy_planner_day_plan_${yesterdayStr}`) || "{}",
    );
    expect(plan.selectedTaskIds).not.toContain("task-g");
    expect(plan.completedTaskIds).not.toContain("task-g");
  });

  it("removes task from completedTaskIds when moving to today", () => {
    const { result } = renderHook(() => useDayPlan());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Set up yesterday's plan with a completed task
    localStorage.setItem(
      `energy_planner_day_plan_${yesterdayStr}`,
      JSON.stringify({
        date: yesterdayStr,
        selectedTaskIds: ["task-h"],
        completedTaskIds: ["task-h"],
        dailyCapacity: { physical: 50, social: 50, executive: 50 },
      }),
    );

    // Navigate to yesterday to perform the move
    act(() => {
      result.current.goToPreviousDay();
    });

    act(() => {
      result.current.moveTaskToToday("task-h", yesterdayStr);
    });

    const plan = JSON.parse(
      localStorage.getItem(`energy_planner_day_plan_${yesterdayStr}`) || "{}",
    );
    expect(plan.selectedTaskIds).not.toContain("task-h");
    expect(plan.completedTaskIds).not.toContain("task-h");
  });

  it("does not duplicate task when moving to today if already present (viewing today)", () => {
    const { result } = renderHook(() => useDayPlan());

    // Add task to today's plan
    act(() => {
      result.current.addToPlan("task-dup-1");
    });

    // Try to move "task-dup-1" to today (simulating it being uncompleted from yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    act(() => {
      result.current.moveTaskToToday("task-dup-1", yesterdayStr);
    });

    // Should still only be there once (Set/filter logic or check)
    // Actually selectedTaskIds is array, check count
    const count = result.current.dayPlan.selectedTaskIds.filter(
      (id) => id === "task-dup-1",
    ).length;
    expect(count).toBe(1);
  });

  it("does not duplicate task when moving to today if already present (viewing other day)", () => {
    const { result } = renderHook(() => useDayPlan());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];

    // Setup today's plan with duplicate task
    localStorage.setItem(
      `energy_planner_day_plan_${todayStr}`,
      JSON.stringify({
        date: todayStr,
        selectedTaskIds: ["task-dup-2"],
        completedTaskIds: [],
        dailyCapacity: { physical: 50, social: 50, executive: 50 },
      }),
    );

    // Navigate to yesterday
    act(() => {
      result.current.navigateToDate(yesterdayStr);
    });

    // Move task to today
    act(() => {
      result.current.moveTaskToToday("task-dup-2", yesterdayStr);
    });

    // Verify today's storage
    const todayPlan = JSON.parse(
      localStorage.getItem(`energy_planner_day_plan_${todayStr}`) || "{}",
    );
    const count = todayPlan.selectedTaskIds.filter(
      (id: string) => id === "task-dup-2",
    ).length;
    expect(count).toBe(1);
  });

  it("handles moveTaskToUnplanned gracefully if source plan missing", () => {
    const { result } = renderHook(() => useDayPlan());

    // Call for a date that has no plan
    act(() => {
      result.current.moveTaskToUnplanned("task-missing", "2020-01-01");
    });

    // Should not crash
    expect(true).toBe(true);
  });
});
