import { createStore, get, set } from "idb-keyval";
import type { WellnessConfig, WellnessEntry } from "./schema";

const store = createStore("wellness-db", "data");

const KEYS = {
  config: "config",
  entries: "entries",
} as const;

export async function fetchWellnessConfig(): Promise<
  WellnessConfig | undefined
> {
  return get<WellnessConfig>(KEYS.config, store);
}

export async function storeWellnessConfig(
  config: WellnessConfig,
): Promise<void> {
  await set(KEYS.config, config, store);
}

export async function fetchWellnessEntries(): Promise<WellnessEntry[]> {
  const entries = await get<WellnessEntry[]>(KEYS.entries, store);
  return entries ?? [];
}

export async function storeWellnessEntries(
  entries: WellnessEntry[],
): Promise<void> {
  await set(KEYS.entries, entries, store);
}
