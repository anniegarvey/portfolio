import { describe, expect, it, vi } from "vitest";
import type { PushReminder, ScheduleRequest } from "./schema";
import {
  SEND_GRACE_MS,
  type Sender,
  SubscriptionGoneError,
  sendDueReminders,
} from "./send";

const NOW = 1_800_000_000_000;

function reminder(at: number, tag = `t${at}`): PushReminder {
  return { at, title: "Take meds", body: "", tag };
}

function schedule(reminders: PushReminder[], endpoint = "https://push/a") {
  return {
    subscription: { endpoint, keys: { p256dh: "p", auth: "a" } },
    reminders,
  } satisfies ScheduleRequest;
}

describe("sendDueReminders", () => {
  it("sends due reminders and keeps the rest", async () => {
    const send = vi.fn<Sender>(async () => {});
    const future = reminder(NOW + 1000);
    const due = reminder(NOW - 1000);

    const result = await sendDueReminders([schedule([due, future])], NOW, send);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][1]).toBe(due);
    expect(result.sent).toBe(1);
    expect(result.updates).toEqual([
      { endpoint: "https://push/a", schedule: schedule([future]) },
    ]);
  });

  it("sends a reminder exactly on time", async () => {
    const send = vi.fn<Sender>(async () => {});
    await sendDueReminders([schedule([reminder(NOW)])], NOW, send);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("leaves schedules with nothing due untouched", async () => {
    const send = vi.fn<Sender>(async () => {});
    const result = await sendDueReminders(
      [schedule([reminder(NOW + 1)])],
      NOW,
      send,
    );
    expect(send).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: 0, failed: 0, updates: [] });
  });

  it("drops reminders too late to be useful without sending them", async () => {
    const send = vi.fn<Sender>(async () => {});
    const result = await sendDueReminders(
      [schedule([reminder(NOW - SEND_GRACE_MS)])],
      NOW,
      send,
    );
    expect(send).not.toHaveBeenCalled();
    expect(result.updates[0].schedule?.reminders).toEqual([]);
  });

  it("deletes a schedule whose subscription has gone", async () => {
    const send = vi.fn<Sender>(async () => {
      throw new SubscriptionGoneError();
    });
    const result = await sendDueReminders(
      [schedule([reminder(NOW - 1, "a"), reminder(NOW - 2, "b")])],
      NOW,
      send,
    );
    expect(send).toHaveBeenCalledTimes(1);
    expect(result.updates).toEqual([
      { endpoint: "https://push/a", schedule: null },
    ]);
  });

  it("drops a reminder that fails to send and carries on", async () => {
    const send = vi
      .fn<Sender>()
      .mockRejectedValueOnce(new Error("push service down"))
      .mockResolvedValueOnce(undefined);
    const result = await sendDueReminders(
      [schedule([reminder(NOW - 1, "a"), reminder(NOW - 2, "b")])],
      NOW,
      send,
    );
    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.updates[0].schedule?.reminders).toEqual([]);
  });
});
