import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import webpush from "web-push";
import { SubscriptionGoneError } from "./send";
import { isPushConfigured, webPushSender } from "./webPush";

const subscription = {
  endpoint: "https://push/a",
  keys: { p256dh: "p", auth: "a" },
};
const reminder = { at: 1, title: "Take meds", body: "With water", tag: "t" };

describe("web push", () => {
  beforeEach(() => {
    vi.stubEnv("VAPID_PUBLIC_KEY", "public");
    vi.stubEnv("VAPID_PRIVATE_KEY", "private");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("is configured only with keys and storage set", () => {
    expect(isPushConfigured()).toBe(true);
    vi.stubEnv("VAPID_PRIVATE_KEY", "");
    expect(isPushConfigured()).toBe(false);
  });

  it("sends the reminder as the payload", async () => {
    const send = vi
      .spyOn(webpush, "sendNotification")
      .mockResolvedValue({} as webpush.SendResult);
    await webPushSender(subscription, reminder);
    expect(send).toHaveBeenCalledWith(
      subscription,
      JSON.stringify({ title: "Take meds", body: "With water", tag: "t" }),
      expect.objectContaining({
        timeout: 10_000,
        vapidDetails: expect.objectContaining({
          publicKey: "public",
          privateKey: "private",
        }),
      }),
    );
  });

  it.each([404, 410])("reports a %i subscription as gone", async (status) => {
    vi.spyOn(webpush, "sendNotification").mockRejectedValue({
      statusCode: status,
    });
    await expect(webPushSender(subscription, reminder)).rejects.toBeInstanceOf(
      SubscriptionGoneError,
    );
  });

  it("passes other failures on", async () => {
    vi.spyOn(webpush, "sendNotification").mockRejectedValue({
      statusCode: 500,
    });
    await expect(webPushSender(subscription, reminder)).rejects.toEqual({
      statusCode: 500,
    });
  });
});
