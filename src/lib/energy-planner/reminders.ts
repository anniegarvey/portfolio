import { checkIsActivityDue } from "@/hooks/dayPlanUtils";
import { getNextDay, toLocalDateString } from "@/lib/date";
import type { Activity, DayPlan } from "./schema";

// A reminder still fires if the planner opens (or the device wakes) up to an
// hour after its time, but not later: opening the app in the evening shouldn't
// replay every reminder from the morning.
export const REMINDER_GRACE_MINUTES = 60;

const SENT_KEY = "energy-planner-reminders-sent";

function minutesOfDay(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Mirrors projection: a concrete instance in today's plan decides on its own
// completed state; otherwise a repeating activity counts if it's due today and
// wasn't skipped.
function isPlannedAndOpen(
  activity: Activity,
  plan: DayPlan | null,
  today: string,
): boolean {
  const instance = plan?.plannedInstances.find(
    (i) => i.sourceActivityId === activity.id,
  );
  if (instance) return !instance.completed;
  if (plan?.skippedSourceActivityIds?.includes(activity.id)) return false;
  return checkIsActivityDue(activity, today);
}

/**
 * Activities whose reminder should fire now: they have a reminder time within
 * the grace window, are on today's plan and not yet complete, and haven't
 * already been notified today.
 */
export function getDueReminders(
  activities: Activity[],
  todayPlan: DayPlan | null,
  now: Date,
  sentIds: string[],
): Activity[] {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return activities.filter((activity) => {
    if (!activity.reminderTime || sentIds.includes(activity.id)) return false;
    const elapsed = nowMinutes - minutesOfDay(activity.reminderTime);
    if (elapsed < 0 || elapsed >= REMINDER_GRACE_MINUTES) return false;
    return isPlannedAndOpen(activity, todayPlan, toLocalDateString(now));
  });
}

export interface UpcomingReminder {
  at: number; // epoch milliseconds
  title: string;
  body: string;
  tag: string;
}

const GENERIC_BODY = "Time for this activity.";

export function reminderBody(activity: Activity): string {
  return activity.description || GENERIC_BODY;
}

// Same tag as the in-page reminder, so if both arrive the second replaces the
// first instead of showing twice.
export const reminderTag = (activityId: string) =>
  `activity-reminder-${activityId}`;

/**
 * Every reminder still to come over the given dates (today first), for the
 * server to send while the planner is closed. Uses the same planned-and-open
 * rule as the in-page check, against each date's stored plan.
 */
export function getUpcomingReminders(
  activities: Activity[],
  plansByDate: Map<string, DayPlan | null>,
  now: Date,
): UpcomingReminder[] {
  const upcoming: UpcomingReminder[] = [];
  for (const [date, plan] of plansByDate) {
    for (const activity of activities) {
      if (!activity.reminderTime) continue;
      const at = new Date(`${date}T${activity.reminderTime}:00`).getTime();
      if (at <= now.getTime()) continue;
      if (!isPlannedAndOpen(activity, plan, date)) continue;
      upcoming.push({
        at,
        title: activity.title,
        // Descriptions stay on the device: the server only needs a title.
        body: GENERIC_BODY,
        tag: reminderTag(activity.id),
      });
    }
  }
  return upcoming.sort((a, b) => a.at - b.at);
}

export function nextDates(from: string, count: number): string[] {
  const dates = [from];
  while (dates.length < count) dates.push(getNextDay(dates[dates.length - 1]));
  return dates;
}

// Which reminders have fired today, kept across reloads so a refresh doesn't
// repeat them. Resets itself when the date changes.
export function readSentReminders(today: string): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(SENT_KEY) ?? "null");
    return stored?.date === today ? stored.ids : [];
  } catch {
    return [];
  }
}

export function markRemindersSent(today: string, ids: string[]): void {
  try {
    const sent = [...readSentReminders(today), ...ids];
    localStorage.setItem(SENT_KEY, JSON.stringify({ date: today, ids: sent }));
  } catch {
    // Storage unavailable: worst case a reminder repeats after a reload.
  }
}

export function canNotify(): boolean {
  return typeof Notification !== "undefined";
}

// Android Chrome only allows notifications through a service worker, so use
// the registered one when there is one and fall back to the page API.
export async function showReminder(activity: Activity): Promise<void> {
  const options: NotificationOptions = {
    body: reminderBody(activity),
    icon: "/icon-192.png",
    tag: reminderTag(activity.id),
  };
  const registration = await navigator.serviceWorker?.getRegistration();
  if (registration) {
    await registration.showNotification(activity.title, options);
    return;
  }
  new Notification(activity.title, options);
}
