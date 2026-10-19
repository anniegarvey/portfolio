import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as store from "@/lib/push/store";
import * as webPush from "@/lib/push/webPush";
import { GET } from "./config/route";
import { DELETE, PUT } from "./schedule/route";
import { POST } from "./send/route";

vi.mock("@/lib/push/store", () => ({
  saveSchedule: vi.fn(async () => true),
  deleteSchedule: vi.fn(async () => {}),
  loadAllSchedules: vi.fn(async () => []),
  replaceSchedule: vi.fn(async () => true),
}));

const ENDPOINT = "https://fcm.googleapis.com/fcm/send/a";

const schedule = {
  subscription: { endpoint: ENDPOINT, keys: { p256dh: "p", auth: "a" } },
  reminders: [{ at: 1, title: "Take meds", body: "", tag: "t" }],
};

const request = (method: string, body?: unknown, headers = {}) =>
  new Request("http://localhost/api/push", {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
  });

describe("push API", () => {
  beforeEach(() => {
    vi.stubEnv("VAPID_PUBLIC_KEY", "public");
    vi.stubEnv("VAPID_PRIVATE_KEY", "private");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    vi.stubEnv("CRON_SECRET", "secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe("config", () => {
    it("gives the public key when push is set up", async () => {
      expect(await GET().json()).toEqual({
        enabled: true,
        publicKey: "public",
      });
    });

    it("says push is off otherwise", async () => {
      vi.stubEnv("VAPID_PUBLIC_KEY", "");
      expect(await GET().json()).toEqual({ enabled: false });
    });
  });

  describe("schedule", () => {
    it("saves a valid schedule", async () => {
      const response = await PUT(request("PUT", schedule));
      expect(response.status).toBe(204);
      expect(store.saveSchedule).toHaveBeenCalledWith(schedule);
    });

    it.each([
      ["missing a subscription", { reminders: [] }],
      [
        "pointing at a host that isn't a push service",
        {
          ...schedule,
          subscription: {
            ...schedule.subscription,
            endpoint: "https://169.254.169.254/x",
          },
        },
      ],
      [
        "reaching years ahead",
        {
          ...schedule,
          reminders: [{ ...schedule.reminders[0], at: Date.now() + 1e12 }],
        },
      ],
      ["that isn't JSON", "{not json"],
    ])("rejects a schedule %s", async (_, body) => {
      const response = await PUT(request("PUT", body));
      expect(response.status).toBe(400);
      expect(store.saveSchedule).not.toHaveBeenCalled();
    });

    it("refuses a new device once the store is full", async () => {
      vi.mocked(store.saveSchedule).mockResolvedValueOnce(false);
      expect((await PUT(request("PUT", schedule))).status).toBe(429);
    });

    it("deletes a device's schedule", async () => {
      const response = await DELETE(request("DELETE", { endpoint: ENDPOINT }));
      expect(response.status).toBe(204);
      expect(store.deleteSchedule).toHaveBeenCalledWith(ENDPOINT);
    });

    it("rejects an invalid delete", async () => {
      const response = await DELETE(request("DELETE", { endpoint: "x" }));
      expect(response.status).toBe(400);
    });

    it("refuses while push isn't set up", async () => {
      vi.stubEnv("VAPID_PRIVATE_KEY", "");
      expect((await PUT(request("PUT", schedule))).status).toBe(503);
      expect(
        (await DELETE(request("DELETE", { endpoint: ENDPOINT }))).status,
      ).toBe(503);
    });
  });

  describe("send", () => {
    const authorized = { authorization: "Bearer secret" };

    it("needs the cron secret", async () => {
      expect((await POST(request("POST"))).status).toBe(401);
      expect(
        (await POST(request("POST", undefined, { authorization: "Bearer x" })))
          .status,
      ).toBe(401);
    });

    it("refuses when no secret is configured", async () => {
      vi.stubEnv("CRON_SECRET", "");
      expect(
        (await POST(request("POST", undefined, { authorization: "Bearer " })))
          .status,
      ).toBe(401);
    });

    it("refuses while push isn't set up", async () => {
      vi.stubEnv("VAPID_PRIVATE_KEY", "");
      expect((await POST(request("POST", undefined, authorized))).status).toBe(
        503,
      );
    });

    it("sends due reminders and reports the counts", async () => {
      const due = { ...schedule.reminders[0], at: Date.now() - 1000 };
      const entry = {
        key: "k",
        raw: "r",
        schedule: { ...schedule, reminders: [due] },
      };
      vi.mocked(store.loadAllSchedules).mockResolvedValue([entry]);
      const sender = vi
        .spyOn(webPush, "webPushSender")
        .mockResolvedValue(undefined);

      const response = await POST(request("POST", undefined, authorized));

      expect(await response.json()).toEqual({ sent: 1, failed: 0 });
      expect(store.replaceSchedule).toHaveBeenCalledWith(entry, {
        ...schedule,
        reminders: [],
      });
      expect(sender).toHaveBeenCalledWith(schedule.subscription, due);
    });
  });
});
