import { renderHook } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { useTasks } from "./useTasks";

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple test cases
describe("useTasks", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with empty tasks", () => {
    const { result } = renderHook(() => useTasks());
    expect(result.current.tasks).toEqual([]);
  });

  it("loads tasks from localStorage on mount", () => {
    const storedTasks = [
      {
        id: "1",
        title: "Test Task",
        createdAt: new Date().toISOString(),
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      },
    ];
    localStorage.setItem("energy_planner_tasks", JSON.stringify(storedTasks));

    const { result } = renderHook(() => useTasks());
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe("Test Task");
  });

  it("adds a new task with generated id and createdAt", () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask({
        title: "New Task",
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
    expect(result.current.tasks[0].title).toBe("New Task");
    expect(result.current.tasks[0].id).toBeDefined();
    expect(result.current.tasks[0].createdAt).toBeDefined();
  });

  it("updates an existing task", () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask({
        title: "Original",
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
        title: "Updated",
      });
    });

    expect(result.current.tasks[0].title).toBe("Updated");
    expect(result.current.tasks[0].id).toBe(taskId);
  });

  it("updates only the specified task", () => {
    const { result } = renderHook(() => useTasks());

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
    expect(result.current.tasks[1].title).toBe("Task 2");
  });

  it("removes a task", () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask({
        title: "Task to Remove",
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
      result.current.removeTaskState(taskId);
    });

    expect(result.current.tasks).toHaveLength(0);
  });

  it("removes only the specified task", () => {
    const { result } = renderHook(() => useTasks());

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
      result.current.removeTaskState(task1Id);
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].id).toBe(task2Id);
  });

  it("persists tasks to localStorage", () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask({
        title: "Persisted Task",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const stored = localStorage.getItem("energy_planner_tasks");
    expect(stored).not.toBeNull();
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].title).toBe("Persisted Task");
    }
  });
});
