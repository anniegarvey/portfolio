import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as storageMock from "@/lib/energy-planner/storage";
import { EnergyPlannerProvider, useEnergyPlanner } from "./context";

vi.mock("@/lib/energy-planner/storage");

const wrapper = ({ children }: { children: ReactNode }) => (
  <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
);

describe("EnergyPlannerContext", () => {
  beforeEach(async () => {
    // biome-ignore lint/suspicious/noExplicitAny: wrapper for mock reset
    (storageMock as any).__reset();
    localStorage.clear();
  });

  describe("Activity Management", () => {
    it("throws error when used outside provider", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => renderHook(() => useEnergyPlanner())).toThrow(
        "useEnergyPlanner must be used within an EnergyPlannerProvider",
      );

      consoleSpy.mockRestore();
    });

    it("adds an activity", async () => {
      const { result } = renderHook(() => useEnergyPlanner(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

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
        });
      });

      const activity = result.current.oneOffActivities[0];

      await waitFor(async () => {
        const stored = await storageMock.fetchActivities();
        expect(stored).toHaveLength(1);
      });

      await act(async () => {
        await result.current.addToPlan(activity.id);
      });

      expect(
        result.current.dayPlan.plannedInstances.some(
          (i) => i.sourceActivityId === activity.id,
        ),
      ).toBe(true);

      await act(async () => {
        await result.current.removeActivity(activity.id);
      });

      expect(result.current.oneOffActivities).toHaveLength(0);
      expect(
        result.current.dayPlan.plannedInstances.some(
          (i) => i.sourceActivityId === activity.id,
        ),
      ).toBe(false);
    }, 5000);
  });

  describe("Day Planning (Add)", () => {
    it("adds activity to day plan and calculates usage", async () => {
      const { result } = renderHook(() => useEnergyPlanner(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

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
        });
      });

      const activity = result.current.oneOffActivities[0];

      await waitFor(async () => {
        const stored = await storageMock.fetchActivities();
        expect(stored).toHaveLength(1);
      });

      await act(async () => {
        await result.current.addToPlan(activity.id);
      });

      expect(
        result.current.dayPlan.plannedInstances.some(
          (i) => i.sourceActivityId === activity.id,
        ),
      ).toBe(true);

      expect(result.current.energyUsage.physical).toBe(50);
    }, 5000);
  });

  describe("Day Planning (Capacity)", () => {
    it("warns when capacity exceeded", async () => {
      const { result } = renderHook(() => useEnergyPlanner(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setDailyCapacity({
          physical: 20,
          social: 20,
          executive: 20,
        });
      });

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
        });
      });

      const activity = result.current.oneOffActivities[0];

      await waitFor(async () => {
        const stored = await storageMock.fetchActivities();
        expect(stored).toHaveLength(1);
      });

      await act(async () => {
        await result.current.addToPlan(activity.id);
      });

      expect(result.current.capacityWarnings).toContain("Physical");
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
        });
      });

      const activity = result.current.oneOffActivities[0];

      await waitFor(async () => {
        const stored = await storageMock.fetchActivities();
        expect(stored).toHaveLength(1);
      });

      await act(async () => {
        await result.current.addToPlan(activity.id);
      });

      expect(result.current.capacityWarnings).toEqual([]);
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
        });
      });
      const activity = result.current.oneOffActivities[0];

      await waitFor(async () => {
        const stored = await storageMock.fetchActivities();
        expect(stored).toHaveLength(1);
      });

      await act(async () => {
        await result.current.addToPlan(activity.id);
        await result.current.addToPlan(activity.id);
      });

      const count = result.current.dayPlan.plannedInstances.filter(
        (i) => i.sourceActivityId === activity.id,
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
        });
      });

      const activity = result.current.oneOffActivities[0];

      await waitFor(async () => {
        const stored = await storageMock.fetchActivities();
        expect(stored).toHaveLength(1);
      });

      await act(async () => {
        await result.current.addToPlan(activity.id);
      });

      const instanceId = result.current.dayPlan.plannedInstances.find(
        (i) => i.sourceActivityId === activity.id,
      )?.id;
      if (!instanceId) throw new Error("Instance not found");

      await act(async () => {
        await result.current.toggleActivityCompletion(instanceId);
      });

      expect(
        result.current.dayPlan.plannedInstances.find((i) => i.id === instanceId)
          ?.completed,
      ).toBe(true);

      await act(async () => {
        await result.current.toggleActivityCompletion(instanceId);
      });
      expect(
        result.current.dayPlan.plannedInstances.find((i) => i.id === instanceId)
          ?.completed,
      ).toBe(false);
    }, 5000);
  });
});
