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

  describe("Activity Management", () => {
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

    it("adds an activity", () => {
      const { result } = renderHook(() => useEnergyPlanner(), { wrapper });

      act(() => {
        result.current.addActivity({
          title: "Test Activity",
          description: "Description",
          energyCost: { physical: 10, social: 10, executive: 10 },
          factors: {
            initiationDifficulty: 5,
            terminationDifficulty: 5,
            isRestorative: false,
          },
          completed: false,
        });
      });

      expect(result.current.oneOffActivities).toHaveLength(1);
      expect(result.current.oneOffActivities[0].title).toBe("Test Activity");
    });

    it("removes an activity and cleans up day plan", async () => {
      const { result } = renderHook(() => useEnergyPlanner(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addActivity({
          title: "Activity to Remove",
          energyCost: { physical: 10, social: 10, executive: 10 },
          factors: {
            initiationDifficulty: 5,
            terminationDifficulty: 5,
            isRestorative: false,
          },
          completed: false,
        });
      });

      const activity = result.current.oneOffActivities[0];

      // Add to plan first
      await waitFor(async () => {
        const stored = await storageMock.fetchOneOffActivities();
        expect(stored).toHaveLength(1);
      });

      await act(async () => {
        await result.current.addToPlan(activity.id);
      });

      expect(
        result.current.dayPlan.activities.some((a) => a.id === activity.id),
      ).toBe(true);

      // Remove activity
      await act(async () => {
        // Remove activity
        await result.current.removeActivity(activity.id);
      });

      expect(result.current.oneOffActivities).toHaveLength(0);
      expect(
        result.current.dayPlan.activities.some((a) => a.id === activity.id),
      ).toBe(false);
    }, 5000);
  });

  describe("Day Planning (Add)", () => {
    it("adds activity to day plan and calculates usage", async () => {
      const { result } = renderHook(() => useEnergyPlanner(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add activity
      act(() => {
        result.current.addActivity({
          title: "Heavy Activity",
          description: "",
          energyCost: { physical: 50, social: 0, executive: 0 },
          factors: {
            initiationDifficulty: 5,
            terminationDifficulty: 5,
            isRestorative: false,
          },
          completed: false,
        });
      });

      const activity = result.current.oneOffActivities[0];

      // Add to plan
      await waitFor(async () => {
        const stored = await storageMock.fetchOneOffActivities();
        expect(stored).toHaveLength(1);
      });

      await act(async () => {
        await result.current.addToPlan(activity.id);
      });

      expect(
        result.current.dayPlan.activities.some((a) => a.id === activity.id),
      ).toBe(true);

      // Note: calculateEnergyUsage usually takes (dayPlan?, activities?) or reads from state.
      // Based on hook impl, it likely reads current state if no args, OR expects args.
      // Let's assume it reads current state or we pass the activities.
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

      // Add heavy activity
      act(() => {
        result.current.addActivity({
          title: "Too Heavy",
          description: "",
          energyCost: { physical: 50, social: 0, executive: 0 },
          factors: {
            initiationDifficulty: 5,
            terminationDifficulty: 5,
            isRestorative: false,
          },
          completed: false,
        });
      });

      const activity = result.current.oneOffActivities[0];

      await waitFor(async () => {
        const stored = await storageMock.fetchOneOffActivities();
        expect(stored).toHaveLength(1);
      });

      await act(async () => {
        await result.current.addToPlan(activity.id);
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
        result.current.addActivity({
          title: "Exact Activity",
          energyCost: { physical: 10, social: 10, executive: 10 },
          factors: {
            initiationDifficulty: 1,
            terminationDifficulty: 1,
            isRestorative: false,
          },
          completed: false,
        });
      });

      const activity = result.current.oneOffActivities[0];

      await waitFor(async () => {
        const stored = await storageMock.fetchOneOffActivities();
        expect(stored).toHaveLength(1);
      });

      await act(async () => {
        await result.current.addToPlan(activity.id);
      });

      // calculateEnergyUsage and checkExceedsCapacity use internal state
      const check = result.current.checkExceedsCapacity();

      expect(check.exceeded).toBe(false);
    }, 5000);

    it("prevents duplicate activity addition to plan", async () => {
      const { result } = renderHook(() => useEnergyPlanner(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      act(() => {
        result.current.addActivity({
          title: "Activity",
          energyCost: { physical: 10, social: 10, executive: 10 },
          factors: {
            initiationDifficulty: 1,
            terminationDifficulty: 1,
            isRestorative: false,
          },
          completed: false,
        });
      });
      const activity = result.current.oneOffActivities[0];

      await waitFor(async () => {
        const stored = await storageMock.fetchOneOffActivities();
        expect(stored).toHaveLength(1);
      });

      await act(async () => {
        await result.current.addToPlan(activity.id);
        await result.current.addToPlan(activity.id); // Add twice
      });

      const count = result.current.dayPlan.activities.filter(
        (a) => a.id === activity.id,
      ).length;
      expect(count).toBe(1);
    }, 5000);
  });

  describe("Day Planning Completion", () => {
    it("toggles activity completion", async () => {
      const { result } = renderHook(() => useEnergyPlanner(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addActivity({
          title: "Activity",
          energyCost: { physical: 10, social: 10, executive: 10 },
          factors: {
            initiationDifficulty: 5,
            terminationDifficulty: 5,
            isRestorative: false,
          },
          completed: false,
        });
      });

      const activity = result.current.oneOffActivities[0];

      await waitFor(async () => {
        const stored = await storageMock.fetchOneOffActivities();
        expect(stored).toHaveLength(1);
      });

      await act(async () => {
        await result.current.addToPlan(activity.id);
      });

      // Complete
      await act(async () => {
        await result.current.toggleActivityCompletion(activity.id);
      });

      expect(
        result.current.dayPlan.activities.find((a) => a.id === activity.id)
          ?.completed,
      ).toBe(true);

      // Un-complete
      await act(async () => {
        await result.current.toggleActivityCompletion(activity.id);
      });
      expect(
        result.current.dayPlan.activities.find((a) => a.id === activity.id)
          ?.completed,
      ).toBe(false);
    }, 5000);
  });
});
