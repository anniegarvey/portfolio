import { createHash } from "node:crypto";
import type { ScheduleRequest } from "./schema";

const SET_KEY = "push:schedules";

// Abandoned devices drop out on their own. The planner rewrites its schedule
// every time it's opened, so only one left unopened this long expires.
export const SCHEDULE_TTL_SECONDS = 35 * 24 * 60 * 60;

// The schedule endpoint is open to anyone, so cap how many devices it holds
// to bound what a stranger can make the server store and send to.
export const MAX_SCHEDULES = 50;

// Replaces a schedule only if nobody has changed it since it was read, so the
// sender can't overwrite a newer list the planner saved meanwhile.
const COMPARE_AND_SET = `if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
end
return false`;

// Upstash Redis over its REST API: plain fetch, no client library or open
// connection, which suits a server that sleeps between requests.
async function redis<T>(command: (string | number)[]): Promise<T> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!(url && token)) throw new Error("Upstash Redis is not configured");
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Redis ${command[0]} failed`);
  const { result } = (await response.json()) as { result: T };
  return result;
}

const keyFor = (endpoint: string) =>
  `push:schedule:${createHash("sha256").update(endpoint).digest("hex")}`;

/** A stored schedule along with the exact text it was read as. */
export interface StoredSchedule {
  key: string;
  raw: string;
  schedule: ScheduleRequest;
}

/** Saves a device's schedule. False when the store is full of other devices. */
export async function saveSchedule(
  schedule: ScheduleRequest,
): Promise<boolean> {
  const key = keyFor(schedule.subscription.endpoint);
  const known = await redis<number>(["SISMEMBER", SET_KEY, key]);
  if (!known && (await redis<number>(["SCARD", SET_KEY])) >= MAX_SCHEDULES) {
    return false;
  }
  await redis([
    "SET",
    key,
    JSON.stringify(schedule),
    "EX",
    SCHEDULE_TTL_SECONDS,
  ]);
  await redis(["SADD", SET_KEY, key]);
  return true;
}

export async function deleteSchedule(endpoint: string): Promise<void> {
  const key = keyFor(endpoint);
  await redis(["DEL", key]);
  await redis(["SREM", SET_KEY, key]);
}

export async function loadAllSchedules(): Promise<StoredSchedule[]> {
  const keys = await redis<string[]>(["SMEMBERS", SET_KEY]);
  const values = await Promise.all(
    keys.map((key) => redis<string | null>(["GET", key])),
  );
  // Expired schedules leave their key behind in the set; tidy those up.
  const expired = keys.filter((_, i) => values[i] === null);
  if (expired.length > 0) await redis(["SREM", SET_KEY, ...expired]);
  return keys.flatMap((key, i) => {
    const raw = values[i];
    return raw === null
      ? []
      : [{ key, raw, schedule: JSON.parse(raw) as ScheduleRequest }];
  });
}

/**
 * Swaps in `next` if the schedule is still exactly as read. False means the
 * planner saved a newer one in between, which wins.
 */
export async function replaceSchedule(
  stored: StoredSchedule,
  next: ScheduleRequest,
): Promise<boolean> {
  const result = await redis<string | null>([
    "EVAL",
    COMPARE_AND_SET,
    1,
    stored.key,
    stored.raw,
    JSON.stringify(next),
    SCHEDULE_TTL_SECONDS,
  ]);
  return result === "OK";
}
