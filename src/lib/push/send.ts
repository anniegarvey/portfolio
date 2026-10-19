import type { PushReminder, ScheduleRequest } from "./schema";
import type { StoredSchedule } from "./store";

// Sends are triggered every few minutes from outside (the server sleeps when
// idle), so a reminder can arrive a little late. Past this it's dropped: a
// reminder hours late is noise.
export const SEND_GRACE_MS = 60 * 60 * 1000;

export type Sender = (
  subscription: ScheduleRequest["subscription"],
  reminder: PushReminder,
) => Promise<void>;

/** Thrown by a sender when the push service says the subscription is gone. */
export class SubscriptionGoneError extends Error {}

export interface SendDeps {
  send: Sender;
  /** Saves the schedule minus what's about to be sent; false if it changed. */
  replace: (stored: StoredSchedule, next: ScheduleRequest) => Promise<boolean>;
  remove: (endpoint: string) => Promise<void>;
}

export interface SendResult {
  sent: number;
  failed: number;
}

/**
 * Sends every due reminder across all devices. Each schedule is saved without
 * its due reminders before they go out, so a run that is retried or overlaps
 * another can't send the same reminder twice. Devices are handled in
 * parallel, so one slow push service doesn't hold up the rest.
 */
export async function sendDueReminders(
  stored: StoredSchedule[],
  now: number,
  { send, replace, remove }: SendDeps,
): Promise<SendResult> {
  const results = await Promise.all(
    stored.map(async (entry): Promise<SendResult> => {
      const { schedule } = entry;
      const due = schedule.reminders.filter((r) => r.at <= now);
      if (due.length === 0) return { sent: 0, failed: 0 };

      const remaining = schedule.reminders.filter((r) => r.at > now);
      // Changed since it was read: leave it for the next run.
      if (!(await replace(entry, { ...schedule, reminders: remaining }))) {
        return { sent: 0, failed: 0 };
      }

      const outcomes = await Promise.allSettled(
        due
          .filter((r) => now - r.at < SEND_GRACE_MS)
          .map((r) => send(schedule.subscription, r)),
      );
      if (
        outcomes.some(
          (o) =>
            o.status === "rejected" &&
            o.reason instanceof SubscriptionGoneError,
        )
      ) {
        await remove(schedule.subscription.endpoint);
      }
      // A failed send is dropped rather than retried forever.
      return {
        sent: outcomes.filter((o) => o.status === "fulfilled").length,
        failed: outcomes.filter((o) => o.status === "rejected").length,
      };
    }),
  );
  return {
    sent: results.reduce((n, r) => n + r.sent, 0),
    failed: results.reduce((n, r) => n + r.failed, 0),
  };
}
