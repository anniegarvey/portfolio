import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ScheduleRequest } from "./schema";
import { deleteSchedule, loadAllSchedules, saveSchedule } from "./store";

const schedule: ScheduleRequest = {
  subscription: {
    endpoint: "https://push/a",
    keys: { p256dh: "p", auth: "a" },
  },
  reminders: [{ at: 1, title: "Take meds", body: "", tag: "t" }],
};

// A tiny in-memory Redis answering the commands the store sends.
function fakeRedis() {
  const strings = new Map<string, string>();
  const sets = new Map<string, Set<string>>();
  const commands: unknown[][] = [];
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    const [name, key, value] = JSON.parse(init.body as string) as string[];
    commands.push([name, key]);
    const set = sets.get(key) ?? new Set<string>();
    sets.set(key, set);
    const handlers: Record<string, () => unknown> = {
      SET: () => strings.set(key, value) && "OK",
      GET: () => strings.get(key) ?? null,
      DEL: () => Number(strings.delete(key)),
      SADD: () => set.add(value) && 1,
      SREM: () => Number(set.delete(value)),
      SMEMBERS: () => [...set],
    };
    const result = handlers[name]?.();
    return new Response(JSON.stringify({ result }));
  });
  return { fetchMock, commands, strings };
}

describe("push schedule store", () => {
  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("saves, loads and deletes schedules", async () => {
    const { fetchMock } = fakeRedis();
    vi.stubGlobal("fetch", fetchMock);

    await saveSchedule(schedule);
    expect(await loadAllSchedules()).toEqual([schedule]);

    await deleteSchedule(schedule.subscription.endpoint);
    expect(await loadAllSchedules()).toEqual([]);
  });

  it("authenticates with the token and keys by a hash of the endpoint", async () => {
    const { fetchMock, commands } = fakeRedis();
    vi.stubGlobal("fetch", fetchMock);

    await saveSchedule(schedule);

    expect(fetchMock.mock.calls[0][0]).toBe("https://redis.test");
    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      Authorization: "Bearer token",
    });
    expect(commands[0][1]).toMatch(/^push:schedule:[0-9a-f]{64}$/);
  });

  it("fails when Redis isn't configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    await expect(loadAllSchedules()).rejects.toThrow("not configured");
  });

  it("fails when Redis returns an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );
    await expect(loadAllSchedules()).rejects.toThrow("SMEMBERS failed");
  });
});
