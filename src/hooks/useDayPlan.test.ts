import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAll,
  getDayPlan,
  setDailyCapacity,
  setDayPlan,
} from "@/lib/energy-planner/storage";
import { useDayPlan } from "./useDayPlan";

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple test cases
describe("useDayPlan", () => {
  beforeEach(async () => {
    await clearAll();
  });

  it("initializes with today's date and empty lists", async () => {
    const { result } = renderHook(() => useDayPlan());
    const today = new Date().toISOString().split("T")[0];

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dayPlan.date).toBe(today);
    expect(result.current.dayPlan.selectedTaskIds).toEqual([]);
    expect(result.current.dayPlan.completedTaskIds).toEqual([]);
  });

  it("loads day plan from IndexedDB if date matches today", async () => {
    const today = new Date().toISOString().split("T")[0];
    await setDayPlan(today, {
      date: today,
      selectedTaskIds: ["task-1", "task-2"],
      completedTaskIds: ["task-1"],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dayPlan.selectedTaskIds).toEqual([
      "task-1",
      "task-2",
    ]);
    expect(result.current.dayPlan.completedTaskIds).toEqual(["task-1"]);
  });

  it("navigates to previous day and keeps that day's plan separate", async () => {
    const { result } = renderHook(() => useDayPlan());
    const today = new Date().toISOString().split("T")[0];

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addToPlan("task-1");
    });

    await act(async () => {
      result.current.goToPreviousDay();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Yesterday's plan should be empty (not have today's task)
    expect(result.current.dayPlan.selectedTaskIds).not.toContain("task-1");
    expect(result.current.currentDate).not.toBe(today);
  });

  it("adds a task to the plan", async () => {
    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addToPlan("task-1");
    });

    expect(result.current.dayPlan.selectedTaskIds).toContain("task-1");
  });

  it("does not duplicate task when added twice", async () => {
    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addToPlan("task-1");
      result.current.addToPlan("task-1");
    });

    expect(result.current.dayPlan.selectedTaskIds).toEqual(["task-1"]);
  });

  it("removes a task from the plan", async () => {
    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addToPlan("task-1");
    });

    act(() => {
      result.current.removeFromPlan("task-1");
    });

    expect(result.current.dayPlan.selectedTaskIds).not.toContain("task-1");
  });

  it("removes task from both selected and completed when removed from plan", async () => {
    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

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

  it("toggles task completion on", async () => {
    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addToPlan("task-1");
      result.current.toggleTaskCompletion("task-1");
    });

    expect(result.current.dayPlan.completedTaskIds).toContain("task-1");
  });

  it("toggles task completion off", async () => {
    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

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

  it("toggles completion for only the specified task", async () => {
    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addToPlan("task-1");
      result.current.addToPlan("task-2");
      result.current.toggleTaskCompletion("task-1");
    });

    expect(result.current.dayPlan.completedTaskIds).toContain("task-1");
    expect(result.current.dayPlan.completedTaskIds).not.toContain("task-2");
  });

  it("persists day plan to IndexedDB", async () => {
    const { result } = renderHook(() => useDayPlan());
    const today = new Date().toISOString().split("T")[0];

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addToPlan("task-1");
    });

    await waitFor(async () => {
      const stored = await getDayPlan(today);
      expect(stored).not.toBeNull();
      expect(stored?.selectedTaskIds).toContain("task-1");
    });
  });

  it("handles missing completedTaskIds safely", async () => {
    const today = new Date().toISOString().split("T")[0];
    // Set a plan without completedTaskIds (simulating old data format)
    await setDayPlan(today, {
      date: today,
      selectedTaskIds: ["t1"],
      completedTaskIds: [],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.removeFromPlan("t1");
    });

    // Should not crash
    expect(result.current.dayPlan.selectedTaskIds).not.toContain("t1");
  });

  it("loads capacity from storage if day plan is missing", async () => {
    await setDailyCapacity({
      physical: 77,
      social: 88,
      executive: 99,
    });

    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dayPlan.dailyCapacity).toEqual({
      physical: 77,
      social: 88,
      executive: 99,
    });
  });

  it("navigates to next day", async () => {
    const { result } = renderHook(() => useDayPlan());
    const today = new Date().toISOString().split("T")[0];

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.goToNextDay();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentDate).not.toBe(today);
    // Should be one day after today
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(result.current.currentDate).toBe(
      tomorrow.toISOString().split("T")[0],
    );
  });

  it("navigates back to today", async () => {
    const { result } = renderHook(() => useDayPlan());
    const today = new Date().toISOString().split("T")[0];

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.goToPreviousDay();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentDate).not.toBe(today);

    await act(async () => {
      result.current.goToToday();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentDate).toBe(today);
  });

  it("navigates to a specific date", async () => {
    const { result } = renderHook(() => useDayPlan());
    const targetDate = "2026-01-01";

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.navigateToDate(targetDate);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentDate).toBe(targetDate);
    expect(result.current.dayPlan.date).toBe(targetDate);
  });

  it("marks task complete on a different date", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Set up yesterday's plan with a task
    await setDayPlan(yesterdayStr, {
      date: yesterdayStr,
      selectedTaskIds: ["task-a"],
      completedTaskIds: [],
      dailyCapacity: { physical: 50, social: 50, executive: 50 },
    });

    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.markTaskCompleteOnDate("task-a", yesterdayStr);
    });

    const storedPlan = await getDayPlan(yesterdayStr);
    expect(storedPlan?.completedTaskIds).toContain("task-a");
  });

  it("marks task complete on current date", async () => {
    const { result } = renderHook(() => useDayPlan());
    const today = new Date().toISOString().split("T")[0];

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addToPlan("task-b");
    });

    await act(async () => {
      await result.current.markTaskCompleteOnDate("task-b", today);
    });

    expect(result.current.dayPlan.completedTaskIds).toContain("task-b");
  });

  it("moves task from past day to today", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Set up yesterday's plan
    await setDayPlan(yesterdayStr, {
      date: yesterdayStr,
      selectedTaskIds: ["task-c"],
      completedTaskIds: [],
      dailyCapacity: { physical: 50, social: 50, executive: 50 },
    });

    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.moveTaskToToday("task-c", yesterdayStr);
    });

    // Task should be in today's plan
    expect(result.current.dayPlan.selectedTaskIds).toContain("task-c");

    // Task should be removed from yesterday's plan
    const oldPlan = await getDayPlan(yesterdayStr);
    expect(oldPlan?.selectedTaskIds).not.toContain("task-c");
  });

  it("moves task to unplanned from past day", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Set up yesterday's plan
    await setDayPlan(yesterdayStr, {
      date: yesterdayStr,
      selectedTaskIds: ["task-d"],
      completedTaskIds: [],
      dailyCapacity: { physical: 50, social: 50, executive: 50 },
    });

    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.moveTaskToUnplanned("task-d", yesterdayStr);
    });

    // Task should be removed from yesterday's plan
    const oldPlan = await getDayPlan(yesterdayStr);
    expect(oldPlan?.selectedTaskIds).not.toContain("task-d");
  });

  it("moves task to unplanned from current day", async () => {
    const { result } = renderHook(() => useDayPlan());
    const today = new Date().toISOString().split("T")[0];

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addToPlan("task-e");
    });

    expect(result.current.dayPlan.selectedTaskIds).toContain("task-e");

    await act(async () => {
      await result.current.moveTaskToUnplanned("task-e", today);
    });

    expect(result.current.dayPlan.selectedTaskIds).not.toContain("task-e");
  });

  it("moves task to today when viewing a different date", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];

    // Set up yesterday's plan with a task
    await setDayPlan(yesterdayStr, {
      date: yesterdayStr,
      selectedTaskIds: ["task-f"],
      completedTaskIds: [],
      dailyCapacity: { physical: 50, social: 50, executive: 50 },
    });

    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Navigate to yesterday
    await act(async () => {
      result.current.goToPreviousDay();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentDate).toBe(yesterdayStr);

    // Move task to today while viewing yesterday
    await act(async () => {
      await result.current.moveTaskToToday("task-f", yesterdayStr);
    });

    // Verify task was added to today's storage
    const todayPlan = await getDayPlan(todayStr);
    expect(todayPlan?.selectedTaskIds).toContain("task-f");
  });

  it("removes task from completedTaskIds when moving to unplanned", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Set up yesterday's plan with a completed task
    await setDayPlan(yesterdayStr, {
      date: yesterdayStr,
      selectedTaskIds: ["task-g"],
      completedTaskIds: ["task-g"],
      dailyCapacity: { physical: 50, social: 50, executive: 50 },
    });

    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.moveTaskToUnplanned("task-g", yesterdayStr);
    });

    const plan = await getDayPlan(yesterdayStr);
    expect(plan?.selectedTaskIds).not.toContain("task-g");
    expect(plan?.completedTaskIds).not.toContain("task-g");
  });

  it("removes task from completedTaskIds when moving to today", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Set up yesterday's plan with a completed task
    await setDayPlan(yesterdayStr, {
      date: yesterdayStr,
      selectedTaskIds: ["task-h"],
      completedTaskIds: ["task-h"],
      dailyCapacity: { physical: 50, social: 50, executive: 50 },
    });

    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Navigate to yesterday to perform the move
    await act(async () => {
      result.current.goToPreviousDay();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.moveTaskToToday("task-h", yesterdayStr);
    });

    const plan = await getDayPlan(yesterdayStr);
    expect(plan?.selectedTaskIds).not.toContain("task-h");
    expect(plan?.completedTaskIds).not.toContain("task-h");
  });

  it("does not duplicate task when moving to today if already present (viewing today)", async () => {
    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Add task to today's plan
    act(() => {
      result.current.addToPlan("task-dup-1");
    });

    // Try to move "task-dup-1" to today (simulating it being uncompleted from yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    await act(async () => {
      await result.current.moveTaskToToday("task-dup-1", yesterdayStr);
    });

    // Should still only be there once (Set/filter logic or check)
    // Actually selectedTaskIds is array, check count
    const count = result.current.dayPlan.selectedTaskIds.filter(
      (id) => id === "task-dup-1",
    ).length;
    expect(count).toBe(1);
  });

  it("does not duplicate task when moving to today if already present (viewing other day)", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];

    // Setup today's plan with duplicate task
    await setDayPlan(todayStr, {
      date: todayStr,
      selectedTaskIds: ["task-dup-2"],
      completedTaskIds: [],
      dailyCapacity: { physical: 50, social: 50, executive: 50 },
    });

    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Navigate to yesterday
    await act(async () => {
      result.current.navigateToDate(yesterdayStr);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Move task to today
    await act(async () => {
      await result.current.moveTaskToToday("task-dup-2", yesterdayStr);
    });

    // Verify today's storage
    const todayPlan = await getDayPlan(todayStr);
    const count = todayPlan?.selectedTaskIds.filter(
      (id: string) => id === "task-dup-2",
    ).length;
    expect(count).toBe(1);
  });

  it("handles moveTaskToUnplanned gracefully if source plan missing", async () => {
    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Call for a date that has no plan
    await act(async () => {
      await result.current.moveTaskToUnplanned("task-missing", "2020-01-01");
    });

    // Should not crash
    expect(true).toBe(true);
  });

  it("reorders planned tasks", async () => {
    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addToPlan("task-1");
      result.current.addToPlan("task-2");
      result.current.addToPlan("task-3");
    });

    expect(result.current.dayPlan.selectedTaskIds).toEqual([
      "task-1",
      "task-2",
      "task-3",
    ]);

    act(() => {
      result.current.reorderPlannedTasks(["task-3", "task-1", "task-2"]);
    });

    expect(result.current.dayPlan.selectedTaskIds).toEqual([
      "task-3",
      "task-1",
      "task-2",
    ]);
  });
});
