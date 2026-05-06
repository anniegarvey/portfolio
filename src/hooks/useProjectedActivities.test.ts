import { renderHook } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Activity, DayPlan } from "@/lib/energy-planner/schema";
import { useProjectedActivities } from "./useProjectedActivities";

const defaultCapacity = { physical: 100, social: 100, executive: 100 };

const makeActivity = (
  id: string,
  overrides: Partial<Activity> = {},
): Activity => ({
  id,
  title: `Activity ${id}`,
  createdAt: new Date(),
  energyCost: { physical: 10, social: 10, executive: 10 },
  factors: {
    initiationDifficulty: 2,
    terminationDifficulty: 2,
    isRestorative: false,
  },
  ...overrides,
});

const makeRepeating = (
  id: string,
  nextDueDate: string,
  extra: Partial<Activity> = {},
): Activity =>
  makeActivity(id, {
    repeatConfig: { frequency: 1, unit: "days", nextDueDate },
    ...extra,
  });

const emptyBasePlan = (date: string): DayPlan => ({
  date,
  plannedInstances: [],
  dailyCapacity: defaultCapacity,
});

describe("useProjectedActivities", () => {
  describe("projection", () => {
    it("projects a due repeating activity", () => {
      const date = "2026-01-15";
      const activity = makeRepeating("rep-1", date);

      const { result } = renderHook(() =>
        useProjectedActivities({
          repeatingActivities: [activity],
          basePlan: emptyBasePlan(date),
          date,
          onUpdateActivity: vi.fn(),
          onSkip: vi.fn(),
        }),
      );

      expect(result.current.projectedInstances).toHaveLength(1);
      expect(result.current.projectedInstances[0].sourceActivityId).toBe(
        "rep-1",
      );
      expect(result.current.projectedInstances[0].isProjected).toBe(true);
      expect(result.current.projectedInstances[0].completed).toBe(false);
    });

    it("uses the activity's defaultZoneId on projected instances", () => {
      const date = "2026-01-15";
      const activity = makeRepeating("rep-zone", date, {
        repeatConfig: {
          frequency: 1,
          unit: "days",
          nextDueDate: date,
          defaultZoneId: "evening",
        },
      });

      const { result } = renderHook(() =>
        useProjectedActivities({
          repeatingActivities: [activity],
          basePlan: emptyBasePlan(date),
          date,
          onUpdateActivity: vi.fn(),
          onSkip: vi.fn(),
        }),
      );

      expect(result.current.projectedInstances[0].zoneId).toBe("evening");
    });

    it("does not project an activity that is not due", () => {
      const date = "2026-01-15";
      const activity = makeRepeating("rep-future", "2026-01-20");

      const { result } = renderHook(() =>
        useProjectedActivities({
          repeatingActivities: [activity],
          basePlan: emptyBasePlan(date),
          date,
          onUpdateActivity: vi.fn(),
          onSkip: vi.fn(),
        }),
      );

      expect(result.current.projectedInstances).toHaveLength(0);
    });

    it("does not project an activity already in basePlan as a concrete instance", () => {
      const date = "2026-01-15";
      const activity = makeRepeating("rep-1", date);
      const basePlan: DayPlan = {
        ...emptyBasePlan(date),
        plannedInstances: [
          { id: "concrete-id", sourceActivityId: "rep-1", completed: true },
        ],
      };

      const { result } = renderHook(() =>
        useProjectedActivities({
          repeatingActivities: [activity],
          basePlan,
          date,
          onUpdateActivity: vi.fn(),
          onSkip: vi.fn(),
        }),
      );

      expect(result.current.projectedInstances).toHaveLength(0);
    });

    it("does not project an activity in skippedSourceActivityIds", () => {
      const date = "2026-01-15";
      const activity = makeRepeating("rep-skip", date);
      const basePlan: DayPlan = {
        ...emptyBasePlan(date),
        skippedSourceActivityIds: ["rep-skip"],
      };

      const { result } = renderHook(() =>
        useProjectedActivities({
          repeatingActivities: [activity],
          basePlan,
          date,
          onUpdateActivity: vi.fn(),
          onSkip: vi.fn(),
        }),
      );

      expect(result.current.projectedInstances).toHaveLength(0);
    });

    it("returns a stable deterministic ID for the same activity+date", () => {
      const date = "2026-01-15";
      const activity = makeRepeating("rep-1", date);

      const { result: r1 } = renderHook(() =>
        useProjectedActivities({
          repeatingActivities: [activity],
          basePlan: emptyBasePlan(date),
          date,
          onUpdateActivity: vi.fn(),
          onSkip: vi.fn(),
        }),
      );

      const { result: r2 } = renderHook(() =>
        useProjectedActivities({
          repeatingActivities: [activity],
          basePlan: emptyBasePlan(date),
          date,
          onUpdateActivity: vi.fn(),
          onSkip: vi.fn(),
        }),
      );

      expect(r1.current.projectedInstances[0].id).toBe(
        r2.current.projectedInstances[0].id,
      );
    });
  });

  describe("handleComplete", () => {
    it("calls onUpdateActivity with nextDueDate advanced from the scheduled due date", () => {
      const date = "2026-01-15";
      const activity = makeRepeating("rep-1", date);
      const onUpdateActivity = vi.fn();

      const { result } = renderHook(() =>
        useProjectedActivities({
          repeatingActivities: [activity],
          basePlan: emptyBasePlan(date),
          date,
          onUpdateActivity,
          onSkip: vi.fn(),
        }),
      );

      const instanceId = result.current.projectedInstances[0].id;

      act(() => {
        result.current.handleComplete(instanceId);
      });

      expect(onUpdateActivity).toHaveBeenCalledOnce();
      const updated = onUpdateActivity.mock.calls[0][0] as Activity;
      expect(updated.repeatConfig?.nextDueDate).toBe("2026-01-16");
    });

    it("is a no-op for an unknown instanceId", () => {
      const date = "2026-01-15";
      const activity = makeRepeating("rep-1", date);
      const onUpdateActivity = vi.fn();

      const { result } = renderHook(() =>
        useProjectedActivities({
          repeatingActivities: [activity],
          basePlan: emptyBasePlan(date),
          date,
          onUpdateActivity,
          onSkip: vi.fn(),
        }),
      );

      act(() => {
        result.current.handleComplete("unknown-id");
      });

      expect(onUpdateActivity).not.toHaveBeenCalled();
    });

    it("is a no-op when the source activity has no repeatConfig", () => {
      const date = "2026-01-15";
      // Activity has no repeatConfig but shares an ID with a projected instance ID
      // (edge case: projected instance whose activity was mutated to remove repeatConfig)
      const activity = makeActivity("rep-1");
      const onUpdateActivity = vi.fn();

      // Inject a fake projected instance manually via a forged basePlan
      // by using a repeating activity for projection then passing a non-repeating
      // activity in repeatingActivities at call time (simulates mid-render inconsistency)
      const repeatingAtStart = makeRepeating("rep-1", date);
      const { result, rerender } = renderHook(
        ({ acts }: { acts: Activity[] }) =>
          useProjectedActivities({
            repeatingActivities: acts,
            basePlan: emptyBasePlan(date),
            date,
            onUpdateActivity,
            onSkip: vi.fn(),
          }),
        { initialProps: { acts: [repeatingAtStart] } },
      );

      const instanceId = result.current.projectedInstances[0].id;

      // Swap to a non-repeating version before calling handleComplete
      rerender({ acts: [activity] });

      act(() => {
        result.current.handleComplete(instanceId);
      });

      expect(onUpdateActivity).not.toHaveBeenCalled();
    });
  });

  describe("handleSkip", () => {
    it("calls onUpdateActivity with nextDueDate advanced from the current date", () => {
      const date = "2026-01-15";
      const activity = makeRepeating("rep-1", date);
      const onUpdateActivity = vi.fn();

      const { result } = renderHook(() =>
        useProjectedActivities({
          repeatingActivities: [activity],
          basePlan: emptyBasePlan(date),
          date,
          onUpdateActivity,
          onSkip: vi.fn(),
        }),
      );

      const instanceId = result.current.projectedInstances[0].id;

      act(() => {
        result.current.handleSkip(instanceId);
      });

      expect(onUpdateActivity).toHaveBeenCalledOnce();
      const updated = onUpdateActivity.mock.calls[0][0] as Activity;
      // Skip advances from the current date (not from nextDueDate)
      expect(updated.repeatConfig?.nextDueDate).toBe("2026-01-16");
    });

    it("calls onSkip with the source activity ID", () => {
      const date = "2026-01-15";
      const activity = makeRepeating("rep-1", date);
      const onSkip = vi.fn();

      const { result } = renderHook(() =>
        useProjectedActivities({
          repeatingActivities: [activity],
          basePlan: emptyBasePlan(date),
          date,
          onUpdateActivity: vi.fn(),
          onSkip,
        }),
      );

      const instanceId = result.current.projectedInstances[0].id;

      act(() => {
        result.current.handleSkip(instanceId);
      });

      expect(onSkip).toHaveBeenCalledWith("rep-1");
    });

    it("advances from the current date, not nextDueDate, when nextDueDate is in the past", () => {
      const oneWeekAgo = "2026-01-08";
      const today = "2026-01-15";
      const activity = makeRepeating("rep-past", oneWeekAgo);
      const onUpdateActivity = vi.fn();

      const { result } = renderHook(() =>
        useProjectedActivities({
          repeatingActivities: [activity],
          basePlan: emptyBasePlan(today),
          date: today,
          onUpdateActivity,
          onSkip: vi.fn(),
        }),
      );

      const instanceId = result.current.projectedInstances[0].id;

      act(() => {
        result.current.handleSkip(instanceId);
      });

      const updated = onUpdateActivity.mock.calls[0][0] as Activity;
      // Must be tomorrow (today + 1), not oneWeekAgo + 1 day
      expect(updated.repeatConfig?.nextDueDate).toBe("2026-01-16");
    });

    it("is a no-op for an unknown instanceId", () => {
      const date = "2026-01-15";
      const activity = makeRepeating("rep-1", date);
      const onUpdateActivity = vi.fn();
      const onSkip = vi.fn();

      const { result } = renderHook(() =>
        useProjectedActivities({
          repeatingActivities: [activity],
          basePlan: emptyBasePlan(date),
          date,
          onUpdateActivity,
          onSkip,
        }),
      );

      act(() => {
        result.current.handleSkip("unknown-id");
      });

      expect(onUpdateActivity).not.toHaveBeenCalled();
      expect(onSkip).not.toHaveBeenCalled();
    });
  });
});
