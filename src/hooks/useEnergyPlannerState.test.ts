import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as storageMock from "@/lib/energy-planner/storage";
import { useEnergyPlannerState } from "./useEnergyPlannerState";

// Manual mock is picked up automatically by vitest given the __mocks__ folder
vi.mock("@/lib/energy-planner/storage");

describe("useEnergyPlannerState", () => {
  beforeEach(() => {
    (storageMock as unknown as { __reset: () => void }).__reset();
  });

  it("initializes with empty tasks", () => {
    const { result } = renderHook(() => useEnergyPlannerState());
    expect(result.current.oneOffTasks).toEqual([]);
  });

  it("initializes with default daily capacity", () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    expect(result.current.dailyCapacity).toEqual({
      physical: 50,
      social: 50,
      executive: 50,
    });
  });

  it("adds a new task", () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    act(() => {
      result.current.addTask({
        title: "Test Task",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
        completed: false,
      });
    });

    expect(result.current.oneOffTasks).toHaveLength(1);
    expect(result.current.oneOffTasks[0].title).toBe("Test Task");
  });

  it("updates an existing task", () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    act(() => {
      result.current.addTask({
        title: "Original Title",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
        completed: false,
      });
    });

    const taskId = result.current.oneOffTasks[0].id;

    act(() => {
      result.current.updateTask({
        ...result.current.oneOffTasks[0],
        title: "Updated Title",
      });
    });

    expect(result.current.oneOffTasks[0].title).toBe("Updated Title");
    expect(result.current.oneOffTasks[0].id).toBe(taskId);
  });

  it("removes a task and removes it from day plan", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addTask({
        title: "Test Task",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
        completed: false,
      });
    });

    const taskId = result.current.oneOffTasks[0].id;

    // Wait for persistence
    await waitFor(async () => {
      const stored = await storageMock.fetchOneOffTasks();
      expect(stored).toHaveLength(1);
    });

    await act(async () => {
      await result.current.addToPlan(taskId);
    });

    expect(result.current.dayPlan.tasks.some((t) => t.id === taskId)).toBe(
      true,
    );

    await act(async () => {
      await result.current.removeTask(taskId);
    });

    expect(result.current.oneOffTasks).toHaveLength(0);
    expect(result.current.dayPlan.tasks.some((t) => t.id === taskId)).toBe(
      false,
    );
  });

  it("updates daily capacity", () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    act(() => {
      result.current.setDailyCapacity({
        physical: 70,
        social: 80,
        executive: 90,
      });
    });

    expect(result.current.dailyCapacity).toEqual({
      physical: 70,
      social: 80,
      executive: 90,
    });
  });

  it("adds task to day plan", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addTask({
        title: "Test Task",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
        completed: false,
      });
    });

    const taskId = result.current.oneOffTasks[0].id;

    // Wait for persistence
    await waitFor(async () => {
      const stored = await storageMock.fetchOneOffTasks();
      expect(stored).toHaveLength(1);
    });

    await act(async () => {
      await result.current.addToPlan(taskId);
    });

    expect(result.current.dayPlan.tasks.some((t) => t.id === taskId)).toBe(
      true,
    );
  });

  it("removes task from day plan", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addTask({
        title: "Test Task",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
        completed: false,
      });
    });

    const taskId = result.current.oneOffTasks[0].id;

    // Wait for persistence
    await waitFor(async () => {
      const stored = await storageMock.fetchOneOffTasks();
      expect(stored).toHaveLength(1);
    });

    await act(async () => {
      await result.current.addToPlan(taskId);
    });

    await act(async () => {
      await result.current.removeFromPlan(taskId);
    });

    expect(result.current.dayPlan.tasks.some((t) => t.id === taskId)).toBe(
      false,
    );
  }, 5000);

  it("toggles task completion", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addTask({
        title: "Test Task",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
        completed: false,
      });
    });

    const taskId = result.current.oneOffTasks[0].id;

    await waitFor(async () => {
      const stored = await storageMock.fetchOneOffTasks();
      expect(stored).toHaveLength(1);
    });

    await act(async () => {
      await result.current.addToPlan(taskId);
    });

    await act(async () => {
      result.current.toggleTaskCompletion(taskId);
    });

    expect(
      result.current.dayPlan.tasks.find((t) => t.id === taskId)?.completed,
    ).toBe(true);

    await act(async () => {
      result.current.toggleTaskCompletion(taskId);
    });

    expect(
      result.current.dayPlan.tasks.find((t) => t.id === taskId)?.completed,
    ).toBe(false);
  }, 5000);

  it("calculates energy usage and warns when capacity exceeded", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      // Set capacity low to trigger warning
      result.current.setDailyCapacity({
        physical: 5,
        social: 5,
        executive: 5,
      });

      result.current.addTask({
        title: "Heavy Task",
        description: "",
        energyCost: { physical: 10, social: 10, executive: 10 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
        completed: false,
      });
    });

    const taskId = result.current.oneOffTasks[0].id;

    await waitFor(async () => {
      const stored = await storageMock.fetchOneOffTasks();
      expect(stored).toHaveLength(1);
    });

    await act(async () => {
      await result.current.addToPlan(taskId);
    });

    const usage = result.current.calculateEnergyUsage();
    expect(usage).toEqual({
      physical: 10,
      social: 10,
      executive: 10,
    });

    const warning = result.current.checkExceedsCapacity();
    expect(warning.exceeded).toBe(true);
    expect(warning.message).toContain("Physical");
    expect(warning.message).toContain("Social");
    expect(warning.message).toContain("Executive");
  });

  it("should move task back to available when unplanned from current day", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Create and plan a task
    act(() => {
      result.current.addTask({
        title: "Test Task",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
        completed: false,
      });
    });

    const taskId = result.current.oneOffTasks[0].id;

    await waitFor(async () => {
      const stored = await storageMock.fetchOneOffTasks();
      expect(stored).toHaveLength(1);
    });

    await act(async () => {
      result.current.addToPlan(taskId);
    });

    // Task should be in day plan and not in available tasks
    expect(result.current.dayPlan.tasks.some((t) => t.id === taskId)).toBe(
      true,
    );
    expect(result.current.availableTasks.some((t) => t.id === taskId)).toBe(
      false,
    );

    // Unplan the task
    await act(async () => {
      await result.current.moveTaskToUnplanned(
        taskId,
        result.current.currentDate,
      );
    });

    // Task should be back in available tasks and not in day plan
    await waitFor(() => {
      expect(result.current.availableTasks.some((t) => t.id === taskId)).toBe(
        true,
      );
    });
    expect(result.current.dayPlan.tasks.some((t) => t.id === taskId)).toBe(
      false,
    );
  }, 10000);

  it("should move task back to available when unplanned from PAST day", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Setup a task on a past day directly in storage
    const pastDate = "2025-01-01";
    const taskId = "past-task-id";
    const pastTask = {
      id: taskId,
      title: "Past Task",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 1,
        terminationDifficulty: 1,
        isRestorative: false,
      },
      createdAt: new Date(),
      completed: false,
    };

    await storageMock.storeDayPlan(pastDate, {
      date: pastDate,
      tasks: [pastTask],
      dailyCapacity: { physical: 50, social: 50, executive: 50 },
    });

    // Initially task is not in available tasks
    expect(result.current.oneOffTasks).toHaveLength(0);

    // Unplan the task from the past date
    await act(async () => {
      await result.current.moveTaskToUnplanned(taskId, pastDate);
    });

    // Task should be back in available tasks
    await waitFor(() => {
      expect(result.current.availableTasks.some((t) => t.id === taskId)).toBe(
        true,
      );
    });
  });

  it("removes available task directly from state", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Add a task (goes to available tasks)
    act(() => {
      result.current.addTask({
        title: "Available Task",
        description: "",
        energyCost: { physical: 10, social: 10, executive: 10 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
        completed: false,
      });
    });

    const taskId = result.current.oneOffTasks[0].id;
    expect(result.current.oneOffTasks).toHaveLength(1);

    // Remove the task
    await act(async () => {
      await result.current.removeTask(taskId);
    });

    expect(result.current.oneOffTasks).toHaveLength(0);
  });

  it("handles moving unplanned task from date with no plan gracefully", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    // Call with a date that has no plan in storage
    await act(async () => {
      await result.current.moveTaskToUnplanned("2099-01-01", "2099-01-01");
    });

    // Should not crash, and should not add anything to available tasks
    expect(result.current.oneOffTasks).toHaveLength(0);
  });

  it("checks capacity returns exceeded: false when within limits", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Default capacity is 50,50,50.
    // Add a small task
    act(() => {
      result.current.addTask({
        title: "Small Task",
        description: "",
        energyCost: { physical: 10, social: 10, executive: 10 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
        completed: false,
      });
    });

    const taskId = result.current.oneOffTasks[0].id;
    await act(async () => {
      await result.current.addToPlan(taskId);
    });

    const status = result.current.checkExceedsCapacity();
    expect(status.exceeded).toBe(false);
  });
});
