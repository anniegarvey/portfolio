import { describe, expect, it } from "vitest";
import {
  isPushServiceEndpoint,
  MAX_AHEAD_MS,
  scheduleRequestFor,
} from "./schema";

describe("isPushServiceEndpoint", () => {
  it.each([
    "https://fcm.googleapis.com/fcm/send/abc",
    "https://updates.push.services.mozilla.com/wpush/v2/abc",
    "https://web.push.apple.com/abc",
    "https://wns2-par02p.notify.windows.com/w/?token=abc",
  ])("accepts the browser push service %s", (endpoint) => {
    expect(isPushServiceEndpoint(endpoint)).toBe(true);
  });

  it.each([
    "http://fcm.googleapis.com/fcm/send/abc",
    "https://fcm.googleapis.com:8443/fcm/send/abc",
    "https://169.254.169.254/latest/meta-data",
    "https://localhost/x",
    "https://evil.example/push.apple.com",
    "https://push.apple.com.evil.example/x",
    "https://notpush.apple.com.example/x",
    "not a url",
  ])("refuses %s", (endpoint) => {
    expect(isPushServiceEndpoint(endpoint)).toBe(false);
  });
});

describe("scheduleRequestFor", () => {
  const NOW = 1_800_000_000_000;
  const request = (at: number) => ({
    subscription: {
      endpoint: "https://fcm.googleapis.com/fcm/send/abc",
      keys: { p256dh: "p", auth: "a" },
    },
    reminders: [{ at, title: "Take meds", body: "", tag: "t" }],
  });

  it("accepts reminders within the planner's horizon", () => {
    expect(
      scheduleRequestFor(NOW).safeParse(request(NOW + MAX_AHEAD_MS)).success,
    ).toBe(true);
  });

  it("refuses reminders further ahead", () => {
    expect(
      scheduleRequestFor(NOW).safeParse(request(NOW + MAX_AHEAD_MS + 1))
        .success,
    ).toBe(false);
  });
});
