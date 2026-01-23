import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAll, getDayPlan, setDayPlan } from "@/lib/energy-planner/storage";
import { useDayPlan } from "./useDayPlan";

const mockTask = (id: string, title: string, completed = false) => ({
  id,
  title,
  completed,
  createdAt: new Date(),
  energyCost: { physical: 10, social: 10, executive: 10 },
  factors: {
    initiationDifficulty: 3,
    terminationDifficulty: 3,
    isRestorative: false,
  },
});

describe("useDayPlan", () => {
  beforeEach(async () => {
    await clearAll();
  });

  it("initializes with today's date and empty lists", async () => {
    const { result } = renderHook(() => useDayPlan());
    // Use local date string matching implementation
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dayPlan.date).toBe(todayStr);
    expect(result.current.dayPlan.tasks).toEqual([]);
  });

  it("loads day plan from IndexedDB if date matches today", async () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const task1 = mockTask("task-1", "T1", true);
    const task2 = mockTask("task-2", "T2", false);

    await setDayPlan(todayStr, {
      date: todayStr,
      tasks: [task1, task2],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    const { result } = renderHook(() => useDayPlan());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dayPlan.tasks).toHaveLength(2);
    expect(result.current.dayPlan.tasks[0].id).toBe("task-1");
    expect(result.current.dayPlan.tasks[0].completed).toBe(true);
    expect(result.current.dayPlan.tasks[1].id).toBe("task-2");
    expect(result.current.dayPlan.tasks[1].completed).toBe(false);
  });

  it("navigates to previous day and keeps that day's plan separate", async () => {
    const { result } = renderHook(() => useDayPlan());
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Add task to today
    const task1 = mockTask("task-1", "Task 1");
    // Seed storage before adding.
    await act(async () => {
      const { setOneOffTasks } = await import("@/lib/energy-planner/storage");
      await setOneOffTasks([task1]);
      await result.current.addToPlan("task-1");
    });

    await act(async () => {
      result.current.goToPreviousDay();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.dayPlan.date).not.toBe(todayStr);
    });

    // Yesterday's plan should be empty
    expect(result.current.dayPlan.tasks).toHaveLength(0);
  });

  it("adds a task to the plan", async () => {
    const { result } = renderHook(() => useDayPlan());
    const { setOneOffTasks } = await import("@/lib/energy-planner/storage");
    const task1 = mockTask("task-1", "Task 1");
    await setOneOffTasks([task1]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addToPlan("task-1");
    });

    expect(result.current.dayPlan.tasks).toHaveLength(1);
    expect(result.current.dayPlan.tasks[0].id).toBe("task-1");
  });

  it("does not duplicate task when added twice", async () => {
    const { result } = renderHook(() => useDayPlan());
    const { setOneOffTasks } = await import("@/lib/energy-planner/storage");
    const task1 = mockTask("task-1", "Task 1");
    await setOneOffTasks([task1]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addToPlan("task-1");
      await result.current.addToPlan("task-1");
    });

    expect(result.current.dayPlan.tasks).toHaveLength(1);
  });

  it("removes a task from the plan", async () => {
    const { result } = renderHook(() => useDayPlan());
    const { setOneOffTasks } = await import("@/lib/energy-planner/storage");
    const task1 = mockTask("task-1", "Task 1");
    await setOneOffTasks([task1]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addToPlan("task-1");
    });

    await act(async () => {
      await result.current.removeFromPlan("task-1");
    });

    expect(result.current.dayPlan.tasks).toHaveLength(0);
  });

  it("toggles task completion on", async () => {
    const { result } = renderHook(() => useDayPlan());
    const { setOneOffTasks } = await import("@/lib/energy-planner/storage");
    const task1 = mockTask("task-1", "Task 1");
    await setOneOffTasks([task1]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addToPlan("task-1");
      await result.current.toggleTaskCompletion("task-1");
    });

    expect(result.current.dayPlan.tasks[0].completed).toBe(true);
  });

  it("toggles task completion off", async () => {
    const { result } = renderHook(() => useDayPlan());
    const { setOneOffTasks } = await import("@/lib/energy-planner/storage");
    const task1 = mockTask("task-1", "Task 1");
    await setOneOffTasks([task1]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addToPlan("task-1");
      await result.current.toggleTaskCompletion("task-1"); // on
    });

    expect(result.current.dayPlan.tasks[0].completed).toBe(true);

    await act(async () => {
      await result.current.toggleTaskCompletion("task-1"); // off
    });

    expect(result.current.dayPlan.tasks[0].completed).toBe(false);
  });

  it("toggles completion for only the specified task", async () => {
    const { result } = renderHook(() => useDayPlan());
    const { setOneOffTasks } = await import("@/lib/energy-planner/storage");
    const task1 = mockTask("task-1", "Task 1");
    const task2 = mockTask("task-2", "Task 2");
    await setOneOffTasks([task1, task2]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addToPlan("task-1");
      await result.current.addToPlan("task-2");
      await result.current.toggleTaskCompletion("task-1");
    });

    const t1 = result.current.dayPlan.tasks.find((t) => t.id === "task-1");
    const t2 = result.current.dayPlan.tasks.find((t) => t.id === "task-2");

    expect(t1?.completed).toBe(true);
    expect(t2?.completed).toBe(false);
  });

  it("persists day plan to IndexedDB", async () => {
    const { result } = renderHook(() => useDayPlan());
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const { setOneOffTasks } = await import("@/lib/energy-planner/storage");
    const task1 = mockTask("task-1", "Task 1");
    await setOneOffTasks([task1]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addToPlan("task-1");
    });

    await waitFor(async () => {
      const stored = await getDayPlan(todayStr);
      expect(stored).not.toBeNull();
      expect(stored?.tasks).toHaveLength(1);
      expect(stored?.tasks?.[0].id).toBe("task-1");
    });
  });

  it("reorders planned tasks", async () => {
    const { result } = renderHook(() => useDayPlan());
    const { setOneOffTasks } = await import("@/lib/energy-planner/storage");
    const task1 = mockTask("task-1", "Task 1");
    const task2 = mockTask("task-2", "Task 2");
    const task3 = mockTask("task-3", "Task 3");
    await setOneOffTasks([task1, task2, task3]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addToPlan("task-1");
      await result.current.addToPlan("task-2");
      await result.current.addToPlan("task-3");
    });

    expect(result.current.dayPlan.tasks.map((t) => t.id)).toEqual([
      "task-1",
      "task-2",
      "task-3",
    ]);

    await act(async () => {
      // Reorder using reorderPlannedTasks (which might be the id-based one now)
      result.current.reorderPlannedTasks(["task-3", "task-1", "task-2"]);
    });

    expect(result.current.dayPlan.tasks.map((t) => t.id)).toEqual([
      "task-3",
      "task-1",
      "task-2",
    ]);
  });
  it("moves uncompleted task to next day", async () => {
    const { result } = renderHook(() => useDayPlan());
    const _today = new Date().toISOString().split("T")[0];

    // Seed task
    const { setOneOffTasks } = await import("@/lib/energy-planner/storage");
    const task1 = mockTask("task-1", "Task 1");
    // Ensure all required props (mockTask handles it)
    await setOneOffTasks([task1]);

    // Add to plan
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    await act(async () => {
      await result.current.addToPlan("task-1");
    });

    // Go to next day
    await act(async () => {
      result.current.goToNextDay();
    });

    // Verify correct date
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    await waitFor(() => {
      expect(result.current.dayPlan.date).toBe(tomorrowStr);
    });
  });

  it("handles error when adding non-existent task", async () => {
    const { result } = renderHook(() => useDayPlan());
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addToPlan("non-existent-id");
    });

    expect(result.current.dayPlan.tasks).toHaveLength(0);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Task not found in oneOffTasks",
      "non-existent-id",
    );
    consoleSpy.mockRestore();
  });

  it("marks a task from a past day as complete", async () => {
    const { result } = renderHook(() => useDayPlan());

    // Seed past day plan
    const pastDate = "2023-01-01";
    const task1 = mockTask("task-1", "Past Task", false);
    await setDayPlan(pastDate, {
      date: pastDate,
      tasks: [task1],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.markTaskCompleteOnDate("task-1", pastDate);
    });

    const stored = await getDayPlan(pastDate);
    expect(stored?.tasks[0].completed).toBe(true);
  });

  it("moves a task from a past day to today", async () => {
    const { result } = renderHook(() => useDayPlan());
    const pastDate = "2023-01-01";
    const task1 = mockTask("task-1", "Past Task", false);
    await setDayPlan(pastDate, {
      date: pastDate,
      tasks: [task1],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.moveTaskToToday("task-1", pastDate);
    });

    // Validations
    // 1. Removed from past day
    const pastStored = await getDayPlan(pastDate);
    expect(pastStored?.tasks).toHaveLength(0);

    // 2. Added to today (current dayPlan)
    expect(result.current.dayPlan.tasks).toHaveLength(1);
    expect(result.current.dayPlan.tasks[0].id).toBe("task-1");
  });

  it("moves a task from a past day to unplanned (one-off)", async () => {
    const { result } = renderHook(() => useDayPlan());
    const pastDate = "2023-01-01";
    const task1 = mockTask("task-1", "Past Task", false);
    await setDayPlan(pastDate, {
      date: pastDate,
      tasks: [task1],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    // Ensure one-off tasks are empty initially
    const { setOneOffTasks, getOneOffTasks } = await import(
      "@/lib/energy-planner/storage"
    );
    await setOneOffTasks([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.moveTaskToUnplanned("task-1", pastDate);
    });

    // 1. Removed from past day
    const pastStored = await getDayPlan(pastDate);
    expect(pastStored?.tasks).toHaveLength(0);

    // 2. Added to one-off
    const oneOff = await getOneOffTasks();
    expect(oneOff).toHaveLength(1);
    expect(oneOff[0].id).toBe("task-1");
  });

  it("does not duplicate task when moving to today if already present", async () => {
    const { result } = renderHook(() => useDayPlan());
    const pastDate = "2023-01-01";
    const task1 = mockTask("task-1", "Past Task", false);

    // Seed past day
    await setDayPlan(pastDate, {
      date: pastDate,
      tasks: [task1],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    // Seed today WITH the task already
    const { getTodayDateString } = await import("./utils");
    const today = getTodayDateString();
    await setDayPlan(today, {
      date: today,
      tasks: [task1], // Already here
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Go to past
    await act(async () => {
      result.current.navigateToDate(pastDate);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.currentDate).toBe(pastDate);
    });

    // Move to today
    await act(async () => {
      await result.current.moveTaskToToday("task-1", pastDate);
    });

    // 1. Removed from past
    await waitFor(async () => {
      const pastStored = await getDayPlan(pastDate);
      expect(pastStored?.tasks).toHaveLength(0);
    });

    // 2. Still only 1 in today
    await waitFor(async () => {
      const stored = await getDayPlan(today);
      expect(stored?.tasks).toHaveLength(1);
    });
  }, 10000);

  it("moves a task from current day to unplanned", async () => {
    const { result } = renderHook(() => useDayPlan());
    const { setOneOffTasks, getOneOffTasks } = await import(
      "@/lib/energy-planner/storage"
    );
    const task1 = mockTask("task-1", "Task 1");
    // Seed one off
    await setOneOffTasks([task1]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Add to plan
    await act(async () => {
      await result.current.addToPlan("task-1");
    });

    // Clear one off check
    await setOneOffTasks([]);

    await act(async () => {
      const today = result.current.currentDate;
      await result.current.moveTaskToUnplanned("task-1", today);
    });

    expect(result.current.dayPlan.tasks).toHaveLength(0);
    const oneOff = await getOneOffTasks();
    expect(oneOff).toHaveLength(1);
    expect(oneOff[0].id).toBe("task-1");
  });

  it("assigns task to a zone", async () => {
    const { result } = renderHook(() => useDayPlan());
    const { setOneOffTasks } = await import("@/lib/energy-planner/storage");
    const task1 = mockTask("task-1", "Task 1");
    await setOneOffTasks([task1]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addToPlan("task-1");
    });

    // Default zone is undefined or handled by util/default

    await act(async () => {
      result.current.assignTaskToZone("task-1", "evening");
    });

    expect(result.current.dayPlan.tasks[0].zoneId).toBe("evening");
  });

  it("moves a task to today when viewing a different day", async () => {
    const { result } = renderHook(() => useDayPlan());
    const pastDate = "2023-01-01";
    const task1 = mockTask("task-1", "Past Task", false);
    await setDayPlan(pastDate, {
      date: pastDate,
      tasks: [task1],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    // We are currently on today
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Go to tomorrow
    await act(async () => {
      result.current.goToNextDay();
    });

    // Move task from past to today (not current view)
    await act(async () => {
      await result.current.moveTaskToToday("task-1", pastDate);
    });

    // Verify it is in today's plan in storage
    const { getDayPlan } = await import("@/lib/energy-planner/storage");
    // getTodayDateString is not exported from storage but utils...
    // Just construct string
    const today = new Date().toISOString().split("T")[0];
    const todayPlan = await getDayPlan(today);

    expect(todayPlan?.tasks).toHaveLength(1);
    expect(todayPlan?.tasks[0].id).toBe("task-1");
  });

  it("navigates to today", async () => {
    const { result } = renderHook(() => useDayPlan());
    const today = new Date().toISOString().split("T")[0];

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.goToPreviousDay();
    });

    expect(result.current.currentDate).not.toBe(today);

    await act(async () => {
      result.current.goToToday();
    });

    expect(result.current.currentDate).toBe(today);
  });

  it("marks a task as complete on the current day", async () => {
    const { result } = renderHook(() => useDayPlan());
    const { setOneOffTasks } = await import("@/lib/energy-planner/storage");
    const task1 = mockTask("task-1", "Task 1");
    await setOneOffTasks([task1]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addToPlan("task-1");
    });

    const today = result.current.currentDate;
    await act(async () => {
      await result.current.markTaskCompleteOnDate("task-1", today);
    });

    expect(result.current.dayPlan.tasks[0].completed).toBe(true);
  });
});
