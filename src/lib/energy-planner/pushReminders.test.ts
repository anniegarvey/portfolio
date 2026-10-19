import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  enablePush,
  getPushSubscription,
  syncPushReminders,
} from "./pushReminders";

function stubBrowser({
  subscription = null as PushSubscription | null,
  registered = true,
  subscribe = vi.fn(async () => ({}) as PushSubscription),
} = {}) {
  const pushManager = {
    getSubscription: vi.fn(async () => subscription),
    subscribe,
  };
  vi.stubGlobal("navigator", {
    serviceWorker: {
      getRegistration: async () => (registered ? { pushManager } : undefined),
    },
  });
  return pushManager;
}

function stubConfig(config: object) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(config)));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("push reminders client", () => {
  beforeEach(() => {
    Object.assign(window, { PushManager: class {} });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    // biome-ignore lint/suspicious/noExplicitAny: removing a test stub
    delete (window as any).PushManager;
  });

  describe("getPushSubscription", () => {
    it("returns the device's subscription", async () => {
      const subscription = {} as PushSubscription;
      stubBrowser({ subscription });
      expect(await getPushSubscription()).toBe(subscription);
    });

    it("is null without a service worker", async () => {
      stubBrowser({ registered: false });
      expect(await getPushSubscription()).toBeNull();
    });

    it("is null where push isn't supported", async () => {
      // biome-ignore lint/suspicious/noExplicitAny: removing a test stub
      delete (window as any).PushManager;
      expect(await getPushSubscription()).toBeNull();
    });
  });

  describe("enablePush", () => {
    it("subscribes with the server's public key", async () => {
      const pushManager = stubBrowser();
      stubConfig({ enabled: true, publicKey: "public" });
      expect(await enablePush()).toBe(true);
      expect(pushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: "public",
      });
    });

    it("keeps an existing subscription", async () => {
      const pushManager = stubBrowser({ subscription: {} as PushSubscription });
      expect(await enablePush()).toBe(true);
      expect(pushManager.subscribe).not.toHaveBeenCalled();
    });

    it("can't without a service worker", async () => {
      stubBrowser({ registered: false });
      expect(await enablePush()).toBe(false);
    });

    it("can't while the server has push turned off", async () => {
      const pushManager = stubBrowser();
      stubConfig({ enabled: false });
      expect(await enablePush()).toBe(false);
      expect(pushManager.subscribe).not.toHaveBeenCalled();
    });

    it("can't when the server can't be reached", async () => {
      stubBrowser();
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          throw new Error("offline");
        }),
      );
      expect(await enablePush()).toBe(false);
    });

    it("can't when the browser refuses to subscribe", async () => {
      stubBrowser({
        subscribe: vi.fn(async () => {
          throw new Error("denied");
        }),
      });
      stubConfig({ enabled: true, publicKey: "public" });
      expect(await enablePush()).toBe(false);
    });
  });

  it("sends the subscription and reminders to the server", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const subscription = {
      toJSON: () => ({ endpoint: "https://push/a" }),
    } as PushSubscription;
    const reminders = [{ at: 1, title: "Take meds", body: "", tag: "t" }];

    await syncPushReminders(subscription, reminders);

    expect(fetchMock).toHaveBeenCalledWith("/api/push/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: { endpoint: "https://push/a" },
        reminders,
      }),
    });
  });
});
