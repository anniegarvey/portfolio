import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as reminders from "@/lib/energy-planner/reminders";
import type { Activity } from "@/lib/energy-planner/schema";
import * as storageMock from "@/lib/energy-planner/storage";
import { useActivityReminders } from "./useActivityReminders";

vi.mock("@/lib/energy-planner/storage");

function makeRepeating(id: string, reminderTime?: string): Activity {
  return {
    id,
    title: `Activity ${id}`,
    energyCost: {},
    factors: {
      initiationDifficulty: 0,
      terminationDifficulty: 0,
      isRestorative: false,
    },
    createdAt: new Date(),
    reminderTime,
    repeatConfig: { frequency: 1, unit: "days", nextDueDate: "2026-09-27" },
  };
}

describe("useActivityReminders", () => {
  let showReminder: ReturnType<typeof vi.spyOn>;
  let permission: NotificationPermission;

  beforeEach(() => {
    (storageMock as unknown as { __reset: () => void }).__reset();
    localStorage.clear();
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    vi.setSystemTime(new Date(2026, 8, 27, 8, 59, 50));
    permission = "granted";
    vi.stubGlobal("Notification", {
      get permission() {
        return permission;
      },
    });
    showReminder = vi
      .spyOn(reminders, "showReminder")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("notifies once the reminder time arrives, and only once", async () => {
    renderHook(() => useActivityReminders([], [makeRepeating("r", "09:00")]));
    await act(async () => {});
    expect(showReminder).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTimeAsync(30_000));
    expect(showReminder).toHaveBeenCalledTimes(1);
    expect(showReminder.mock.calls[0][0]).toMatchObject({ id: "r" });

    await act(async () => vi.advanceTimersByTimeAsync(30_000));
    expect(showReminder).toHaveBeenCalledTimes(1);
  });

  it("checks straight away when activities change", async () => {
    vi.setSystemTime(new Date(2026, 8, 27, 9, 5));
    const { rerender } = renderHook(
      ({ repeating }) => useActivityReminders([], repeating),
      { initialProps: { repeating: [makeRepeating("r")] } },
    );
    await act(async () => {});
    expect(showReminder).not.toHaveBeenCalled();

    rerender({ repeating: [makeRepeating("r", "09:00")] });
    await act(async () => {});
    expect(showReminder).toHaveBeenCalledTimes(1);
  });

  it("stays quiet without notification permission", async () => {
    permission = "default";
    vi.setSystemTime(new Date(2026, 8, 27, 9, 5));
    renderHook(() => useActivityReminders([], [makeRepeating("r", "09:00")]));
    await act(async () => vi.advanceTimersByTimeAsync(30_000));
    expect(showReminder).not.toHaveBeenCalled();
  });

  it("stays quiet where notifications aren't supported", async () => {
    vi.stubGlobal("Notification", undefined);
    vi.setSystemTime(new Date(2026, 8, 27, 9, 5));
    renderHook(() => useActivityReminders([], [makeRepeating("r", "09:00")]));
    await act(async () => vi.advanceTimersByTimeAsync(30_000));
    expect(showReminder).not.toHaveBeenCalled();
  });
});
