import { createHash } from "node:crypto";
import type { ScheduleRequest } from "./schema";

const SET_KEY = "push:schedules";

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

export async function saveSchedule(schedule: ScheduleRequest): Promise<void> {
  const key = keyFor(schedule.subscription.endpoint);
  await redis(["SET", key, JSON.stringify(schedule)]);
  await redis(["SADD", SET_KEY, key]);
}

export async function deleteSchedule(endpoint: string): Promise<void> {
  const key = keyFor(endpoint);
  await redis(["DEL", key]);
  await redis(["SREM", SET_KEY, key]);
}

export async function loadAllSchedules(): Promise<ScheduleRequest[]> {
  const keys = await redis<string[]>(["SMEMBERS", SET_KEY]);
  const values = await Promise.all(
    keys.map((key) => redis<string | null>(["GET", key])),
  );
  return values
    .filter((value): value is string => value !== null)
    .map((value) => JSON.parse(value) as ScheduleRequest);
}
