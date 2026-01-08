import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { EnergyPlannerProvider, useEnergyPlanner } from "./context";

// Wrapper for the provider
const wrapper = ({ children }: { children: ReactNode }) => (
  <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
);

describe("EnergyPlannerContext - Task Management", () => {
  // Helper to clear storage before each test (simple approach for now, assuming jdom storage mock works)
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds a task", () => {
    const { result } = renderHook(() => useEnergyPlanner(), { wrapper });

    act(() => {
      result.current.addTask({
        title: "Test Task",
        description: "Description",
        energyCost: { physical: 10, social: 10, executive: 10 },
        factors: {
          initiationDifficulty: 5,
          terminationDifficulty: 5,
          isRestorative: false,
        },
      });
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe("Test Task");
  });
});

describe("EnergyPlannerContext - Day Planning (Add)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds task to day plan and calculates usage", () => {
    const { result } = renderHook(() => useEnergyPlanner(), { wrapper });

    // Add task
    act(() => {
      result.current.addTask({
        title: "Heavy Task",
        description: "",
        energyCost: { physical: 50, social: 0, executive: 0 },
        factors: {
          initiationDifficulty: 5,
          terminationDifficulty: 5,
          isRestorative: false,
        },
      });
    });

    const task = result.current.tasks[0];

    // Add to plan
    act(() => {
      result.current.addToPlan(task.id);
    });

    expect(result.current.dayPlan.selectedTaskIds).toContain(task.id);
    expect(result.current.calculateEnergyUsage().physical).toBe(50);
  });
});

describe("EnergyPlannerContext - Day Planning (Capacity)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("warns when capacity exceeded", () => {
    const { result } = renderHook(() => useEnergyPlanner(), { wrapper });

    // Set capacity low
    act(() => {
      result.current.setDailyCapacity({
        physical: 20,
        social: 20,
        executive: 20,
      });
    });

    // Add heavy task
    act(() => {
      result.current.addTask({
        title: "Too Heavy",
        description: "",
        energyCost: { physical: 50, social: 0, executive: 0 },
        factors: {
          initiationDifficulty: 5,
          terminationDifficulty: 5,
          isRestorative: false,
        },
      });
    });

    const task = result.current.tasks[0];
    act(() => {
      result.current.addToPlan(task.id);
    });

    const check = result.current.checkExceedsCapacity();
    expect(check.exceeded).toBe(true);
    expect(check.message).toContain("Physical");
  });
});

describe("EnergyPlannerContext - Day Planning Completion", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("toggles task completion", () => {
    const { result } = renderHook(() => useEnergyPlanner(), { wrapper });

    act(() => {
      result.current.addTask({
        title: "Task",
        energyCost: { physical: 10, social: 10, executive: 10 },
        factors: {
          initiationDifficulty: 5,
          terminationDifficulty: 5,
          isRestorative: false,
        },
      });
    });

    const task = result.current.tasks[0];
    act(() => {
      result.current.addToPlan(task.id);
    });

    // Complete
    act(() => {
      result.current.toggleTaskCompletion(task.id);
    });
    expect(result.current.dayPlan.completedTaskIds).toContain(task.id);

    // Un-complete
    act(() => {
      result.current.toggleTaskCompletion(task.id);
    });
    expect(result.current.dayPlan.completedTaskIds).not.toContain(task.id);
  });
});
