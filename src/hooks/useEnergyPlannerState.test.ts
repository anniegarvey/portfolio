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
    expect(result.current.tasks).toEqual([]);
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
      });
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe("Test Task");
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
      });
    });

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.updateTask({
        ...result.current.tasks[0],
        title: "Updated Title",
      });
    });

    expect(result.current.tasks[0].title).toBe("Updated Title");
    expect(result.current.tasks[0].id).toBe(taskId);
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
      });
    });

    const taskId = result.current.tasks[0].id;

    // Wait for persistence
    await waitFor(async () => {
      const stored = await storageMock.getOneOffTasks();
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

    expect(result.current.tasks).toHaveLength(0);
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
      });
    });

    const taskId = result.current.tasks[0].id;

    // Wait for persistence
    await waitFor(async () => {
      const stored = await storageMock.getOneOffTasks();
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
      });
    });

    const taskId = result.current.tasks[0].id;

    // Wait for persistence
    await waitFor(async () => {
      const stored = await storageMock.getOneOffTasks();
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
      });
    });

    const taskId = result.current.tasks[0].id;

    await waitFor(async () => {
      const stored = await storageMock.getOneOffTasks();
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
      });
    });

    const taskId = result.current.tasks[0].id;

    await waitFor(async () => {
      const stored = await storageMock.getOneOffTasks();
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
});
