import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@/lib/energy-planner/schema";
import * as storageMock from "@/lib/energy-planner/storage";
import { useAvailableActivities } from "./useAvailableActivities";
import { defaultCapacity, saveDayPlanForDate } from "./utils";

vi.mock("@/lib/energy-planner/storage");

const makeOneOff = (id: string, title = id): Activity => ({
  id,
  title,
  energyCost: { physical: 10, social: 10, executive: 10 },
  factors: {
    initiationDifficulty: 1,
    terminationDifficulty: 1,
    isRestorative: false,
  },
  createdAt: new Date(),
});

const makeRepeating = (id: string): Activity => ({
  ...makeOneOff(id),
  repeatConfig: {
    frequency: 1,
    unit: "days" as const,
    nextDueDate: "2026-01-14",
  },
});

const defaultOptions = (
  oneOffActivities: Activity[],
  activityMap: Map<string, Activity>,
) => ({
  date: "2026-01-14",
  oneOffActivities,
  activityMap,
  activitiesLoading: false,
  dayPlanVersion: 0,
});

describe("useAvailableActivities", () => {
  beforeEach(() => {
    (storageMock as unknown as { __reset: () => void }).__reset();
  });

  it("returns all one-offs as available when none are scheduled", async () => {
    const a1 = makeOneOff("a1");
    const a2 = makeOneOff("a2");
    const activities = [a1, a2];
    const activityMap = new Map(activities.map((a) => [a.id, a]));

    const { result } = renderHook(() =>
      useAvailableActivities(defaultOptions(activities, activityMap)),
    );

    await waitFor(() => {
      expect(result.current.availableActivities).toHaveLength(2);
    });
    expect(result.current.uncompletedActivities).toHaveLength(0);
  });

  it("excludes activities already scheduled on any day plan", async () => {
    const a1 = makeOneOff("a1");
    const a2 = makeOneOff("a2");
    const activities = [a1, a2];
    const activityMap = new Map(activities.map((a) => [a.id, a]));

    await saveDayPlanForDate("2026-01-14", {
      date: "2026-01-14",
      plannedInstances: [
        { id: "inst-1", sourceActivityId: "a1", completed: false },
      ],
      dailyCapacity: defaultCapacity,
    });

    const { result } = renderHook(() =>
      useAvailableActivities(defaultOptions(activities, activityMap)),
    );

    await waitFor(() => {
      expect(result.current.availableActivities).toHaveLength(1);
    });
    expect(result.current.availableActivities[0].id).toBe("a2");
  });

  it("excludes activities completed on any day plan", async () => {
    const a1 = makeOneOff("a1");
    const activities = [a1];
    const activityMap = new Map(activities.map((a) => [a.id, a]));

    await saveDayPlanForDate("2026-01-13", {
      date: "2026-01-13",
      plannedInstances: [
        { id: "inst-1", sourceActivityId: "a1", completed: true },
      ],
      dailyCapacity: defaultCapacity,
    });

    const { result } = renderHook(() =>
      useAvailableActivities(defaultOptions(activities, activityMap)),
    );

    await waitFor(() => {
      expect(result.current.availableActivities).toHaveLength(0);
    });
  });

  it("does not filter repeating activities (they are not in oneOffActivities)", async () => {
    const r1 = makeRepeating("r1");
    const activities: Activity[] = [];
    const activityMap = new Map([["r1", r1]]);

    await saveDayPlanForDate("2026-01-14", {
      date: "2026-01-14",
      plannedInstances: [
        { id: "inst-r", sourceActivityId: "r1", completed: false },
      ],
      dailyCapacity: defaultCapacity,
    });

    const { result } = renderHook(() =>
      useAvailableActivities(defaultOptions(activities, activityMap)),
    );

    await waitFor(() => {
      expect(result.current.availableActivities).toHaveLength(0);
    });
    expect(result.current.uncompletedActivities).toHaveLength(0);
  });

  it("includes past uncompleted instances in uncompletedActivities", async () => {
    const a1 = makeOneOff("a1");
    const activities = [a1];
    const activityMap = new Map(activities.map((a) => [a.id, a]));

    await saveDayPlanForDate("2026-01-12", {
      date: "2026-01-12",
      plannedInstances: [
        { id: "past-inst", sourceActivityId: "a1", completed: false },
      ],
      dailyCapacity: defaultCapacity,
    });

    const { result } = renderHook(() =>
      useAvailableActivities(defaultOptions(activities, activityMap)),
    );

    await waitFor(() => {
      expect(result.current.uncompletedActivities).toHaveLength(1);
    });
    expect(result.current.uncompletedActivities[0].instanceId).toBe(
      "past-inst",
    );
    expect(result.current.uncompletedActivities[0].fromDate).toBe("2026-01-12");
    // Still excluded from availableActivities since it's scheduledOneOffIds
    expect(result.current.availableActivities).toHaveLength(0);
  });

  it("does not include today's uncompleted in uncompletedActivities", async () => {
    const a1 = makeOneOff("a1");
    const activities = [a1];
    const activityMap = new Map(activities.map((a) => [a.id, a]));

    await saveDayPlanForDate("2026-01-14", {
      date: "2026-01-14",
      plannedInstances: [
        { id: "today-inst", sourceActivityId: "a1", completed: false },
      ],
      dailyCapacity: defaultCapacity,
    });

    const { result } = renderHook(() =>
      useAvailableActivities(defaultOptions(activities, activityMap)),
    );

    await waitFor(() => {
      // Scheduled but not past, so not in uncompleted — but IS excluded from available
      expect(result.current.uncompletedActivities).toHaveLength(0);
      expect(result.current.availableActivities).toHaveLength(0);
    });
  });

  it("scheduleActivity removes an activity from availableActivities", async () => {
    const a1 = makeOneOff("a1");
    const activities = [a1];
    const activityMap = new Map(activities.map((a) => [a.id, a]));

    const { result } = renderHook(() =>
      useAvailableActivities(defaultOptions(activities, activityMap)),
    );

    await waitFor(() => {
      expect(result.current.availableActivities).toHaveLength(1);
    });

    act(() => {
      result.current.scheduleActivity("a1");
    });

    expect(result.current.availableActivities).toHaveLength(0);
  });

  it("unscheduleActivity restores an activity to availableActivities", async () => {
    const a1 = makeOneOff("a1");
    const activities = [a1];
    const activityMap = new Map(activities.map((a) => [a.id, a]));

    const { result } = renderHook(() =>
      useAvailableActivities(defaultOptions(activities, activityMap)),
    );

    await waitFor(() => {
      expect(result.current.availableActivities).toHaveLength(1);
    });

    act(() => {
      result.current.scheduleActivity("a1");
    });
    expect(result.current.availableActivities).toHaveLength(0);

    act(() => {
      result.current.unscheduleActivity("a1");
    });
    expect(result.current.availableActivities).toHaveLength(1);
  });

  it("does not re-fetch while activitiesLoading is true", async () => {
    const a1 = makeOneOff("a1");
    const activities = [a1];
    const activityMap = new Map(activities.map((a) => [a.id, a]));

    await saveDayPlanForDate("2026-01-14", {
      date: "2026-01-14",
      plannedInstances: [
        { id: "inst-1", sourceActivityId: "a1", completed: false },
      ],
      dailyCapacity: defaultCapacity,
    });

    const { result } = renderHook(() =>
      useAvailableActivities({
        ...defaultOptions(activities, activityMap),
        activitiesLoading: true,
      }),
    );

    // Should not have fetched yet — still shows all as available
    await waitFor(() => {
      expect(result.current.availableActivities).toHaveLength(1);
    });
  });

  it("ignores projected instances when computing scheduled state", async () => {
    const a1 = makeOneOff("a1");
    const activities = [a1];
    const activityMap = new Map(activities.map((a) => [a.id, a]));

    await saveDayPlanForDate("2026-01-14", {
      date: "2026-01-14",
      plannedInstances: [
        {
          id: "proj",
          sourceActivityId: "a1",
          completed: false,
          isProjected: true,
        },
      ],
      dailyCapacity: defaultCapacity,
    });

    const { result } = renderHook(() =>
      useAvailableActivities(defaultOptions(activities, activityMap)),
    );

    await waitFor(() => {
      // Projected instance should not count as scheduled
      expect(result.current.availableActivities).toHaveLength(1);
    });
  });
});
