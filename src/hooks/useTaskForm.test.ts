import { renderHook } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "@/lib/energy-planner/context";
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
};

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple test cases
describe("useTaskForm", () => {
  it("initializes with default values when no initial data", () => {
    const { result } = renderHook(() => useTaskForm({}), {
      wrapper: EnergyPlannerProvider,
    });

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
    const { result } = renderHook(
      () => useTaskForm({ initialData: mockTask }),
      {
        wrapper: EnergyPlannerProvider,
      },
    );

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
    const { result } = renderHook(() => useTaskForm({}), {
      wrapper: EnergyPlannerProvider,
    });

    act(() => {
      result.current.setTitle("New Title");
    });

    expect(result.current.title).toBe("New Title");
  });

  it("updates energy cost when setEnergyCost is called", () => {
    const { result } = renderHook(() => useTaskForm({}), {
      wrapper: EnergyPlannerProvider,
    });

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
    const { result } = renderHook(() => useTaskForm({}), {
      wrapper: EnergyPlannerProvider,
    });

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
    const { result } = renderHook(
      () => useTaskForm({ initialData: mockTask, onClose: mockOnClose }),
      {
        wrapper: EnergyPlannerProvider,
      },
    );

    act(() => {
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("resets form when submitted without onClose", () => {
    const { result } = renderHook(() => useTaskForm({}), {
      wrapper: EnergyPlannerProvider,
    });

    act(() => {
      result.current.setTitle("Test");
      result.current.setEnergyCost({ physical: 50, social: 60, executive: 70 });
      result.current.setFactors({
        initiationDifficulty: 8,
        terminationDifficulty: 2,
        isRestorative: true,
      });
    });

    act(() => {
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

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
    const { result } = renderHook(() => useTaskForm({ onClose: mockOnClose }), {
      wrapper: EnergyPlannerProvider,
    });

    act(() => {
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("provides a unique formId", () => {
    const { result } = renderHook(() => useTaskForm({}), {
      wrapper: EnergyPlannerProvider,
    });

    expect(result.current.formId).toBeDefined();
    expect(typeof result.current.formId).toBe("string");
  });
});
