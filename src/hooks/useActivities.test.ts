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
});
