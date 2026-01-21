import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { clearAll, getOneOffTasks } from "@/lib/energy-planner/storage";
import { useTasks } from "./useTasks";

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple test cases
describe("useTasks", () => {
  beforeEach(async () => {
    await clearAll();
  });

  it("initializes with empty tasks", async () => {
    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tasks).toEqual([]);
  });

  it("loads tasks from IndexedDB on mount", async () => {
    // Pre-populate storage using the storage module
    const { setOneOffTasks } = await import("@/lib/energy-planner/storage");
    await setOneOffTasks([
      {
        id: "1",
        title: "Test Task",
        createdAt: new Date(),
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      },
    ]);

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe("Test Task");
  });

  it("adds a new task with generated id and createdAt", async () => {
    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

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

  it("updates an existing task", async () => {
    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

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

  it("updates only the specified task", async () => {
    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

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
        description: "",
      });
    });

    expect(result.current.tasks[0].title).toBe("Updated Task 1");
    expect(result.current.tasks[1].title).toBe("Task 2");
  });

  it("removes a task", async () => {
    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

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

  it("removes only the specified task", async () => {
    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

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

  it("persists tasks to IndexedDB", async () => {
    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

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

    // Wait for the effect to persist
    await waitFor(async () => {
      const stored = await getOneOffTasks();
      expect(stored).toHaveLength(1);
      expect(stored[0].title).toBe("Persisted Task");
    });
  });

  it("reorders tasks", async () => {
    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

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

    const task1 = result.current.tasks[0];
    const task2 = result.current.tasks[1];

    act(() => {
      result.current.reorderTasks([task2, task1]);
    });

    expect(result.current.tasks[0].id).toBe(task2.id);
    expect(result.current.tasks[1].id).toBe(task1.id);
  });
});
