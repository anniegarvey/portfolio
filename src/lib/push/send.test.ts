import { describe, expect, it, vi } from "vitest";
import type { PushReminder, ScheduleRequest } from "./schema";
import {
  SEND_GRACE_MS,
  type SendDeps,
  type Sender,
  SubscriptionGoneError,
  sendDueReminders,
} from "./send";
import type { StoredSchedule } from "./store";

const NOW = 1_800_000_000_000;
const ENDPOINT = "https://fcm.googleapis.com/fcm/send/a";

function reminder(at: number, tag = `t${at}`): PushReminder {
  return { at, title: "Take meds", body: "", tag };
}

function stored(
  reminders: PushReminder[],
  endpoint = ENDPOINT,
): StoredSchedule {
  const schedule: ScheduleRequest = {
    subscription: { endpoint, keys: { p256dh: "p", auth: "a" } },
    reminders,
  };
  return { key: endpoint, raw: JSON.stringify(schedule), schedule };
}

function deps(send: Sender = async () => {}) {
  return {
    send: vi.fn(send),
    replace: vi.fn<SendDeps["replace"]>(async () => true),
    remove: vi.fn<SendDeps["remove"]>(async () => {}),
  };
}

describe("sendDueReminders", () => {
  it("saves the schedule without due reminders, then sends them", async () => {
    const d = deps();
    const due = reminder(NOW - 1000);
    const future = reminder(NOW + 1000);
    const entry = stored([due, future]);

    const result = await sendDueReminders([entry], NOW, d);

    expect(d.replace).toHaveBeenCalledWith(entry, {
      ...entry.schedule,
      reminders: [future],
    });
    expect(d.replace.mock.invocationCallOrder[0]).toBeLessThan(
      d.send.mock.invocationCallOrder[0],
    );
    expect(d.send).toHaveBeenCalledWith(entry.schedule.subscription, due);
    expect(result).toEqual({ sent: 1, failed: 0 });
  });

  it("sends a reminder exactly on time", async () => {
    const d = deps();
    await sendDueReminders([stored([reminder(NOW)])], NOW, d);
    expect(d.send).toHaveBeenCalledTimes(1);
  });

  it("leaves schedules with nothing due untouched", async () => {
    const d = deps();
    const result = await sendDueReminders(
      [stored([reminder(NOW + 1)])],
      NOW,
      d,
    );
    expect(d.replace).not.toHaveBeenCalled();
    expect(d.send).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: 0, failed: 0 });
  });

  it("sends nothing when the planner replaced the schedule meanwhile", async () => {
    const d = deps();
    d.replace.mockResolvedValue(false);
    const result = await sendDueReminders(
      [stored([reminder(NOW - 1)])],
      NOW,
      d,
    );
    expect(d.send).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: 0, failed: 0 });
  });

  it("drops reminders too late to be useful without sending them", async () => {
    const d = deps();
    await sendDueReminders([stored([reminder(NOW - SEND_GRACE_MS)])], NOW, d);
    expect(d.send).not.toHaveBeenCalled();
    expect(d.replace.mock.calls[0][1].reminders).toEqual([]);
  });

  it("removes a device whose subscription has gone", async () => {
    const d = deps(async () => {
      throw new SubscriptionGoneError();
    });
    const result = await sendDueReminders(
      [stored([reminder(NOW - 1)])],
      NOW,
      d,
    );
    expect(d.remove).toHaveBeenCalledWith(ENDPOINT);
    expect(result).toEqual({ sent: 0, failed: 1 });
  });

  it("counts a failed send and carries on with the rest", async () => {
    const d = deps();
    d.send
      .mockRejectedValueOnce(new Error("push service down"))
      .mockResolvedValueOnce(undefined);
    const result = await sendDueReminders(
      [stored([reminder(NOW - 1, "a"), reminder(NOW - 2, "b")])],
      NOW,
      d,
    );
    expect(d.remove).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: 1, failed: 1 });
  });

  it("doesn't let one hanging device hold up another", async () => {
    const d = deps();
    const hung = "https://fcm.googleapis.com/fcm/send/hung";
    d.send.mockImplementation((subscription) =>
      subscription.endpoint === hung
        ? new Promise(() => {})
        : Promise.resolve(),
    );
    void sendDueReminders(
      [stored([reminder(NOW - 1)], hung), stored([reminder(NOW - 1)])],
      NOW,
      d,
    );
    await vi.waitFor(() =>
      expect(d.send).toHaveBeenCalledWith(
        expect.objectContaining({ endpoint: ENDPOINT }),
        expect.anything(),
      ),
    );
  });
});
