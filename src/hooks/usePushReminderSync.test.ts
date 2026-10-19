import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as push from "@/lib/energy-planner/pushReminders";
import type { Activity, DayPlan } from "@/lib/energy-planner/schema";
import * as storageMock from "@/lib/energy-planner/storage";
import { PUSH_HORIZON_DAYS, usePushReminderSync } from "./usePushReminderSync";

vi.mock("@/lib/energy-planner/storage");

const activity: Activity = {
  id: "r",
  title: "Take meds",
  energyCost: {},
  factors: {
    initiationDifficulty: 0,
    terminationDifficulty: 0,
    isRestorative: false,
  },
  createdAt: new Date(),
  reminderTime: "09:00",
  repeatConfig: { frequency: 1, unit: "days", nextDueDate: "2026-09-27" },
};

const plan: DayPlan = {
  date: "2026-09-27",
  plannedInstances: [],
  dailyCapacity: {},
};

describe("usePushReminderSync", () => {
  const subscription = {} as PushSubscription;
  let sync: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    (storageMock as unknown as { __reset: () => void }).__reset();
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    vi.setSystemTime(new Date(2026, 8, 27, 8, 0));
    vi.spyOn(push, "getPushSubscription").mockResolvedValue(subscription);
    sync = vi.spyOn(push, "syncPushReminders").mockResolvedValue(true);
  });

  afterEach(() => vi.useRealTimers());

  it("sends the upcoming reminders for the horizon once changes settle", async () => {
    renderHook(() => usePushReminderSync([], [activity], plan));
    expect(sync).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTimeAsync(1000));

    expect(sync).toHaveBeenCalledTimes(1);
    const [sentTo, reminders] = sync.mock.calls[0];
    expect(sentTo).toBe(subscription);
    expect(reminders).toHaveLength(PUSH_HORIZON_DAYS);
    expect(reminders[0]).toMatchObject({
      title: "Take meds",
      at: new Date(2026, 8, 27, 9, 0).getTime(),
    });
  });

  it("re-syncs when the day plan changes", async () => {
    const { rerender } = renderHook(
      ({ dayPlan }) => usePushReminderSync([], [activity], dayPlan),
      { initialProps: { dayPlan: plan } },
    );
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    rerender({ dayPlan: { ...plan } });
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(sync).toHaveBeenCalledTimes(2);
  });

  it("does nothing on a device without push", async () => {
    vi.spyOn(push, "getPushSubscription").mockResolvedValue(null);
    renderHook(() => usePushReminderSync([], [activity], plan));
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(sync).not.toHaveBeenCalled();
  });

  it("shrugs off a failed sync", async () => {
    sync.mockRejectedValue(new Error("offline"));
    renderHook(() => usePushReminderSync([], [activity], plan));
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(sync).toHaveBeenCalledTimes(1);
  });
});
