import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@/lib/energy-planner/schema";
import { useActivities } from "./useActivities";

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

  it("converts one-off activity to repeating via updateActivity", async () => {
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
      });
    });

    expect(result.current.oneOffActivities).toHaveLength(1);
    expect(result.current.repeatingActivities).toHaveLength(0);

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

  it("converts repeating activity to one-off via updateActivity", async () => {
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
      });
    });

    expect(result.current.repeatingActivities).toHaveLength(1);

    act(() => {
      const { repeatConfig: _, ...oneOffData } = addedActivity;
      result.current.updateActivity(oneOffData as Activity);
    });

    expect(result.current.repeatingActivities).toHaveLength(0);
    expect(result.current.oneOffActivities).toHaveLength(1);
    expect(result.current.oneOffActivities[0].title).toBe("Repeating");
  });

  it("removes activities from the unified store", async () => {
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
    expect(result.current.activities).toHaveLength(0);
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
      });
    });

    act(() => {
      result.current.updateActivity({ ...oneOff, title: "O-up" });
      result.current.updateActivity({ ...repeating, title: "R-up" });
    });

    expect(result.current.oneOffActivities[0].title).toBe("O-up");
    expect(result.current.repeatingActivities[0].title).toBe("R-up");
  });

  it("derives oneOffActivities and repeatingActivities from single store", async () => {
    const { result } = renderHook(() => useActivities());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.addActivity({
        title: "One-off A",
        energyCost: {},
        factors: {
          initiationDifficulty: 0,
          terminationDifficulty: 0,
          isRestorative: false,
        },
      });
      result.current.addActivity({
        title: "Repeating A",
        energyCost: {},
        factors: {
          initiationDifficulty: 0,
          terminationDifficulty: 0,
          isRestorative: false,
        },
        repeatConfig: { frequency: 1, unit: "days" },
      });
      result.current.addActivity({
        title: "One-off B",
        energyCost: {},
        factors: {
          initiationDifficulty: 0,
          terminationDifficulty: 0,
          isRestorative: false,
        },
      });
    });

    expect(result.current.activities).toHaveLength(3);
    expect(result.current.oneOffActivities).toHaveLength(2);
    expect(result.current.repeatingActivities).toHaveLength(1);
    expect(result.current.oneOffActivities.every((a) => !a.repeatConfig)).toBe(
      true,
    );
    expect(
      result.current.repeatingActivities.every((a) => !!a.repeatConfig),
    ).toBe(true);
  });
});
