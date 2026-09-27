"use client";

import { useEffect, useEffectEvent } from "react";
import { toLocalDateString } from "@/lib/date";
import {
  canNotify,
  getDueReminders,
  markRemindersSent,
  readSentReminders,
  showReminder,
} from "@/lib/energy-planner/reminders";
import type { Activity } from "@/lib/energy-planner/schema";
import { fetchDayPlanForDate } from "./utils";

const CHECK_INTERVAL_MS = 30_000;

/**
 * Sends a notification when an activity's reminder time arrives, if it's on
 * today's plan and not yet done. Runs only while the planner is open: with no
 * backend there's nothing to wake a closed tab.
 */
export function useActivityReminders(
  oneOffActivities: Activity[],
  repeatingActivities: Activity[],
) {
  const check = useEffectEvent(async () => {
    const activities = [...oneOffActivities, ...repeatingActivities];
    if (!canNotify() || Notification.permission !== "granted") return;
    if (!activities.some((a) => a.reminderTime)) return;

    const now = new Date();
    const today = toLocalDateString(now);
    const todayPlan = await fetchDayPlanForDate(today);
    const due = getDueReminders(
      activities,
      todayPlan,
      now,
      readSentReminders(today),
    );
    if (due.length === 0) return;

    markRemindersSent(
      today,
      due.map((a) => a.id),
    );
    await Promise.all(due.map(showReminder));
  });

  useEffect(() => {
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Check straight away once activities load or a reminder time changes,
  // rather than waiting for the next tick.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run on change
  useEffect(() => {
    check();
  }, [oneOffActivities, repeatingActivities]);
}
