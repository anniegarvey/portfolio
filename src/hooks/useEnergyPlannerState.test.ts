import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as storageMock from "@/lib/energy-planner/storage";
import { useEnergyPlannerState } from "./useEnergyPlannerState";

vi.mock("@/lib/energy-planner/storage");

describe("useEnergyPlannerState", () => {
  beforeEach(() => {
    (storageMock as unknown as { __reset: () => void }).__reset();
  });

  it("initializes with empty activities", () => {
    const { result } = renderHook(() => useEnergyPlannerState());
    expect(result.current.oneOffActivities).toEqual([]);
  });

  it("initializes with default daily capacity", () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    expect(result.current.dailyCapacity).toEqual({
      physical: 0,
      social: 0,
      executive: 0,
    });
  });

  it("adds a new activity", () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    act(() => {
      result.current.addActivity({
        title: "Test Activity",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    expect(result.current.oneOffActivities).toHaveLength(1);
    expect(result.current.oneOffActivities[0].title).toBe("Test Activity");
  });

  it("updates an existing activity", () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    act(() => {
      result.current.addActivity({
        title: "Original Title",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const activityId = result.current.oneOffActivities[0].id;

    act(() => {
      result.current.updateActivity({
        ...result.current.oneOffActivities[0],
        title: "Updated Title",
      });
    });

    expect(result.current.oneOffActivities[0].title).toBe("Updated Title");
    expect(result.current.oneOffActivities[0].id).toBe(activityId);
  });

  it("removes an activity and removes it from day plan", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addActivity({
        title: "Test Activity",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const activityId = result.current.oneOffActivities[0].id;

    await waitFor(async () => {
      const stored = await storageMock.fetchActivities();
      expect(stored).toHaveLength(1);
    });

    await act(async () => {
      await result.current.addToPlan(activityId);
    });

    expect(
      result.current.dayPlan.plannedInstances.some(
        (i) => i.sourceActivityId === activityId,
      ),
    ).toBe(true);

    await act(async () => {
      await result.current.removeActivity(activityId);
    });

    expect(result.current.oneOffActivities).toHaveLength(0);
    expect(
      result.current.dayPlan.plannedInstances.some(
        (i) => i.sourceActivityId === activityId,
      ),
    ).toBe(false);
  });

  it("updates daily capacity", () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    act(() => {
      result.current.setDailyCapacity({
        physical: 70,
        social: 80,
        executive: 90,
      });
    });

    expect(result.current.dailyCapacity).toEqual({
      physical: 70,
      social: 80,
      executive: 90,
    });
  });

  it("adds activity to day plan", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addActivity({
        title: "Test Activity",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const activityId = result.current.oneOffActivities[0].id;

    await waitFor(async () => {
      const stored = await storageMock.fetchActivities();
      expect(stored).toHaveLength(1);
    });

    await act(async () => {
      await result.current.addToPlan(activityId);
    });

    expect(
      result.current.dayPlan.plannedInstances.some(
        (i) => i.sourceActivityId === activityId,
      ),
    ).toBe(true);
  });

  it("removes activity from day plan", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addActivity({
        title: "Test Activity",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const activityId = result.current.oneOffActivities[0].id;

    await waitFor(async () => {
      const stored = await storageMock.fetchActivities();
      expect(stored).toHaveLength(1);
    });

    await act(async () => {
      await result.current.addToPlan(activityId);
    });

    // Get the instance ID to use for removeFromPlan
    const instanceId = result.current.dayPlan.plannedInstances.find(
      (i) => i.sourceActivityId === activityId,
    )?.id;
    if (!instanceId) throw new Error("Instance not found");

    await act(async () => {
      await result.current.removeFromPlan(instanceId);
    });

    expect(
      result.current.dayPlan.plannedInstances.some(
        (i) => i.sourceActivityId === activityId,
      ),
    ).toBe(false);
  }, 5000);

  it("toggles activity completion", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addActivity({
        title: "Test Activity",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const activityId = result.current.oneOffActivities[0].id;

    await waitFor(async () => {
      const stored = await storageMock.fetchActivities();
      expect(stored).toHaveLength(1);
    });

    await act(async () => {
      await result.current.addToPlan(activityId);
    });

    const instanceId = result.current.dayPlan.plannedInstances.find(
      (i) => i.sourceActivityId === activityId,
    )?.id;
    if (!instanceId) throw new Error("Instance not found");

    await act(async () => {
      result.current.toggleActivityCompletion(instanceId);
    });

    expect(
      result.current.dayPlan.plannedInstances.find((i) => i.id === instanceId)
        ?.completed,
    ).toBe(true);

    await act(async () => {
      result.current.toggleActivityCompletion(instanceId);
    });

    expect(
      result.current.dayPlan.plannedInstances.find((i) => i.id === instanceId)
        ?.completed,
    ).toBe(false);
  }, 5000);

  it("calculates energy usage and warns when capacity exceeded", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setDailyCapacity({
        physical: 5,
        social: 5,
        executive: 5,
      });

      result.current.addActivity({
        title: "Heavy Activity",
        description: "",
        energyCost: { physical: 10, social: 10, executive: 10 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const activityId = result.current.oneOffActivities[0].id;

    await waitFor(async () => {
      const stored = await storageMock.fetchActivities();
      expect(stored).toHaveLength(1);
    });

    await act(async () => {
      await result.current.addToPlan(activityId);
    });

    const usage = result.current.calculateEnergyUsage();
    expect(usage).toEqual({
      physical: 10,
      social: 10,
      executive: 10,
    });

    const warning = result.current.checkExceedsCapacity();
    expect(warning.exceeded).toBe(true);
    expect(warning.message).toContain("Physical, Social, Executive");
  });

  it("should make activity available again when unplanned from current day", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addActivity({
        title: "Test Activity",
        description: "",
        energyCost: { physical: 10, social: 20, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const activityId = result.current.oneOffActivities[0].id;

    await waitFor(async () => {
      const stored = await storageMock.fetchActivities();
      expect(stored).toHaveLength(1);
    });

    await act(async () => {
      result.current.addToPlan(activityId);
    });

    expect(
      result.current.dayPlan.plannedInstances.some(
        (i) => i.sourceActivityId === activityId,
      ),
    ).toBe(true);

    // Get instanceId before unplanning
    const instanceId = result.current.dayPlan.plannedInstances.find(
      (i) => i.sourceActivityId === activityId,
    )?.id;
    if (!instanceId) throw new Error("Instance not found");

    await act(async () => {
      await result.current.moveActivityToUnplanned(
        instanceId,
        result.current.currentDate,
      );
    });

    await waitFor(() => {
      expect(
        result.current.availableActivities.some((a) => a.id === activityId),
      ).toBe(true);
    });
    expect(
      result.current.dayPlan.plannedInstances.some(
        (i) => i.sourceActivityId === activityId,
      ),
    ).toBe(false);
  }, 10000);

  it("removes available activity directly from state", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addActivity({
        title: "Available Activity",
        description: "",
        energyCost: { physical: 10, social: 10, executive: 10 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const activityId = result.current.oneOffActivities[0].id;
    expect(result.current.oneOffActivities).toHaveLength(1);

    await act(async () => {
      await result.current.removeActivity(activityId);
    });

    expect(result.current.oneOffActivities).toHaveLength(0);
  });

  it("handles moving unplanned activity from date with no plan gracefully", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await act(async () => {
      await result.current.moveActivityToUnplanned(
        "nonexistent-instance",
        "2099-01-01",
      );
    });

    expect(result.current.oneOffActivities).toHaveLength(0);
  });

  it("checks capacity returns exceeded: false when within limits", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setDailyCapacity({
        physical: 50,
        social: 50,
        executive: 50,
      });
    });

    act(() => {
      result.current.addActivity({
        title: "Small Activity",
        description: "",
        energyCost: { physical: 10, social: 10, executive: 10 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const activityId = result.current.oneOffActivities[0].id;
    await act(async () => {
      await result.current.addToPlan(activityId);
    });

    const status = result.current.checkExceedsCapacity();
    expect(status.exceeded).toBe(false);
  });

  it("removes projected repeating activity from today when nextDueDate is changed to a future date", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const today = result.current.currentDate;

    act(() => {
      result.current.addActivity({
        title: "Daily Standup",
        description: "",
        energyCost: { physical: 5, social: 10, executive: 5 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
        repeatConfig: {
          frequency: 1,
          unit: "days",
          nextDueDate: today,
        },
      });
    });

    // The repeating activity should be projected on today's plan
    await waitFor(() => {
      const projected = result.current.dayPlan.plannedInstances.find(
        (i) =>
          i.sourceActivityId ===
          result.current.repeatingActivities.find(
            (a) => a.title === "Daily Standup",
          )?.id,
      );
      expect(projected).toBeDefined();
    });

    const standupActivity = result.current.repeatingActivities.find(
      (a) => a.title === "Daily Standup",
    );
    if (!standupActivity) throw new Error("Standup activity not found");

    // Now edit the activity to change nextDueDate to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    act(() => {
      result.current.updateActivity({
        ...standupActivity,
        repeatConfig: {
          frequency: 1,
          unit: "days",
          nextDueDate: tomorrowStr,
        },
      });
    });

    // The activity should no longer appear in today's plan
    await waitFor(() => {
      const remaining = result.current.dayPlan.plannedInstances.find(
        (i) => i.sourceActivityId === standupActivity.id,
      );
      expect(remaining).toBeUndefined();
    });

    const updatedRepeating = result.current.repeatingActivities.find(
      (a) => a.title === "Daily Standup",
    );
    expect(updatedRepeating).toBeDefined();
    expect(updatedRepeating?.repeatConfig?.nextDueDate).toBe(tomorrowStr);

    await act(async () => {
      result.current.navigateToDate(tomorrowStr);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.currentDate).toBe(tomorrowStr);
    });

    const tomorrowInstance = result.current.dayPlan.plannedInstances.find(
      (i) => i.sourceActivityId === standupActivity.id,
    );
    expect(tomorrowInstance).toBeDefined();
  }, 10000);

  it("moves activity instance to a specific date", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addActivity({
        title: "To Be Moved",
        description: "",
        energyCost: { physical: 10, social: 10, executive: 10 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      });
    });

    const activityId = result.current.oneOffActivities[0].id;

    await act(async () => {
      await result.current.addToPlan(activityId);
    });

    const instanceId = result.current.dayPlan.plannedInstances.find(
      (i) => i.sourceActivityId === activityId,
    )?.id;
    if (!instanceId) throw new Error("Instance not found");

    expect(
      result.current.dayPlan.plannedInstances.some((i) => i.id === instanceId),
    ).toBe(true);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    await act(async () => {
      await result.current.moveActivityToDate(instanceId, tomorrowStr);
    });

    expect(
      result.current.dayPlan.plannedInstances.some((i) => i.id === instanceId),
    ).toBe(false);

    await act(async () => {
      result.current.navigateToDate(tomorrowStr);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.currentDate).toBe(tomorrowStr);
    });

    await waitFor(() => {
      const movedInstance = result.current.dayPlan.plannedInstances.find(
        (i) => i.sourceActivityId === activityId,
      );
      expect(movedInstance).toBeDefined();
    });
  });
});
