import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@/lib/energy-planner/schema";
import { useActivities } from "./useActivities";

// Reuse the manual mock from storage
vi.mock("@/lib/energy-planner/storage");

const newRepeatingActivity = {
  title: "Rep Activity",
  energyCost: {},
  factors: {
    initiationDifficulty: 0,
    terminationDifficulty: 0,
    isRestorative: false,
  },
  repeatConfig: { frequency: 1, unit: "days" },
  completed: false,
} as const;

describe("useActivities", () => {
  beforeEach(async () => {
    const storageMock = await import("@/lib/energy-planner/storage");
    (storageMock as unknown as { __reset: () => void }).__reset();
  });

  it("initializes empty", async () => {
    const { result } = renderHook(() => useActivities());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.oneOffActivities).toEqual([]);
    expect(result.current.repeatingActivities).toEqual([]);
  });

  it("adds and updates a repeating activity", async () => {
    const { result } = renderHook(() => useActivities());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let addedActivity: Activity;

    act(() => {
      addedActivity = result.current.addActivity(newRepeatingActivity);
    });

    expect(result.current.repeatingActivities).toHaveLength(1);
    expect(result.current.repeatingActivities[0].title).toBe("Rep Activity");

    // Update
    act(() => {
      result.current.updateActivity({
        ...addedActivity,
        title: "Rep Activity Updated",
      });
    });

    expect(result.current.repeatingActivities).toHaveLength(1);
    expect(result.current.repeatingActivities[0].title).toBe(
      "Rep Activity Updated",
    );
  });

  it("handles adding activity back to available (repeating)", async () => {
    const { result } = renderHook(() => useActivities());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.addActivity(newRepeatingActivity);
    });

    // Try to add back to available
    act(() => {
      result.current.addActivityToAvailable({
        ...newRepeatingActivity,
        id: "123",
        createdAt: new Date(),
      });
    });

    // Should not duplicate
    expect(result.current.repeatingActivities).toHaveLength(1);
  });

  it("converts one-off activity to repeating", async () => {
    const { result } = renderHook(() => useActivities());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let addedActivity: Activity;
    act(() => {
      addedActivity = result.current.addActivity({
        title: "One-Off",
        energyCost: {},
        factors: {
          initiationDifficulty: 0,
          terminationDifficulty: 0,
          isRestorative: false,
        },
        completed: false,
      });
    });

    expect(result.current.oneOffActivities).toHaveLength(1);
    expect(result.current.repeatingActivities).toHaveLength(0);

    // Convert to repeating
    act(() => {
      result.current.updateActivity({
        ...addedActivity,
        repeatConfig: { frequency: 1, unit: "days" },
      });
    });

    expect(result.current.oneOffActivities).toHaveLength(0);
    expect(result.current.repeatingActivities).toHaveLength(1);
    expect(result.current.repeatingActivities[0].title).toBe("One-Off");
  });

  it("converts repeating activity to one-off", async () => {
    const { result } = renderHook(() => useActivities());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let addedActivity: Activity;
    act(() => {
      addedActivity = result.current.addActivity({
        title: "Repeating",
        energyCost: {},
        factors: {
          initiationDifficulty: 0,
          terminationDifficulty: 0,
          isRestorative: false,
        },
        repeatConfig: { frequency: 1, unit: "days" },
        completed: false,
      });
    });

    expect(result.current.repeatingActivities).toHaveLength(1);

    // Convert to one-off
    act(() => {
      const { repeatConfig: _, ...oneOffData } = addedActivity;
      result.current.updateActivity(oneOffData as Activity);
    });

    expect(result.current.repeatingActivities).toHaveLength(0);
    expect(result.current.oneOffActivities).toHaveLength(1);
    expect(result.current.oneOffActivities[0].title).toBe("Repeating");
  });

  it("removes activity state from both lists", async () => {
    const { result } = renderHook(() => useActivities());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.addActivity({
        title: "One-off",
        energyCost: {},
        factors: {
          initiationDifficulty: 0,
          terminationDifficulty: 0,
          isRestorative: false,
        },
        completed: false,
      });
      result.current.addActivity({
        title: "Repeating",
        energyCost: {},
        factors: {
          initiationDifficulty: 0,
          terminationDifficulty: 0,
          isRestorative: false,
        },
        repeatConfig: { frequency: 1, unit: "days" },
        completed: false,
      });
    });

    const id1 = result.current.oneOffActivities[0].id;
    const id2 = result.current.repeatingActivities[0].id;

    act(() => {
      result.current.removeActivityState(id1);
      result.current.removeActivityState(id2);
    });

    expect(result.current.oneOffActivities).toHaveLength(0);
    expect(result.current.repeatingActivities).toHaveLength(0);
  });

  it("handles addActivityToAvailable correctly", async () => {
    const { result } = renderHook(() => useActivities());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const oneOff: Activity = {
      id: "1",
      title: "O",
      energyCost: {},
      factors: {
        initiationDifficulty: 0,
        terminationDifficulty: 0,
        isRestorative: false,
      },
      createdAt: new Date(),
      completed: false,
    };
    const repeating: Activity = {
      id: "2",
      title: "R",
      energyCost: {},
      factors: {
        initiationDifficulty: 0,
        terminationDifficulty: 0,
        isRestorative: false,
      },
      repeatConfig: { frequency: 1, unit: "days" },
      createdAt: new Date(),
      completed: false,
    };

    act(() => {
      result.current.addActivityToAvailable(oneOff);
      result.current.addActivityToAvailable(repeating);
    });

    expect(result.current.oneOffActivities).toHaveLength(1);
    expect(result.current.repeatingActivities).toHaveLength(0);
  });

  it("handles removeActivityFromAvailable", async () => {
    const { result } = renderHook(() => useActivities());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.addActivity({
        title: "One-off",
        energyCost: {},
        factors: {
          initiationDifficulty: 0,
          terminationDifficulty: 0,
          isRestorative: false,
        },
        completed: false,
      });
    });

    const id = result.current.oneOffActivities[0].id;

    act(() => {
      result.current.removeActivityFromAvailable(id);
    });

    expect(result.current.oneOffActivities).toHaveLength(0);
  });

  it("updates existing activities in their respective lists", async () => {
    const { result } = renderHook(() => useActivities());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let oneOff: Activity;
    let repeating: Activity;

    act(() => {
      oneOff = result.current.addActivity({
        title: "O",
        energyCost: {},
        factors: {
          initiationDifficulty: 0,
          terminationDifficulty: 0,
          isRestorative: false,
        },
        completed: false,
      });
      repeating = result.current.addActivity({
        title: "R",
        energyCost: {},
        factors: {
          initiationDifficulty: 0,
          terminationDifficulty: 0,
          isRestorative: false,
        },
        repeatConfig: { frequency: 1, unit: "days" },
        completed: false,
      });
    });

    act(() => {
      result.current.updateActivity({ ...oneOff, title: "O-up" });
      result.current.updateActivity({ ...repeating, title: "R-up" });
    });

    expect(result.current.oneOffActivities[0].title).toBe("O-up");
    expect(result.current.repeatingActivities[0].title).toBe("R-up");
  });
});
