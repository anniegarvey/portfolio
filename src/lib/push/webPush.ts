import webpush from "web-push";
import { type Sender, SubscriptionGoneError } from "./send";

export function isPushConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

export const webPushSender: Sender = async (subscription, reminder) => {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: reminder.title,
        body: reminder.body,
        tag: reminder.tag,
      }),
      {
        vapidDetails: {
          subject: process.env.VAPID_SUBJECT ?? "mailto:noreply@example.com",
          publicKey: process.env.VAPID_PUBLIC_KEY ?? "",
          privateKey: process.env.VAPID_PRIVATE_KEY ?? "",
        },
        // Worth delivering a little late if the phone was offline, not later.
        TTL: 60 * 60,
      },
    );
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) throw new SubscriptionGoneError();
    throw error;
  }
};
