"use client";

import { useEffect, useEffectEvent } from "react";
import { getTodayDateString } from "@/lib/date";
import {
  getPushSubscription,
  syncPushReminders,
} from "@/lib/energy-planner/pushReminders";
import {
  getUpcomingReminders,
  nextDates,
} from "@/lib/energy-planner/reminders";
import type { Activity, DayPlan } from "@/lib/energy-planner/schema";
import { fetchDayPlanForDate } from "./utils";

// How far ahead the server is told about. Reopening the planner refreshes it,
// so reminders only stop if the planner goes unopened for this long.
export const PUSH_HORIZON_DAYS = 30;

// Day plans are saved to storage just after they change; wait for that.
const SYNC_DELAY_MS = 1000;

/**
 * Keeps the server's list of upcoming reminders in step with the planner, so
 * push notifications can arrive while it's closed. Does nothing on a device
 * that hasn't subscribed to push.
 */
export function usePushReminderSync(
  oneOffActivities: Activity[],
  repeatingActivities: Activity[],
  dayPlan: DayPlan,
) {
  const sync = useEffectEvent(async () => {
    const subscription = await getPushSubscription();
    if (!subscription) return;

    const dates = nextDates(getTodayDateString(), PUSH_HORIZON_DAYS);
    const plans = await Promise.all(dates.map(fetchDayPlanForDate));
    const reminders = getUpcomingReminders(
      [...oneOffActivities, ...repeatingActivities],
      new Map(dates.map((date, i) => [date, plans[i]])),
      new Date(),
    );
    await syncPushReminders(subscription, reminders);
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-sync on change
  useEffect(() => {
    const timeout = setTimeout(() => {
      sync().catch(() => {
        // Offline or server asleep: the next change or visit syncs again.
      });
    }, SYNC_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [oneOffActivities, repeatingActivities, dayPlan]);
}
