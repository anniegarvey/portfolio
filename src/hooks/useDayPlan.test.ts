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
    localStorage.setItem("energy_planner_day_plan", JSON.stringify(storedPlan));

    const { result } = renderHook(() => useDayPlan());

    expect(result.current.dayPlan.selectedTaskIds).toEqual([
      "task-1",
      "task-2",
    ]);
    expect(result.current.dayPlan.completedTaskIds).toEqual(["task-1"]);
  });

  it("resets day plan if stored date is old", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const storedPlan = {
      date: yesterday.toISOString().split("T")[0],
      selectedTaskIds: ["old-task"],
      completedTaskIds: ["old-task"],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    };
    localStorage.setItem("energy_planner_day_plan", JSON.stringify(storedPlan));

    const { result } = renderHook(() => useDayPlan());
    const today = new Date().toISOString().split("T")[0];

    expect(result.current.dayPlan.date).toBe(today);
    expect(result.current.dayPlan.selectedTaskIds).toEqual([]);
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

    act(() => {
      result.current.addToPlan("task-1");
    });

    const stored = localStorage.getItem("energy_planner_day_plan");
    expect(stored).not.toBeNull();
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.selectedTaskIds).toContain("task-1");
    }
  });

  it("handles missing completedTaskIds safely", () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(
      "energy_planner_day_plan",
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
    localStorage.removeItem("energy_planner_day_plan");
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
});
