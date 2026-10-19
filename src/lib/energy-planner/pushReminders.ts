import type { UpcomingReminder } from "./reminders";

// Push lets the server deliver reminders while the planner is closed. It needs
// a service worker (production only), PushManager (on iPhone, only once the
// planner is added to the Home Screen) and the server to have push set up.

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator && "PushManager" in window)) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

async function fetchPublicKey(): Promise<string | null> {
  try {
    const response = await fetch("/api/push/config");
    const config = (await response.json()) as {
      enabled: boolean;
      publicKey?: string;
    };
    return config.enabled && config.publicKey ? config.publicKey : null;
  } catch {
    return null;
  }
}

/** The existing push subscription, if this device has one. */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  const registration = await getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
}

/**
 * Subscribes this device to push if it can be, returning whether reminders
 * will now arrive with the planner closed. Needs notification permission.
 */
export async function enablePush(): Promise<boolean> {
  const registration = await getRegistration();
  if (!registration) return false;
  if (await registration.pushManager.getSubscription()) return true;
  const publicKey = await fetchPublicKey();
  if (!publicKey) return false;
  try {
    await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey,
    });
    return true;
  } catch {
    return false;
  }
}

/** Replaces the server's copy of this device's upcoming reminders. */
export async function syncPushReminders(
  subscription: PushSubscription,
  reminders: UpcomingReminder[],
): Promise<void> {
  await fetch("/api/push/schedule", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: subscription.toJSON(), reminders }),
  });
}
