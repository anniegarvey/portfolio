import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "@/lib/energy-planner/schema";
import { useTasks } from "./useTasks";

// Reuse the manual mock from storage
vi.mock("@/lib/energy-planner/storage");

const newRepeatingTask = {
  title: "Rep Task",
  energyCost: {},
  factors: {
    initiationDifficulty: 0,
    terminationDifficulty: 0,
    isRestorative: false,
  },
  repeatConfig: { frequency: 1, unit: "days" },
  completed: false,
} as const;

describe("useTasks", () => {
  beforeEach(async () => {
    const storageMock = await import("@/lib/energy-planner/storage");
    (storageMock as unknown as { __reset: () => void }).__reset();
  });

  it("initializes empty", async () => {
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.oneOffTasks).toEqual([]);
    expect(result.current.repeatingTasks).toEqual([]);
  });

  it("adds and updates a repeating task", async () => {
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let addedTask: Task;

    act(() => {
      addedTask = result.current.addTask(newRepeatingTask);
    });

    expect(result.current.repeatingTasks).toHaveLength(1);
    expect(result.current.repeatingTasks[0].title).toBe("Rep Task");

    // Update
    act(() => {
      result.current.updateTask({
        ...addedTask,
        title: "Rep Task Updated",
      });
    });

    expect(result.current.repeatingTasks).toHaveLength(1);
    expect(result.current.repeatingTasks[0].title).toBe("Rep Task Updated");
  });

  it("handles adding task back to available (repeating)", async () => {
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.addTask(newRepeatingTask);
    });

    // Try to add back to available
    act(() => {
      result.current.addTaskToAvailable({
        ...newRepeatingTask,
        id: "123",
        createdAt: new Date(),
      });
    });

    // Should not duplicate
    expect(result.current.repeatingTasks).toHaveLength(1);
  });
});
