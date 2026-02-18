import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as storageMock from "@/lib/energy-planner/storage";
import { useEnergyPlannerState } from "./useEnergyPlannerState";

// Manual mock is picked up automatically by vitest given the __mocks__ folder
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
      physical: 50,
      social: 50,
      executive: 50,
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
        completed: false,
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
        completed: false,
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
        completed: false,
      });
    });

    const activityId = result.current.oneOffActivities[0].id;

    // Wait for persistence
    await waitFor(async () => {
      const stored = await storageMock.fetchOneOffActivities();
      expect(stored).toHaveLength(1);
    });

    await act(async () => {
      await result.current.addToPlan(activityId);
    });

    expect(
      result.current.dayPlan.activities.some((a) => a.id === activityId),
    ).toBe(true);

    await act(async () => {
      await result.current.removeActivity(activityId);
    });

    expect(result.current.oneOffActivities).toHaveLength(0);
    expect(
      result.current.dayPlan.activities.some((a) => a.id === activityId),
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
        completed: false,
      });
    });

    const activityId = result.current.oneOffActivities[0].id;

    // Wait for persistence
    await waitFor(async () => {
      const stored = await storageMock.fetchOneOffActivities();
      expect(stored).toHaveLength(1);
    });

    await act(async () => {
      await result.current.addToPlan(activityId);
    });

    expect(
      result.current.dayPlan.activities.some((a) => a.id === activityId),
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
        completed: false,
      });
    });

    const activityId = result.current.oneOffActivities[0].id;

    // Wait for persistence
    await waitFor(async () => {
      const stored = await storageMock.fetchOneOffActivities();
      expect(stored).toHaveLength(1);
    });

    await act(async () => {
      await result.current.addToPlan(activityId);
    });

    await act(async () => {
      await result.current.removeFromPlan(activityId);
    });

    expect(
      result.current.dayPlan.activities.some((a) => a.id === activityId),
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
        completed: false,
      });
    });

    const activityId = result.current.oneOffActivities[0].id;

    await waitFor(async () => {
      const stored = await storageMock.fetchOneOffActivities();
      expect(stored).toHaveLength(1);
    });

    await act(async () => {
      await result.current.addToPlan(activityId);
    });

    await act(async () => {
      result.current.toggleActivityCompletion(activityId);
    });

    expect(
      result.current.dayPlan.activities.find((a) => a.id === activityId)
        ?.completed,
    ).toBe(true);

    await act(async () => {
      result.current.toggleActivityCompletion(activityId);
    });

    expect(
      result.current.dayPlan.activities.find((a) => a.id === activityId)
        ?.completed,
    ).toBe(false);
  }, 5000);

  it("calculates energy usage and warns when capacity exceeded", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      // Set capacity low to trigger warning
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
        completed: false,
      });
    });

    const activityId = result.current.oneOffActivities[0].id;

    await waitFor(async () => {
      const stored = await storageMock.fetchOneOffActivities();
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
    expect(warning.message).toContain("Physical");
    expect(warning.message).toContain("Social");
    expect(warning.message).toContain("Executive");
  });

  it("should move activity back to available when unplanned from current day", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Create and plan an activity
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
        completed: false,
      });
    });

    const activityId = result.current.oneOffActivities[0].id;

    await waitFor(async () => {
      const stored = await storageMock.fetchOneOffActivities();
      expect(stored).toHaveLength(1);
    });

    await act(async () => {
      result.current.addToPlan(activityId);
    });

    // Activity should be in day plan and not in available activities
    expect(
      result.current.dayPlan.activities.some((a) => a.id === activityId),
    ).toBe(true);
    expect(
      result.current.availableActivities.some((a) => a.id === activityId),
    ).toBe(false);

    // Unplan the activity
    await act(async () => {
      await result.current.moveActivityToUnplanned(
        activityId,
        result.current.currentDate,
      );
    });

    // Activity should be back in available activities and not in day plan
    await waitFor(() => {
      expect(
        result.current.availableActivities.some((a) => a.id === activityId),
      ).toBe(true);
    });
    expect(
      result.current.dayPlan.activities.some((a) => a.id === activityId),
    ).toBe(false);
  }, 10000);

  it("should move activity back to available when unplanned from PAST day", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Setup an activity on a past day directly in storage
    const pastDate = "2025-01-01";
    const activityId = "past-activity-id";
    const pastActivity = {
      id: activityId,
      title: "Past Activity",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 1,
        terminationDifficulty: 1,
        isRestorative: false,
      },
      createdAt: new Date(),
      completed: false,
    };

    await storageMock.storeDayPlan(pastDate, {
      date: pastDate,
      activities: [pastActivity],
      dailyCapacity: { physical: 50, social: 50, executive: 50 },
    });

    // Initially activity is not in available activities
    expect(result.current.oneOffActivities).toHaveLength(0);

    // Unplan the activity from the past date
    await act(async () => {
      await result.current.moveActivityToUnplanned(activityId, pastDate);
    });

    // Activity should be back in available activities
    await waitFor(() => {
      expect(
        result.current.availableActivities.some((a) => a.id === activityId),
      ).toBe(true);
    });
  });

  it("removes available activity directly from state", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Add an activity (goes to available activities)
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
        completed: false,
      });
    });

    const activityId = result.current.oneOffActivities[0].id;
    expect(result.current.oneOffActivities).toHaveLength(1);

    // Remove the activity
    await act(async () => {
      await result.current.removeActivity(activityId);
    });

    expect(result.current.oneOffActivities).toHaveLength(0);
  });

  it("handles moving unplanned activity from date with no plan gracefully", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    // Call with a date that has no plan in storage
    await act(async () => {
      await result.current.moveActivityToUnplanned("2099-01-01", "2099-01-01");
    });

    // Should not crash, and should not add anything to available activities
    expect(result.current.oneOffActivities).toHaveLength(0);
  });

  it("checks capacity returns exceeded: false when within limits", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Default capacity is 50,50,50.
    // Add a small activity
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
        completed: false,
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

    // Create a repeating activity starting today
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
        completed: false,
        repeatConfig: {
          frequency: 1,
          unit: "days",
          nextDueDate: today,
        },
      });
    });

    // The repeating activity should be projected on today's plan
    await waitFor(() => {
      const projected = result.current.dayPlan.activities.find(
        (a) => a.title === "Daily Standup",
      );
      expect(projected).toBeDefined();
    });

    const projectedActivity = result.current.dayPlan.activities.find(
      (a) => a.title === "Daily Standup",
    );
    expect(projectedActivity).toBeDefined();
    // biome-ignore lint/style/noNonNullAssertion: Test will fail if this is null, detecting the issue
    expect(projectedActivity!.id).toMatch(/^virtual-/);

    // Now edit the activity to change nextDueDate to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    act(() => {
      result.current.updateActivity({
        // biome-ignore lint/style/noNonNullAssertion: Test will fail if this is null, detecting the issue
        ...projectedActivity!,
        repeatConfig: {
          frequency: 1,
          unit: "days",
          // biome-ignore lint/style/noNonNullAssertion: Test will fail if this is null, detecting the issue
          ...projectedActivity!.repeatConfig,
          nextDueDate: tomorrowStr,
        },
      });
    });

    // The activity should no longer appear in today's plan
    await waitFor(() => {
      const remaining = result.current.dayPlan.activities.find(
        (a) => a.title === "Daily Standup",
      );
      expect(remaining).toBeUndefined();
    });

    // The repeating activity should have the updated nextDueDate
    const updatedRepeating = result.current.repeatingActivities.find(
      (a) => a.title === "Daily Standup",
    );
    expect(updatedRepeating).toBeDefined();
    expect(updatedRepeating?.repeatConfig?.nextDueDate).toBe(tomorrowStr);

    // Navigate to tomorrow and verify the activity appears there
    await act(async () => {
      result.current.navigateToDate(tomorrowStr);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.currentDate).toBe(tomorrowStr);
    });

    const tomorrowActivity = result.current.dayPlan.activities.find(
      (a) => a.title === "Daily Standup",
    );
    expect(tomorrowActivity).toBeDefined();
  }, 10000);

  it("moves activity to a specific date", async () => {
    const { result } = renderHook(() => useEnergyPlannerState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Create and plan an activity
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
        completed: false,
      });
    });

    const activityId = result.current.oneOffActivities[0].id;

    await act(async () => {
      await result.current.addToPlan(activityId);
    });

    // Verify it's in today's plan
    expect(
      result.current.dayPlan.activities.some((a) => a.id === activityId),
    ).toBe(true);

    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Move to tomorrow
    await act(async () => {
      await result.current.moveActivityToDate(activityId, tomorrowStr);
    });

    // Verify removed from today
    expect(
      result.current.dayPlan.activities.some((a) => a.id === activityId),
    ).toBe(false);

    // Navigate to tomorrow and verify it's there
    await act(async () => {
      result.current.navigateToDate(tomorrowStr);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.currentDate).toBe(tomorrowStr);
    });

    // Wait for the new date's plan to load and check for the activity
    await waitFor(() => {
      const movedActivity = result.current.dayPlan.activities.find(
        (a) => a.title === "To Be Moved",
      );
      expect(movedActivity).toBeDefined();
      // ID should be different
      expect(movedActivity?.id).not.toBe(activityId);
    });
  });
});
