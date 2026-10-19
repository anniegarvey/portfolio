import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ScheduleRequest } from "./schema";
import {
  deleteSchedule,
  loadAllSchedules,
  MAX_SCHEDULES,
  replaceSchedule,
  SCHEDULE_TTL_SECONDS,
  saveSchedule,
} from "./store";

const schedule = (n = 0): ScheduleRequest => ({
  subscription: {
    endpoint: `https://fcm.googleapis.com/fcm/send/${n}`,
    keys: { p256dh: "p", auth: "a" },
  },
  reminders: [{ at: 1, title: "Take meds", body: "", tag: "t" }],
});

// A tiny in-memory Redis answering the commands the store sends.
function fakeRedis() {
  const strings = new Map<string, string>();
  const ttls = new Map<string, number>();
  const sets = new Map<string, Set<string>>();
  const commands: (string | number)[][] = [];
  const setOf = (key: string) => {
    const set = sets.get(key) ?? new Set<string>();
    sets.set(key, set);
    return set;
  };
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    const command = JSON.parse(init.body as string) as (string | number)[];
    commands.push(command);
    const [name, ...args] = command.map(String);
    const handlers: Record<string, () => unknown> = {
      SET: () => {
        strings.set(args[0], args[1]);
        if (args[2] === "EX") ttls.set(args[0], Number(args[3]));
        return "OK";
      },
      GET: () => strings.get(args[0]) ?? null,
      DEL: () => Number(strings.delete(args[0])),
      SADD: () =>
        Number(!setOf(args[0]).has(args[1]) && !!setOf(args[0]).add(args[1])),
      SREM: () => args.slice(1).filter((m) => setOf(args[0]).delete(m)).length,
      SMEMBERS: () => [...setOf(args[0])],
      SISMEMBER: () => Number(setOf(args[0]).has(args[1])),
      SCARD: () => setOf(args[0]).size,
      // EVAL script numkeys key expected next ttl
      EVAL: () => {
        const [, , key, expected, next, ttl] = args;
        if (strings.get(key) !== expected) return null;
        strings.set(key, next);
        ttls.set(key, Number(ttl));
        return "OK";
      },
    };
    return new Response(JSON.stringify({ result: handlers[name]() }));
  });
  return { fetchMock, commands, strings, ttls, setOf };
}

describe("push schedule store", () => {
  let redis: ReturnType<typeof fakeRedis>;

  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    redis = fakeRedis();
    vi.stubGlobal("fetch", redis.fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("saves, loads and deletes schedules", async () => {
    expect(await saveSchedule(schedule())).toBe(true);
    const [loaded] = await loadAllSchedules();
    expect(loaded.schedule).toEqual(schedule());
    expect(loaded.raw).toBe(JSON.stringify(schedule()));

    await deleteSchedule(schedule().subscription.endpoint);
    expect(await loadAllSchedules()).toEqual([]);
  });

  it("authenticates with the token and keys by a hash of the endpoint", async () => {
    await saveSchedule(schedule());
    expect(redis.fetchMock.mock.calls[0][0]).toBe("https://redis.test");
    expect(redis.fetchMock.mock.calls[0][1].headers).toEqual({
      Authorization: "Bearer token",
    });
    const set = redis.commands.find((c) => c[0] === "SET");
    expect(set?.[1]).toMatch(/^push:schedule:[0-9a-f]{64}$/);
  });

  it("expires schedules that aren't refreshed", async () => {
    await saveSchedule(schedule());
    expect([...redis.ttls.values()]).toEqual([SCHEDULE_TTL_SECONDS]);
  });

  it("refuses new devices once full, but still updates known ones", async () => {
    for (let n = 0; n < MAX_SCHEDULES; n++) {
      expect(await saveSchedule(schedule(n))).toBe(true);
    }
    expect(await saveSchedule(schedule(MAX_SCHEDULES))).toBe(false);
    expect(await saveSchedule(schedule(0))).toBe(true);
  });

  it("forgets expired schedules when loading", async () => {
    await saveSchedule(schedule());
    redis.strings.clear(); // as if the key expired
    expect(await loadAllSchedules()).toEqual([]);
    expect(redis.setOf("push:schedules").size).toBe(0);
  });

  it("replaces a schedule only if it's unchanged since it was read", async () => {
    await saveSchedule(schedule());
    const [loaded] = await loadAllSchedules();
    const next = { ...schedule(), reminders: [] };

    expect(await replaceSchedule(loaded, next)).toBe(true);
    // The stored text has moved on, so the old read no longer matches.
    expect(await replaceSchedule(loaded, schedule())).toBe(false);
    expect((await loadAllSchedules())[0].schedule).toEqual(next);
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
