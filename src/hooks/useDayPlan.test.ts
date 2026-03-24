import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@/lib/energy-planner/schema";
import { fetchDayPlan, storeDayPlan } from "@/lib/energy-planner/storage";
import { useDayPlan } from "./useDayPlan";
import { getNextDay, getTodayDateString } from "./utils";

vi.mock("@/lib/energy-planner/storage");

const mockActivity = (id: string, title: string): Activity => ({
  id,
  title,
  createdAt: new Date(),
  energyCost: { physical: 10, social: 10, executive: 10 },
  factors: {
    initiationDifficulty: 3,
    terminationDifficulty: 3,
    isRestorative: false,
  },
});

describe("useDayPlan", () => {
  beforeEach(async () => {
    const storageMock = await import("@/lib/energy-planner/storage");
    (storageMock as unknown as { __reset: () => void }).__reset();
  });

  const STABLE_EMPTY_ACTIVITIES: Activity[] = [];

  it("initializes with today's date and empty instances", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dayPlan.date).toBe(todayStr);
    expect(result.current.dayPlan.plannedInstances).toEqual([]);
  });

  it("loads day plan from IndexedDB if date matches today", async () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    await storeDayPlan(todayStr, {
      date: todayStr,
      plannedInstances: [
        { id: "instance-1", sourceActivityId: "activity-1", completed: true },
        { id: "instance-2", sourceActivityId: "activity-2", completed: false },
      ],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dayPlan.plannedInstances).toHaveLength(2);
    expect(result.current.dayPlan.plannedInstances[0].id).toBe("instance-1");
    expect(result.current.dayPlan.plannedInstances[0].completed).toBe(true);
    expect(result.current.dayPlan.plannedInstances[1].id).toBe("instance-2");
    expect(result.current.dayPlan.plannedInstances[1].completed).toBe(false);
  });

  it("navigates to previous day and keeps that day's plan separate", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const activity1 = mockActivity("activity-1", "Activity 1");

    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
    });

    await act(async () => {
      result.current.goToPreviousDay();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.dayPlan.date).not.toBe(todayStr);
    });

    expect(result.current.dayPlan.plannedInstances).toHaveLength(0);
  });

  it("adds an activity to the plan", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const activity1 = mockActivity("activity-1", "Activity 1");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
    });

    expect(result.current.dayPlan.plannedInstances).toHaveLength(1);
    expect(result.current.dayPlan.plannedInstances[0].sourceActivityId).toBe(
      "activity-1",
    );
  });

  it("does not duplicate activity when added twice", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const activity1 = mockActivity("activity-1", "Activity 1");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
      result.current.addActivityToDayPlan(activity1);
    });

    expect(result.current.dayPlan.plannedInstances).toHaveLength(1);
  });

  it("removes an activity from the plan", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const activity1 = mockActivity("activity-1", "Activity 1");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
    });

    const instanceId = result.current.dayPlan.plannedInstances[0].id;

    await act(async () => {
      result.current.removeFromPlan(instanceId);
    });

    expect(result.current.dayPlan.plannedInstances).toHaveLength(0);
  });

  it("toggles activity completion on", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const activity1 = mockActivity("activity-1", "Activity 1");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
    });

    const instanceId = result.current.dayPlan.plannedInstances[0].id;

    await act(async () => {
      result.current.toggleActivityCompletion(instanceId);
    });

    expect(result.current.dayPlan.plannedInstances[0].completed).toBe(true);
  });

  it("toggles activity completion off", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const activity1 = mockActivity("activity-1", "Activity 1");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
    });

    const instanceId = result.current.dayPlan.plannedInstances[0].id;

    await act(async () => {
      result.current.toggleActivityCompletion(instanceId); // on
    });

    expect(result.current.dayPlan.plannedInstances[0].completed).toBe(true);

    await act(async () => {
      result.current.toggleActivityCompletion(instanceId); // off
    });

    expect(result.current.dayPlan.plannedInstances[0].completed).toBe(false);
  });

  it("toggles completion for only the specified instance", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const activity1 = mockActivity("activity-1", "Activity 1");
    const activity2 = mockActivity("activity-2", "Activity 2");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
      result.current.addActivityToDayPlan(activity2);
    });

    const instance1Id = result.current.dayPlan.plannedInstances.find(
      (i) => i.sourceActivityId === "activity-1",
    )?.id;
    if (!instance1Id) throw new Error("Missing instance for activity-1");

    await act(async () => {
      result.current.toggleActivityCompletion(instance1Id);
    });

    const i1 = result.current.dayPlan.plannedInstances.find(
      (i) => i.sourceActivityId === "activity-1",
    );
    const i2 = result.current.dayPlan.plannedInstances.find(
      (i) => i.sourceActivityId === "activity-2",
    );

    expect(i1?.completed).toBe(true);
    expect(i2?.completed).toBe(false);
  });

  it("persists day plan to IndexedDB", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const activity1 = mockActivity("activity-1", "Activity 1");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
    });

    await waitFor(async () => {
      const stored = await fetchDayPlan(todayStr);
      expect(stored).not.toBeNull();
      expect(stored?.plannedInstances).toHaveLength(1);
      expect(stored?.plannedInstances?.[0].sourceActivityId).toBe("activity-1");
    });
  });

  it("reorders planned activities", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const activity1 = mockActivity("activity-1", "Activity 1");
    const activity2 = mockActivity("activity-2", "Activity 2");
    const activity3 = mockActivity("activity-3", "Activity 3");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
      result.current.addActivityToDayPlan(activity2);
      result.current.addActivityToDayPlan(activity3);
    });

    const [id1, id2, id3] = result.current.dayPlan.plannedInstances.map(
      (i) => i.id,
    );

    await act(async () => {
      result.current.reorderPlannedActivities([id3, id1, id2]);
    });

    expect(result.current.dayPlan.plannedInstances.map((i) => i.id)).toEqual([
      id3,
      id1,
      id2,
    ]);
  });

  it("marks an activity from a past day as complete", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const pastDate = "2023-01-01";

    await storeDayPlan(pastDate, {
      date: pastDate,
      plannedInstances: [
        {
          id: "instance-past",
          sourceActivityId: "activity-1",
          completed: false,
        },
      ],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.markActivityCompleteOnDate(
        "instance-past",
        pastDate,
      );
    });

    const stored = await fetchDayPlan(pastDate);
    expect(stored?.plannedInstances[0].completed).toBe(true);
  });

  it("moves an instance from a past day to today", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const pastDate = "2023-01-01";

    await storeDayPlan(pastDate, {
      date: pastDate,
      plannedInstances: [
        {
          id: "instance-past",
          sourceActivityId: "activity-1",
          completed: false,
        },
      ],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.moveActivityToToday("instance-past", pastDate);
    });

    const pastStored = await fetchDayPlan(pastDate);
    expect(pastStored?.plannedInstances).toHaveLength(0);

    expect(result.current.dayPlan.plannedInstances).toHaveLength(1);
    expect(result.current.dayPlan.plannedInstances[0].id).toBe("instance-past");
  });

  it("moves an instance from a past day to unplanned (removes from day plan and returns it)", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const pastDate = "2023-01-01";

    await storeDayPlan(pastDate, {
      date: pastDate,
      plannedInstances: [
        {
          id: "instance-past",
          sourceActivityId: "activity-1",
          completed: false,
        },
      ],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let removedInstance: unknown;
    await act(async () => {
      removedInstance = await result.current.moveActivityToUnplanned(
        "instance-past",
        pastDate,
      );
    });

    const pastStored = await fetchDayPlan(pastDate);
    expect(pastStored?.plannedInstances).toHaveLength(0);

    expect(removedInstance).toBeDefined();
    expect((removedInstance as { id: string }).id).toBe("instance-past");
  });

  it("moves an instance from the current day to unplanned", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const activity1 = mockActivity("activity-1", "Activity 1");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
    });

    const instanceId = result.current.dayPlan.plannedInstances[0].id;

    await act(async () => {
      const today = result.current.currentDate;
      await result.current.moveActivityToUnplanned(instanceId, today);
    });

    expect(result.current.dayPlan.plannedInstances).toHaveLength(0);
  });

  it("assigns instance to a zone", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const activity1 = mockActivity("activity-1", "Activity 1");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
    });

    const instanceId = result.current.dayPlan.plannedInstances[0].id;

    await act(async () => {
      result.current.assignActivityToZone(instanceId, "evening");
    });

    expect(result.current.dayPlan.plannedInstances[0].zoneId).toBe("evening");
  });

  it("projects repeating activity with real UUID (not virtual ID)", async () => {
    const today = new Date().toISOString().split("T")[0];
    const repeatingActivity = {
      ...mockActivity("rep-1", "Repeating Activity"),
      repeatConfig: { frequency: 1, unit: "days", nextDueDate: today },
    } as const;
    const stableList = [repeatingActivity];

    const { result } = renderHook(() => useDayPlan(stableList));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const projectedInstance = result.current.dayPlan.plannedInstances.find(
      (i) => i.sourceActivityId === "rep-1",
    );
    expect(projectedInstance).toBeDefined();
    expect(projectedInstance?.isProjected).toBe(true);
    // Must be a real UUID, not a virtual-* ID
    expect(projectedInstance?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("assigns zone to projected instance without changing its ID", async () => {
    const today = new Date().toISOString().split("T")[0];
    const repeatingActivity = {
      ...mockActivity("rep-1", "Repeating Activity"),
      repeatConfig: { frequency: 1, unit: "days", nextDueDate: today },
    } as const;
    const stableList = [repeatingActivity];

    const { result } = renderHook(() => useDayPlan(stableList));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const projectedInstance = result.current.dayPlan.plannedInstances.find(
      (i) => i.sourceActivityId === "rep-1",
    );
    expect(projectedInstance).toBeDefined();
    if (!projectedInstance) throw new Error("Projected instance missing");
    const originalId = projectedInstance.id;

    await act(async () => {
      result.current.assignActivityToZone(originalId, "morning");
    });

    const solidInstance = result.current.dayPlan.plannedInstances.find(
      (i) => i.sourceActivityId === "rep-1",
    );
    expect(solidInstance).toBeDefined();
    expect(solidInstance?.id).toBe(originalId); // ID does NOT change
    expect(solidInstance?.isProjected).toBeUndefined(); // No longer projected
    expect(solidInstance?.zoneId).toBe("morning");
  });

  it("projects repeating activities with their default zone", async () => {
    const today = new Date().toISOString().split("T")[0];
    const repeatingActivity = {
      ...mockActivity("rep-zone", "Repeating with Zone"),
      repeatConfig: {
        frequency: 1,
        unit: "days",
        nextDueDate: today,
        defaultZoneId: "afternoon",
      },
    } as const;
    const stableList = [repeatingActivity];

    const { result } = renderHook(() => useDayPlan(stableList));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const projectedInstance = result.current.dayPlan.plannedInstances.find(
      (i) => i.sourceActivityId === "rep-zone",
    );
    expect(projectedInstance).toBeDefined();
    expect(projectedInstance?.zoneId).toBe("afternoon");
  });

  it("completing a projected instance solidifies it and advances nextDueDate", async () => {
    const today = new Date().toISOString().split("T")[0];
    const repeatingActivity = {
      ...mockActivity("rep-2", "Repeating Activity 2"),
      repeatConfig: { frequency: 1, unit: "days", nextDueDate: today },
    } as const;
    const stableList = [repeatingActivity];
    const mockOnUpdateActivity = vi.fn();

    const { result } = renderHook(() =>
      useDayPlan(stableList, mockOnUpdateActivity),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const projectedInstance = result.current.dayPlan.plannedInstances.find(
      (i) => i.sourceActivityId === "rep-2",
    );
    expect(projectedInstance).toBeDefined();
    expect(projectedInstance?.isProjected).toBe(true);

    await act(async () => {
      result.current.toggleActivityCompletion(projectedInstance?.id ?? "");
    });

    await waitFor(() => {
      const instance = result.current.dayPlan.plannedInstances.find(
        (i) => i.sourceActivityId === "rep-2",
      );
      expect(instance).toBeDefined();
      expect(instance?.completed).toBe(true);
      expect(instance?.isProjected).toBeUndefined();
    });

    expect(mockOnUpdateActivity).toHaveBeenCalled();
  });

  it("marks an activity as complete on the current day", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const activity1 = mockActivity("activity-1", "Activity 1");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
    });

    const instanceId = result.current.dayPlan.plannedInstances[0].id;
    const today = result.current.currentDate;

    await act(async () => {
      await result.current.markActivityCompleteOnDate(instanceId, today);
    });

    expect(result.current.dayPlan.plannedInstances[0].completed).toBe(true);
  });

  describe("Repeating Activity Logic Coverage", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("projects weekly activities", async () => {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const activity = {
        ...mockActivity("rep-week", "Weekly Activity"),
        repeatConfig: { frequency: 1, unit: "weeks", nextDueDate: todayStr },
      } as const;
      const stableList = [activity];

      const { result } = renderHook(() => useDayPlan(stableList));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.dayPlan.plannedInstances).toHaveLength(1);

      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split("T")[0];

      await act(async () => {
        result.current.navigateToDate(nextWeekStr);
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.dayPlan.plannedInstances).toHaveLength(1);
      expect(result.current.dayPlan.plannedInstances[0].sourceActivityId).toBe(
        "rep-week",
      );
    });

    it("projects monthly activities", async () => {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const activity = {
        ...mockActivity("rep-month", "Monthly Activity"),
        repeatConfig: { frequency: 1, unit: "months", nextDueDate: todayStr },
      } as const;
      const stableList = [activity];

      const { result } = renderHook(() => useDayPlan(stableList));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      const nextMonthStr = nextMonth.toISOString().split("T")[0];

      await act(async () => {
        result.current.navigateToDate(nextMonthStr);
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.dayPlan.plannedInstances).toHaveLength(1);
      expect(result.current.dayPlan.plannedInstances[0].sourceActivityId).toBe(
        "rep-month",
      );
    });

    it("projects yearly activities", async () => {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const activity = {
        ...mockActivity("rep-year", "Yearly Activity"),
        repeatConfig: { frequency: 1, unit: "years", nextDueDate: todayStr },
      } as const;
      const stableList = [activity];

      const { result } = renderHook(() => useDayPlan(stableList));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const nextYear = new Date(today);
      nextYear.setFullYear(today.getFullYear() + 1);
      const nextYearStr = nextYear.toISOString().split("T")[0];

      await act(async () => {
        result.current.navigateToDate(nextYearStr);
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.dayPlan.plannedInstances).toHaveLength(1);
      expect(result.current.dayPlan.plannedInstances[0].sourceActivityId).toBe(
        "rep-year",
      );
    });

    it("skips a repeating activity and advances nextDueDate", async () => {
      const today = new Date().toISOString().split("T")[0];
      const activity = {
        ...mockActivity("rep-skip", "Skippable Activity"),
        repeatConfig: { frequency: 1, unit: "days", nextDueDate: today },
      } as const;
      const stableList = [activity];
      const mockOnUpdateActivity = vi.fn();

      const { result } = renderHook(() =>
        useDayPlan(stableList, mockOnUpdateActivity),
      );
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const projected = result.current.dayPlan.plannedInstances.find(
        (i) => i.sourceActivityId === "rep-skip",
      );

      expect(projected).toBeDefined();
      if (!projected) throw new Error("No projected instance found");

      expect(projected.isProjected).toBe(true);

      await act(async () => {
        result.current.skipActivity(projected.id);
      });

      expect(mockOnUpdateActivity).toHaveBeenCalled();
      const updatedActivity = mockOnUpdateActivity.mock.calls[0][0];

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      expect(updatedActivity.repeatConfig.nextDueDate).toBe(tomorrowStr);

      const remaining = result.current.dayPlan.plannedInstances.find(
        (i) => i.id === projected.id,
      );
      expect(remaining).toBeUndefined();
    });

    it("projected instances maintain user-selected order across navigation away and back", async () => {
      // Regression: projected instances got a new random UUID on every load, so
      // activityOrder entries never matched them — they were always appended at
      // the end regardless of user-configured position. Now they use a
      // deterministic ID (uuidv5 keyed on sourceActivityId + date) so order
      // survives reloads.
      //
      // Two of each type are interleaved (p1, o1, p2, o2) to prevent the test
      // from passing accidentally because one type happens to default to last.
      const today = new Date().toISOString().split("T")[0];
      const rep1 = {
        ...mockActivity("rep-order-1", "Repeating 1"),
        repeatConfig: { frequency: 1, unit: "days", nextDueDate: today },
      } as const;
      const rep2 = {
        ...mockActivity("rep-order-2", "Repeating 2"),
        repeatConfig: { frequency: 1, unit: "days", nextDueDate: today },
      } as const;
      const oneOff1 = mockActivity("oneoff-order-1", "One-off 1");
      const oneOff2 = mockActivity("oneoff-order-2", "One-off 2");
      const stableList = [rep1, rep2];

      const { result } = renderHook(() => useDayPlan(stableList));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Add one-offs; both projected repeating instances are already present
      await act(async () => {
        result.current.addActivityToDayPlan(oneOff1);
        result.current.addActivityToDayPlan(oneOff2);
      });

      const getId = (sourceId: string) =>
        result.current.dayPlan.plannedInstances.find(
          (i) => i.sourceActivityId === sourceId,
        )?.id;

      const p1Id = getId("rep-order-1");
      const p2Id = getId("rep-order-2");
      const o1Id = getId("oneoff-order-1");
      const o2Id = getId("oneoff-order-2");
      if (!(p1Id && p2Id && o1Id && o2Id)) throw new Error("Missing instances");

      // Interleave: projected, one-off, projected, one-off
      await act(async () => {
        result.current.reorderPlannedActivities([p1Id, o1Id, p2Id, o2Id]);
      });
      expect(result.current.dayPlan.plannedInstances.map((i) => i.id)).toEqual([
        p1Id,
        o1Id,
        p2Id,
        o2Id,
      ]);

      // Simulate a reload by navigating away then back
      await act(async () => {
        result.current.goToNextDay();
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        result.current.goToPreviousDay();
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Interleaved order must survive: projected instances must not have
      // collapsed to the end (which would happen with random UUIDs)
      expect(result.current.dayPlan.plannedInstances.map((i) => i.id)).toEqual([
        p1Id,
        o1Id,
        p2Id,
        o2Id,
      ]);
    });

    it("skipping a daily activity with a past nextDueDate sets nextDueDate to tomorrow, not past date + 1", async () => {
      // Regression: when nextDueDate is a past date (activity has been running for a while),
      // skipActivity must advance from currentDate, not from nextDueDate. Otherwise for
      // daily (freq=1) activities the new nextDueDate is still in the past and the activity
      // is immediately re-projected on the same day — making skip appear to do nothing.
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoStr = oneWeekAgo.toISOString().split("T")[0];

      const activity = {
        ...mockActivity("rep-skip-past", "Daily Since Last Week"),
        repeatConfig: {
          frequency: 1,
          unit: "days",
          nextDueDate: oneWeekAgoStr,
        },
      } as const;
      const stableList = [activity];
      const mockOnUpdateActivity = vi.fn();

      const { result } = renderHook(() =>
        useDayPlan(stableList, mockOnUpdateActivity),
      );
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const projected = result.current.dayPlan.plannedInstances.find(
        (i) => i.sourceActivityId === "rep-skip-past",
      );
      expect(projected).toBeDefined();
      if (!projected) throw new Error("No projected instance found");

      await act(async () => {
        result.current.skipActivity(projected.id);
      });

      expect(mockOnUpdateActivity).toHaveBeenCalled();
      const updatedActivity = mockOnUpdateActivity.mock.calls[0][0];

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      // nextDueDate must be tomorrow — not oneWeekAgo + 1 day
      expect(updatedActivity.repeatConfig.nextDueDate).toBe(tomorrowStr);

      // Instance must be removed from today's plan
      expect(
        result.current.dayPlan.plannedInstances.find(
          (i) => i.id === projected.id,
        ),
      ).toBeUndefined();
    });
  });

  describe("Navigation and moving to today", () => {
    it("can navigate to next day and today", async () => {
      const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const todayStr = getTodayDateString();
      const nextDayStr = getNextDay(todayStr);

      await act(async () => {
        result.current.goToNextDay();
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.currentDate).toBe(nextDayStr);

      await act(async () => {
        result.current.goToToday();
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.currentDate).toBe(todayStr);
    });

    it("moves activity to today when currently viewing another day", async () => {
      const activity1 = mockActivity("activity-1", "Activity 1");
      const stableActivities = [activity1];
      const { result } = renderHook(() => useDayPlan(stableActivities));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const todayStr = getTodayDateString();
      const tomorrowStr = getNextDay(todayStr);

      // Go to tomorrow
      await act(async () => {
        result.current.goToNextDay();
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Add activity to tomorrow's plan
      await act(async () => {
        result.current.addActivityToDayPlan(activity1);
      });

      const instanceId = result.current.dayPlan.plannedInstances[0].id;

      // Move back to today
      await act(async () => {
        await result.current.moveActivityToToday(instanceId, tomorrowStr);
      });

      // Ensure it was removed from tomorrow
      expect(result.current.dayPlan.plannedInstances).toHaveLength(0);

      // Go to today and verify it is there
      await act(async () => {
        result.current.goToToday();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dayPlan.plannedInstances).toHaveLength(1);
      expect(result.current.dayPlan.plannedInstances[0].sourceActivityId).toBe(
        "activity-1",
      );
    });
  });
});
