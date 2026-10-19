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

export const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});
export type StoredSubscription = z.infer<typeof PushSubscriptionSchema>;

export const ScheduleRequestSchema = z.object({
  subscription: PushSubscriptionSchema,
  reminders: z.array(PushReminderSchema).max(500),
});
export type ScheduleRequest = z.infer<typeof ScheduleRequestSchema>;

export const UnsubscribeRequestSchema = z.object({
  endpoint: z.string().url(),
});
