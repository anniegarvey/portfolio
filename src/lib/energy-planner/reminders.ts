import { checkIsActivityDue } from "@/hooks/dayPlanUtils";
import { toLocalDateString } from "@/lib/date";
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
    body: activity.description || "Time for this activity.",
    icon: "/icon-192.png",
    tag: `activity-reminder-${activity.id}`,
  };
  const registration = await navigator.serviceWorker?.getRegistration();
  if (registration) {
    await registration.showNotification(activity.title, options);
    return;
  }
  new Notification(activity.title, options);
}
