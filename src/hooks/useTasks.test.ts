import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAll } from "@/lib/energy-planner/storage";
import { useTasks } from "./useTasks";

// Reuse the manual mock from storage
vi.mock("@/lib/energy-planner/storage");

describe("useTasks", () => {
  beforeEach(async () => {
    const storageMock = await import("@/lib/energy-planner/storage");
    (storageMock as unknown as { __reset: () => void }).__reset();
  });

  it("initializes empty", async () => {
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual([]);
    expect(result.current.repeatingTasks).toEqual([]);
  });

  it("adds and updates a repeating task", async () => {
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let newTask: any;
    act(() => {
      newTask = result.current.addTask({
        title: "Rep Task",
        energyCost: {} as any,
        factors: {} as any,
        repeatConfig: { frequency: 1, unit: "days" },
      });
    });

    expect(result.current.repeatingTasks).toHaveLength(1);
    expect(result.current.repeatingTasks[0].title).toBe("Rep Task");

    // Update
    act(() => {
      result.current.updateTask({
        ...newTask,
        title: "Rep Task Updated",
      });
    });

    expect(result.current.repeatingTasks[0].title).toBe("Rep Task Updated");
  });

  it("handles adding task back to available (repeating)", async () => {
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let newTask: any;
    act(() => {
      newTask = result.current.addTask({
        title: "Rep Task",
        energyCost: {} as any,
        factors: {} as any,
        repeatConfig: { frequency: 1, unit: "days" },
      });
    });

    // Try to add back to available
    act(() => {
      result.current.addTaskToAvailable(newTask);
    });

    // Should not duplicate
    expect(result.current.repeatingTasks).toHaveLength(1);
  });
});
