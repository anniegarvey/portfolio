import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@/lib/energy-planner/schema";
import { fetchDayPlan, storeDayPlan } from "@/lib/energy-planner/storage";
import { useDayPlan } from "./useDayPlan";

// Mock storage
vi.mock("@/lib/energy-planner/storage");

const mockActivity = (id: string, title: string, completed = false) => ({
  id,
  title,
  completed,
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
    // Reset mock storage
    const storageMock = await import("@/lib/energy-planner/storage");
    (storageMock as unknown as { __reset: () => void }).__reset();
  });

  const STABLE_EMPTY_ACTIVITIES: Activity[] = [];

  it("initializes with today's date and empty lists", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    // Use local date string matching implementation
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dayPlan.date).toBe(todayStr);
    expect(result.current.dayPlan.activities).toEqual([]);
  });

  it("loads day plan from IndexedDB if date matches today", async () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const activity1 = mockActivity("activity-1", "T1", true);
    const activity2 = mockActivity("activity-2", "T2", false);

    await storeDayPlan(todayStr, {
      date: todayStr,
      activities: [activity1, activity2],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dayPlan.activities).toHaveLength(2);
    expect(result.current.dayPlan.activities[0].id).toBe("activity-1");
    expect(result.current.dayPlan.activities[0].completed).toBe(true);
    expect(result.current.dayPlan.activities[1].id).toBe("activity-2");
    expect(result.current.dayPlan.activities[1].completed).toBe(false);
  });

  it("navigates to previous day and keeps that day's plan separate", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Add activity to today
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

    // Yesterday's plan should be empty
    expect(result.current.dayPlan.activities).toHaveLength(0);
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

    expect(result.current.dayPlan.activities).toHaveLength(1);
    expect(result.current.dayPlan.activities[0].id).toBe("activity-1");
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

    expect(result.current.dayPlan.activities).toHaveLength(1);
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

    await act(async () => {
      result.current.removeFromPlan("activity-1");
    });

    expect(result.current.dayPlan.activities).toHaveLength(0);
  });

  it("toggles activity completion on", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const activity1 = mockActivity("activity-1", "Activity 1");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
      result.current.toggleActivityCompletion("activity-1");
    });

    expect(result.current.dayPlan.activities[0].completed).toBe(true);
  });

  it("toggles activity completion off", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const activity1 = mockActivity("activity-1", "Activity 1");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
      result.current.toggleActivityCompletion("activity-1"); // on
    });

    expect(result.current.dayPlan.activities[0].completed).toBe(true);

    await act(async () => {
      result.current.toggleActivityCompletion("activity-1"); // off
    });

    expect(result.current.dayPlan.activities[0].completed).toBe(false);
  });

  it("toggles completion for only the specified activity", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const activity1 = mockActivity("activity-1", "Activity 1");
    const activity2 = mockActivity("activity-2", "Activity 2");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
      result.current.addActivityToDayPlan(activity2);
      result.current.toggleActivityCompletion("activity-1");
    });

    const a1 = result.current.dayPlan.activities.find(
      (a) => a.id === "activity-1",
    );
    const a2 = result.current.dayPlan.activities.find(
      (a) => a.id === "activity-2",
    );

    expect(a1?.completed).toBe(true);
    expect(a2?.completed).toBe(false);
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
      expect(stored?.activities).toHaveLength(1);
      expect(stored?.activities?.[0].id).toBe("activity-1");
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

    expect(result.current.dayPlan.activities.map((a) => a.id)).toEqual([
      "activity-1",
      "activity-2",
      "activity-3",
    ]);

    await act(async () => {
      // Reorder using reorderPlannedActivities (which might be the id-based one now)
      result.current.reorderPlannedActivities([
        "activity-3",
        "activity-1",
        "activity-2",
      ]);
    });

    expect(result.current.dayPlan.activities.map((a) => a.id)).toEqual([
      "activity-3",
      "activity-1",
      "activity-2",
    ]);
  });

  it("moves uncompleted activity to next day", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const _today = new Date().toISOString().split("T")[0];

    // Create activity
    const activity1 = mockActivity("activity-1", "Activity 1");

    // Add to plan
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
    });

    // Go to next day
    await act(async () => {
      result.current.goToNextDay();
    });

    // Verify correct date
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    await waitFor(() => {
      expect(result.current.dayPlan.date).toBe(tomorrowStr);
    });
  });

  it("ignores duplicate activities when same activity added multiple times", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const activity1 = mockActivity("activity-1", "Activity 1");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Add same activity multiple times rapidly
    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
      result.current.addActivityToDayPlan(activity1);
      result.current.addActivityToDayPlan(activity1);
    });

    expect(result.current.dayPlan.activities).toHaveLength(1);
  });

  it("marks an activity from a past day as complete", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));

    // Seed past day plan
    const pastDate = "2023-01-01";
    const activity1 = mockActivity("activity-1", "Past Activity", false);
    await storeDayPlan(pastDate, {
      date: pastDate,
      activities: [activity1],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.markActivityCompleteOnDate("activity-1", pastDate);
    });

    const stored = await fetchDayPlan(pastDate);
    expect(stored?.activities[0].completed).toBe(true);
  });

  it("moves an activity from a past day to today", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const pastDate = "2023-01-01";
    const activity1 = mockActivity("activity-1", "Past Activity", false);
    await storeDayPlan(pastDate, {
      date: pastDate,
      activities: [activity1],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.moveActivityToToday("activity-1", pastDate);
    });

    // Validations
    // 1. Removed from past day
    const pastStored = await fetchDayPlan(pastDate);
    expect(pastStored?.activities).toHaveLength(0);

    // 2. Added to today (current dayPlan)
    expect(result.current.dayPlan.activities).toHaveLength(1);
    expect(result.current.dayPlan.activities[0].id).toBe("activity-1");
  });

  it("moves an activity from a past day to unplanned (removes from day plan and returns activity)", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const pastDate = "2023-01-01";
    const activity1 = mockActivity("activity-1", "Past Activity", false);
    await storeDayPlan(pastDate, {
      date: pastDate,
      activities: [activity1],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let removedActivity: unknown;
    await act(async () => {
      removedActivity = await result.current.moveActivityToUnplanned(
        "activity-1",
        pastDate,
      );
    });

    // 1. Removed from past day
    const pastStored = await fetchDayPlan(pastDate);
    expect(pastStored?.activities).toHaveLength(0);

    // 2. Returns the removed activity (caller is responsible for adding to one-off)
    expect(removedActivity).toBeDefined();
    expect((removedActivity as { id: string }).id).toBe("activity-1");
  });

  it("does not duplicate activity when moving to today if already present", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const pastDate = "2023-01-01";
    const activity1 = mockActivity("activity-1", "Past Activity", false);

    // Seed past day
    await act(async () => {
      await storeDayPlan(pastDate, {
        date: pastDate,
        activities: [activity1],
        dailyCapacity: { physical: 100, social: 100, executive: 100 },
      });
    });

    // Seed today WITH the activity already
    const { getTodayDateString } = await import("./utils");
    const today = getTodayDateString();

    await act(async () => {
      await storeDayPlan(today, {
        date: today,
        activities: [activity1], // Already here
        dailyCapacity: { physical: 100, social: 100, executive: 100 },
      });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Go to past
    await act(async () => {
      result.current.navigateToDate(pastDate);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.currentDate).toBe(pastDate);
    });

    // Move to today
    await act(async () => {
      await result.current.moveActivityToToday("activity-1", pastDate);
    });

    // 1. Removed from past
    await waitFor(async () => {
      const pastStored = await fetchDayPlan(pastDate);
      expect(pastStored?.activities).toHaveLength(0);
    });

    // 2. Still only 1 in today
    await waitFor(async () => {
      const stored = await fetchDayPlan(today);
      expect(stored?.activities).toHaveLength(1);
    });
  }, 10000);

  it("moves an activity from current day to unplanned", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const activity1 = mockActivity("activity-1", "Activity 1");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Add to plan
    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
    });

    await act(async () => {
      const today = result.current.currentDate;
      await result.current.moveActivityToUnplanned("activity-1", today);
    });

    expect(result.current.dayPlan.activities).toHaveLength(0);
    // Note: The hook now returns the removed activity, caller is responsible for adding to one-off
  });

  it("assigns activity to a zone", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const activity1 = mockActivity("activity-1", "Activity 1");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.addActivityToDayPlan(activity1);
    });

    // Default zone is undefined or handled by util/default

    await act(async () => {
      result.current.assignActivityToZone("activity-1", "evening");
    });

    expect(result.current.dayPlan.activities[0].zoneId).toBe("evening");
  });

  it("solidifies a projected repeating activity when assigned to a zone", async () => {
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

    // Verify it is projected
    const projectedActivity = result.current.dayPlan.activities.find((a) =>
      a.id.startsWith("virtual-"),
    );
    expect(projectedActivity).toBeDefined();
    expect(projectedActivity?.isProjected).toBe(true);

    // biome-ignore lint/style/noNonNullAssertion: Test will fail if this is null, detecting the issue
    const virtualId = projectedActivity!.id;

    // Assign zone to virtual activity
    await act(async () => {
      result.current.assignActivityToZone(virtualId, "morning");
    });

    // Verify it is now concrete
    const solidActivity = result.current.dayPlan.activities.find(
      (a) => a.title === "Repeating Activity",
    );
    expect(solidActivity).toBeDefined();
    expect(solidActivity?.id).not.toBe(virtualId); // Should have new UUID
    expect(solidActivity?.id).not.toBe("rep-1"); // Should not be the definition ID
    expect(solidActivity?.isProjected).toBeUndefined(); // Should not be projected
    expect(solidActivity?.zoneId).toBe("morning");
    expect(solidActivity?.zoneId).toBe("morning");
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

    // Verify the projected activity has the zone from defaultZoneId
    const projectedActivity = result.current.dayPlan.activities.find((a) =>
      a.id.startsWith("virtual-"),
    );
    expect(projectedActivity).toBeDefined();
    expect(projectedActivity?.zoneId).toBe("afternoon");
  });

  it("solidifies a projected repeating activity when completed", async () => {
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

    const projectedActivity = result.current.dayPlan.activities.find((a) =>
      a.id.startsWith("virtual-"),
    );
    expect(projectedActivity).toBeDefined();
    expect(projectedActivity?.repeatingActivityId).toBe("rep-2");
    expect(projectedActivity?.isProjected).toBe(true);

    // Toggle completion
    await act(async () => {
      // biome-ignore lint/style/noNonNullAssertion: Test will fail if this is null, detecting the issue
      await result.current.toggleActivityCompletion(projectedActivity!.id);
    });

    // Verify it is now concrete and completed
    await waitFor(() => {
      const activity = result.current.dayPlan.activities.find(
        (a) => a.title === "Repeating Activity 2",
      );
      expect(activity).toBeDefined();
      expect(activity?.completed).toBe(true);
      expect(activity?.isProjected).toBeUndefined();
    });

    // Should have updated the repeating activity definition with the next due date
    expect(mockOnUpdateActivity).toHaveBeenCalled();
  });

  it("moves an activity to today when viewing a different day", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const pastDate = "2023-01-01";
    const activity1 = mockActivity("activity-1", "Past Activity", false);
    await storeDayPlan(pastDate, {
      date: pastDate,
      activities: [activity1],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    // We are currently on today
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Go to tomorrow
    await act(async () => {
      result.current.goToNextDay();
    });

    // Move activity from past to today (not current view)
    await act(async () => {
      await result.current.moveActivityToToday("activity-1", pastDate);
    });

    // Verify it is in today's plan in storage
    const { fetchDayPlan } = await import("@/lib/energy-planner/storage");
    // getTodayDateString is not exported from storage but utils...
    // Just construct string
    const today = new Date().toISOString().split("T")[0];
    const todayPlan = await fetchDayPlan(today);

    expect(todayPlan?.activities).toHaveLength(1);
    expect(todayPlan?.activities[0].id).toBe("activity-1");
  });

  it("navigates to today", async () => {
    const { result } = renderHook(() => useDayPlan(STABLE_EMPTY_ACTIVITIES));
    const today = new Date().toISOString().split("T")[0];

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.goToPreviousDay();
    });

    expect(result.current.currentDate).not.toBe(today);

    await act(async () => {
      result.current.goToToday();
    });

    expect(result.current.currentDate).toBe(today);
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

    const today = result.current.currentDate;
    await act(async () => {
      await result.current.markActivityCompleteOnDate("activity-1", today);
    });

    expect(result.current.dayPlan.activities[0].completed).toBe(true);
  });

  describe("Repeating Activity Logic Coverage", () => {
    beforeEach(() => {
      // Set a safe date (middle of month) to avoid end-of-month overflow issues
      // e.g. Jan 31 + 1 month -> March 2/3
      // Only fake Date, leave setTimeout/Interval/etc real so waitFor works naturally
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

      // Should be visible today
      expect(result.current.dayPlan.activities).toHaveLength(1);

      // Navigate to next week
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split("T")[0];

      await act(async () => {
        result.current.navigateToDate(nextWeekStr);
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.dayPlan.activities).toHaveLength(1);
      expect(result.current.dayPlan.activities[0].title).toBe(
        "Weekly Activity",
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

      // Navigate to next month
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      const nextMonthStr = nextMonth.toISOString().split("T")[0];

      await act(async () => {
        result.current.navigateToDate(nextMonthStr);
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.dayPlan.activities).toHaveLength(1);
      expect(result.current.dayPlan.activities[0].title).toBe(
        "Monthly Activity",
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

      // Navigate to next year
      const nextYear = new Date(today);
      nextYear.setFullYear(today.getFullYear() + 1);
      const nextYearStr = nextYear.toISOString().split("T")[0];

      await act(async () => {
        result.current.navigateToDate(nextYearStr);
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.dayPlan.activities).toHaveLength(1);
      expect(result.current.dayPlan.activities[0].title).toBe(
        "Yearly Activity",
      );
    });
  });
});
