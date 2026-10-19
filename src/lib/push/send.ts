import type { PushReminder, ScheduleRequest } from "./schema";

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

export interface SendResult {
  sent: number;
  failed: number;
  /** Schedules to save back (due reminders removed), or null to delete. */
  updates: { endpoint: string; schedule: ScheduleRequest | null }[];
}

export async function sendDueReminders(
  schedules: ScheduleRequest[],
  now: number,
  send: Sender,
): Promise<SendResult> {
  let sent = 0;
  let failed = 0;
  const updates: SendResult["updates"] = [];

  for (const schedule of schedules) {
    const { endpoint } = schedule.subscription;
    const due = schedule.reminders.filter((r) => r.at <= now);
    if (due.length === 0) continue;

    let gone = false;
    for (const reminder of due.filter((r) => now - r.at < SEND_GRACE_MS)) {
      try {
        await send(schedule.subscription, reminder);
        sent++;
      } catch (error) {
        if (error instanceof SubscriptionGoneError) {
          gone = true;
          break;
        }
        // Any other failure: drop this reminder rather than retry it forever.
        failed++;
      }
    }

    updates.push({
      endpoint,
      schedule: gone
        ? null
        : {
            ...schedule,
            reminders: schedule.reminders.filter((r) => r.at > now),
          },
    });
  }

  return { sent, failed, updates };
}
