import { renderHook } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { useEnergyPlannerState } from "./hooks";

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple test cases
describe("useEnergyPlannerState", () => {
  beforeEach(() => {
    localStorage.clear();
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

  it("removes a task and removes it from day plan", () => {
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

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.addToPlan(taskId);
    });

    expect(result.current.dayPlan.selectedTaskIds).toContain(taskId);

    act(() => {
      result.current.removeTask(taskId);
    });

    expect(result.current.tasks).toHaveLength(0);
    expect(result.current.dayPlan.selectedTaskIds).not.toContain(taskId);
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

  it("adds task to day plan", () => {
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

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.addToPlan(taskId);
    });

    expect(result.current.dayPlan.selectedTaskIds).toContain(taskId);
  });

  it("removes task from day plan", () => {
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

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.addToPlan(taskId);
      result.current.removeFromPlan(taskId);
    });

    expect(result.current.dayPlan.selectedTaskIds).not.toContain(taskId);
  });

  it("toggles task completion", () => {
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

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.addToPlan(taskId);
      result.current.toggleTaskCompletion(taskId);
    });

    expect(result.current.dayPlan.completedTaskIds).toContain(taskId);

    act(() => {
      result.current.toggleTaskCompletion(taskId);
    });

    expect(result.current.dayPlan.completedTaskIds).not.toContain(taskId);
  });

  it("calculates energy usage correctly", () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    act(() => {
      result.current.addTask({
        title: "Task 1",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
      result.current.addTask({
        title: "Task 2",
        description: "",
        energyCost: { physical: 15, social: 10, executive: 25 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const task1Id = result.current.tasks[0].id;
    const task2Id = result.current.tasks[1].id;

    act(() => {
      result.current.addToPlan(task1Id);
      result.current.addToPlan(task2Id);
    });

    const usage = result.current.calculateEnergyUsage();

    expect(usage).toEqual({
      physical: 25,
      social: 30,
      executive: 30,
    });
  });

  it("detects when capacity is not exceeded", () => {
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

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.addToPlan(taskId);
    });

    const warning = result.current.checkExceedsCapacity();

    expect(warning.exceeded).toBe(false);
  });

  it("detects when physical capacity is exceeded", () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    act(() => {
      result.current.setDailyCapacity({
        physical: 20,
        social: 100,
        executive: 100,
      });
      result.current.addTask({
        title: "Test Task",
        description: "",
        energyCost: { physical: 30, social: 10, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.addToPlan(taskId);
    });

    const warning = result.current.checkExceedsCapacity();

    expect(warning.exceeded).toBe(true);
    expect(warning.message).toContain("Physical");
  });

  it("detects when social capacity is exceeded", () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    act(() => {
      result.current.setDailyCapacity({
        physical: 100,
        social: 20,
        executive: 100,
      });
      result.current.addTask({
        title: "Test Task",
        description: "",
        energyCost: { physical: 10, social: 30, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.addToPlan(taskId);
    });

    const warning = result.current.checkExceedsCapacity();

    expect(warning.exceeded).toBe(true);
    expect(warning.message).toContain("Social");
  });

  it("detects when executive capacity is exceeded", () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    act(() => {
      result.current.setDailyCapacity({
        physical: 100,
        social: 100,
        executive: 20,
      });
      result.current.addTask({
        title: "Test Task",
        description: "",
        energyCost: { physical: 10, social: 10, executive: 30 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.addToPlan(taskId);
    });

    const warning = result.current.checkExceedsCapacity();

    expect(warning.exceeded).toBe(true);
    expect(warning.message).toContain("Executive");
  });

  it("detects when multiple capacities are exceeded", () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    act(() => {
      result.current.setDailyCapacity({
        physical: 20,
        social: 20,
        executive: 100,
      });
      result.current.addTask({
        title: "Test Task",
        description: "",
        energyCost: { physical: 30, social: 30, executive: 10 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.addToPlan(taskId);
    });

    const warning = result.current.checkExceedsCapacity();

    expect(warning.exceeded).toBe(true);
    expect(warning.message).toContain("Physical");
    expect(warning.message).toContain("Social");
  });

  it("updates only the specified task, not all tasks", () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    act(() => {
      result.current.addTask({
        title: "Task 1",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
      result.current.addTask({
        title: "Task 2",
        description: "",
        energyCost: { physical: 15, social: 10, executive: 25 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    act(() => {
      result.current.updateTask({
        ...result.current.tasks[0],
        title: "Updated Task 1",
      });
    });

    expect(result.current.tasks[0].title).toBe("Updated Task 1");
    expect(result.current.tasks[1].title).toBe("Task 2"); // Should NOT be updated
    expect(result.current.tasks).toHaveLength(2);
  });

  it("removes only the specified task, not all tasks", () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    act(() => {
      result.current.addTask({
        title: "Task 1",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
      result.current.addTask({
        title: "Task 2",
        description: "",
        energyCost: { physical: 15, social: 10, executive: 25 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const task1Id = result.current.tasks[0].id;
    const task2Id = result.current.tasks[1].id;

    act(() => {
      result.current.removeTask(task1Id);
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].id).toBe(task2Id);
    expect(result.current.tasks[0].title).toBe("Task 2");
  });

  it("removes task from both selected and completed lists when task is deleted", () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    act(() => {
      result.current.addTask({
        title: "Task 1",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
      result.current.addTask({
        title: "Task 2",
        description: "",
        energyCost: { physical: 15, social: 10, executive: 25 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const task1Id = result.current.tasks[0].id;
    const task2Id = result.current.tasks[1].id;

    act(() => {
      result.current.addToPlan(task1Id);
      result.current.addToPlan(task2Id);
      result.current.toggleTaskCompletion(task1Id);
    });

    expect(result.current.dayPlan.selectedTaskIds).toContain(task1Id);
    expect(result.current.dayPlan.completedTaskIds).toContain(task1Id);

    act(() => {
      result.current.removeTask(task1Id);
    });

    expect(result.current.dayPlan.selectedTaskIds).not.toContain(task1Id);
    expect(result.current.dayPlan.completedTaskIds).not.toContain(task1Id);
    expect(result.current.dayPlan.selectedTaskIds).toContain(task2Id); // Task 2 should still be there
  });

  it("toggles completion for only the specified task", () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    act(() => {
      result.current.addTask({
        title: "Task 1",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
      result.current.addTask({
        title: "Task 2",
        description: "",
        energyCost: { physical: 15, social: 10, executive: 25 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const task1Id = result.current.tasks[0].id;
    const task2Id = result.current.tasks[1].id;

    act(() => {
      result.current.addToPlan(task1Id);
      result.current.addToPlan(task2Id);
      result.current.toggleTaskCompletion(task1Id);
    });

    expect(result.current.dayPlan.completedTaskIds).toContain(task1Id);
    expect(result.current.dayPlan.completedTaskIds).not.toContain(task2Id);

    act(() => {
      result.current.toggleTaskCompletion(task1Id);
    });

    expect(result.current.dayPlan.completedTaskIds).not.toContain(task1Id);
    expect(result.current.dayPlan.completedTaskIds).not.toContain(task2Id);
  });

  it("verifies warning message includes comma-separated energy types", () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    act(() => {
      result.current.setDailyCapacity({
        physical: 20,
        social: 20,
        executive: 100,
      });
      result.current.addTask({
        title: "Test Task",
        description: "",
        energyCost: { physical: 30, social: 30, executive: 10 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.addToPlan(taskId);
    });

    const warning = result.current.checkExceedsCapacity();

    expect(warning.message).toContain(", "); // Verify comma separator is used
  });
});
