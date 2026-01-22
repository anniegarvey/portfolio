import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as storageMock from "@/lib/energy-planner/storage";
import { EnergyPlannerProvider, useEnergyPlanner } from "./context";

// Manual mock
vi.mock("@/lib/energy-planner/storage");

// Wrapper for the provider
const wrapper = ({ children }: { children: ReactNode }) => (
  <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
);

// Main suite
describe("EnergyPlannerContext", () => {
  beforeEach(async () => {
    // biome-ignore lint/suspicious/noExplicitAny: wrapper for mock reset
    (storageMock as any).__reset();
    localStorage.clear();
  });

  describe("Task Management", () => {
    it("throws error when used outside provider", () => {
      // Suppress console.error for this test as React logs the error
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => renderHook(() => useEnergyPlanner())).toThrow(
        "useEnergyPlanner must be used within an EnergyPlannerProvider",
      );

      consoleSpy.mockRestore();
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

    it("removes a task and cleans up day plan", async () => {
      const { result } = renderHook(() => useEnergyPlanner(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addTask({
          title: "Task to Remove",
          energyCost: { physical: 10, social: 10, executive: 10 },
          factors: {
            initiationDifficulty: 5,
            terminationDifficulty: 5,
            isRestorative: false,
          },
        });
      });

      const task = result.current.tasks[0];

      // Add to plan first
      await waitFor(async () => {
        const stored = await storageMock.getOneOffTasks();
        expect(stored).toHaveLength(1);
      });

      await act(async () => {
        await result.current.addToPlan(task.id);
      });

      expect(result.current.dayPlan.tasks.some((t) => t.id === task.id)).toBe(
        true,
      );

      // Remove task
      await act(async () => {
        // Remove task
        await result.current.removeTask(task.id);
      });

      expect(result.current.tasks).toHaveLength(0);
      expect(result.current.dayPlan.tasks.some((t) => t.id === task.id)).toBe(
        false,
      );
    }, 5000);
  });

  describe("Day Planning (Add)", () => {
    it("adds task to day plan and calculates usage", async () => {
      const { result } = renderHook(() => useEnergyPlanner(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

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
      await waitFor(async () => {
        const stored = await storageMock.getOneOffTasks();
        expect(stored).toHaveLength(1);
      });

      await act(async () => {
        await result.current.addToPlan(task.id);
      });

      expect(result.current.dayPlan.tasks.some((t) => t.id === task.id)).toBe(
        true,
      );

      // Note: calculateEnergyUsage usually takes (dayPlan?, tasks?) or reads from state.
      // Based on hook impl, it likely reads current state if no args, OR expects args.
      // Let's assume it reads current state or we pass the tasks.
      const usage = result.current.calculateEnergyUsage();
      expect(usage.physical).toBe(50);
    }, 5000);
  });

  describe("Day Planning (Capacity)", () => {
    it("warns when capacity exceeded", async () => {
      const { result } = renderHook(() => useEnergyPlanner(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

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

      await waitFor(async () => {
        const stored = await storageMock.getOneOffTasks();
        expect(stored).toHaveLength(1);
      });

      await act(async () => {
        await result.current.addToPlan(task.id);
      });

      // Recalculate usage and check capacity
      // calculateEnergyUsage and checkExceedsCapacity use internal state
      const check = result.current.checkExceedsCapacity();

      expect(check.exceeded).toBe(true);
      expect(check.message).toContain("Physical");
    }, 5000);
  });

  describe("Day Planning (Edge Cases)", () => {
    it("does not warn when usage equals capacity", async () => {
      const { result } = renderHook(() => useEnergyPlanner(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setDailyCapacity({
          physical: 10,
          social: 10,
          executive: 10,
        });
        result.current.addTask({
          title: "Exact Task",
          energyCost: { physical: 10, social: 10, executive: 10 },
          factors: {
            initiationDifficulty: 1,
            terminationDifficulty: 1,
            isRestorative: false,
          },
        });
      });

      const task = result.current.tasks[0];

      await waitFor(async () => {
        const stored = await storageMock.getOneOffTasks();
        expect(stored).toHaveLength(1);
      });

      await act(async () => {
        await result.current.addToPlan(task.id);
      });

      // calculateEnergyUsage and checkExceedsCapacity use internal state
      const check = result.current.checkExceedsCapacity();

      expect(check.exceeded).toBe(false);
    }, 5000);

    it("prevents duplicate task addition to plan", async () => {
      const { result } = renderHook(() => useEnergyPlanner(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      act(() => {
        result.current.addTask({
          title: "Task",
          energyCost: { physical: 10, social: 10, executive: 10 },
          factors: {
            initiationDifficulty: 1,
            terminationDifficulty: 1,
            isRestorative: false,
          },
        });
      });
      const task = result.current.tasks[0];

      await waitFor(async () => {
        const stored = await storageMock.getOneOffTasks();
        expect(stored).toHaveLength(1);
      });

      await act(async () => {
        await result.current.addToPlan(task.id);
        await result.current.addToPlan(task.id); // Add twice
      });

      const count = result.current.dayPlan.tasks.filter(
        (t) => t.id === task.id,
      ).length;
      expect(count).toBe(1);
    }, 5000);
  });

  describe("Day Planning Completion", () => {
    it("toggles task completion", async () => {
      const { result } = renderHook(() => useEnergyPlanner(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

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

      await waitFor(async () => {
        const stored = await storageMock.getOneOffTasks();
        expect(stored).toHaveLength(1);
      });

      await act(async () => {
        await result.current.addToPlan(task.id);
      });

      // Complete
      await act(async () => {
        await result.current.toggleTaskCompletion(task.id);
      });

      expect(
        result.current.dayPlan.tasks.find((t) => t.id === task.id)?.completed,
      ).toBe(true);

      // Un-complete
      await act(async () => {
        await result.current.toggleTaskCompletion(task.id);
      });
      expect(
        result.current.dayPlan.tasks.find((t) => t.id === task.id)?.completed,
      ).toBe(false);
    }, 5000);
  });
});
