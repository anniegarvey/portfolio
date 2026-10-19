import { z } from "zod";

// One notification to send at a fixed moment. The planner works out which
// activities are due on which days; the server only keeps the resulting times.
export const PushReminderSchema = z.object({
  at: z.number().int(), // epoch milliseconds
  title: z.string().min(1).max(200),
  body: z.string().max(500),
  tag: z.string().min(1).max(200),
});
export type PushReminder = z.infer<typeof PushReminderSchema>;

// The browser push services. Endpoints come from the open schedule route, and
// the server makes requests to them, so anything else is refused rather than
// letting a stranger point the server at an arbitrary host.
const PUSH_SERVICE_HOSTS = [
  /^fcm\.googleapis\.com$/,
  /^updates\.push\.services\.mozilla\.com$/,
  /(^|\.)push\.apple\.com$/,
  /(^|\.)notify\.windows\.com$/,
];

export function isPushServiceEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return (
      url.protocol === "https:" &&
      url.port === "" &&
      PUSH_SERVICE_HOSTS.some((host) => host.test(url.hostname))
    );
  } catch {
    return false;
  }
}

export const PushSubscriptionSchema = z.object({
  endpoint: z.string().refine(isPushServiceEndpoint),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});
export type StoredSubscription = z.infer<typeof PushSubscriptionSchema>;

// The planner sends 30 days ahead; allow a little slack for clock skew.
export const MAX_AHEAD_MS = 32 * 24 * 60 * 60 * 1000;

export const ScheduleRequestSchema = z.object({
  subscription: PushSubscriptionSchema,
  reminders: z.array(PushReminderSchema).max(500),
});

/** A schedule, refusing reminders further ahead than the planner ever sends. */
export const scheduleRequestFor = (now: number) =>
  ScheduleRequestSchema.refine((schedule) =>
    schedule.reminders.every((r) => r.at <= now + MAX_AHEAD_MS),
  );
export type ScheduleRequest = z.infer<typeof ScheduleRequestSchema>;

export const UnsubscribeRequestSchema = z.object({
  endpoint: z.string().refine(isPushServiceEndpoint),
});
