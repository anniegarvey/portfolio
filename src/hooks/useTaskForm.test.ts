import { renderHook } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "@/lib/energy-planner/schema";
import { useTaskForm } from "./useTaskForm";

const mockTask: Task = {
  id: "task-1",
  title: "Test Task",
  createdAt: new Date(),
  energyCost: { physical: 10, social: 20, executive: 5 },
  factors: {
    initiationDifficulty: 3,
    terminationDifficulty: 7,
    isRestorative: true,
  },
  completed: false,
};

// Mock the context hook
vi.mock("@/lib/energy-planner/context", () => ({
  useEnergyPlanner: vi.fn(),
}));

import { useEnergyPlanner } from "@/lib/energy-planner/context";

describe("useTaskForm", () => {
  const mockAddTask = vi.fn().mockReturnValue({ id: "new-task-id" });
  const mockUpdateTask = vi.fn();
  const mockAddToPlan = vi.fn();
  const mockAssignTaskToZone = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useEnergyPlanner as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      addTask: mockAddTask,
      updateTask: mockUpdateTask,
      addToPlan: mockAddToPlan,
      assignTaskToZone: mockAssignTaskToZone,
      isLoading: false,
    });
  });

  it("initializes with default values when no initial data", () => {
    const { result } = renderHook(() => useTaskForm({}));

    expect(result.current.title).toBe("");
    expect(result.current.energyCost).toEqual({
      physical: 10,
      social: 10,
      executive: 10,
    });
    expect(result.current.factors).toEqual({
      initiationDifficulty: 5,
      terminationDifficulty: 5,
      isRestorative: false,
    });
  });

  it("initializes with initial data when provided", () => {
    const { result } = renderHook(() => useTaskForm({ initialData: mockTask }));

    expect(result.current.title).toBe("Test Task");
    expect(result.current.energyCost).toEqual({
      physical: 10,
      social: 20,
      executive: 5,
    });
    expect(result.current.factors).toEqual({
      initiationDifficulty: 3,
      terminationDifficulty: 7,
      isRestorative: true,
    });
  });

  it("updates title when setTitle is called", () => {
    const { result } = renderHook(() => useTaskForm({}));

    act(() => {
      result.current.setTitle("New Title");
    });

    expect(result.current.title).toBe("New Title");
  });

  it("updates energy cost when setEnergyCost is called", () => {
    const { result } = renderHook(() => useTaskForm({}));

    act(() => {
      result.current.setEnergyCost({ physical: 50, social: 60, executive: 70 });
    });

    expect(result.current.energyCost).toEqual({
      physical: 50,
      social: 60,
      executive: 70,
    });
  });

  it("updates factors when setFactors is called", () => {
    const { result } = renderHook(() => useTaskForm({}));

    act(() => {
      result.current.setFactors({
        initiationDifficulty: 8,
        terminationDifficulty: 2,
        isRestorative: true,
      });
    });

    expect(result.current.factors).toEqual({
      initiationDifficulty: 8,
      terminationDifficulty: 2,
      isRestorative: true,
    });
  });

  it("calls onClose when form is submitted with initial data", () => {
    const mockOnClose = vi.fn();
    const { result } = renderHook(() =>
      useTaskForm({ initialData: mockTask, onClose: mockOnClose }),
    );

    act(() => {
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockUpdateTask).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("resets form when submitted without onClose", () => {
    const { result } = renderHook(() => useTaskForm({}));

    // Setup form
    act(() => {
      result.current.setTitle("Test");
      result.current.setEnergyCost({ physical: 50, social: 60, executive: 70 });
      result.current.setFactors({
        initiationDifficulty: 8,
        terminationDifficulty: 2,
        isRestorative: true,
      });
    });

    // Submit
    act(() => {
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockAddTask).toHaveBeenCalled();
    expect(result.current.title).toBe("");
    expect(result.current.energyCost).toEqual({
      physical: 10,
      social: 10,
      executive: 10,
    });
    expect(result.current.factors).toEqual({
      initiationDifficulty: 5,
      terminationDifficulty: 5,
      isRestorative: false,
    });
  });

  it("does not submit when title is empty", () => {
    const mockOnClose = vi.fn();
    const { result } = renderHook(() => useTaskForm({ onClose: mockOnClose }));

    act(() => {
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockAddTask).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("assigns zone when creating a repeating task with context", () => {
    const mockOnClose = vi.fn();
    const { result } = renderHook(() =>
      useTaskForm({
        initialContext: { date: "2024-01-01", zoneId: "morning" },
        onClose: mockOnClose,
      }),
    );

    act(() => {
      result.current.setTitle("Repeating w/ Zone");
      result.current.setIsRepeating(true);
      result.current.setFrequency(1);
      result.current.setUnit("days");
    });

    act(() => {
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockAddTask).toHaveBeenCalled();
    // Validate that we called assignTaskToZone with the expected virtual ID
    expect(mockAssignTaskToZone).toHaveBeenCalledWith(
      "virtual-new-task-id-2024-01-01",
      "morning",
    );
  });

  it("provides a unique formId", () => {
    const { result } = renderHook(() => useTaskForm({}));

    expect(result.current.formId).toBeDefined();
    expect(typeof result.current.formId).toBe("string");
  });
});
