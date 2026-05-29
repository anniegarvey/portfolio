import { beforeEach, describe, expect, it } from "vitest";
import type { WellnessConfig, WellnessEntry } from "./schema";
import { DEFAULT_WELLNESS_METRICS } from "./schema";
import {
  fetchWellnessConfig,
  fetchWellnessEntries,
  storeWellnessConfig,
  storeWellnessEntries,
} from "./storage";

const config: WellnessConfig = {
  enabled: true,
  anchorDate: "2024-01-01",
  frequency: 1,
  unit: "weeks",
  metrics: DEFAULT_WELLNESS_METRICS,
};

const entry: WellnessEntry = {
  id: "a3f8d1c2-0000-4f9a-8c6d-1e2f3a4b0001",
  date: "2024-01-03",
  metrics: [
    {
      metricId: DEFAULT_WELLNESS_METRICS[0].id,
      label: DEFAULT_WELLNESS_METRICS[0].label,
      value: 4,
    },
  ],
};

describe("wellness storage", () => {
  beforeEach(async () => {
    // Each test gets a clean slate via fake-indexeddb's per-file isolation.
    // Storing then overwriting is the simplest reset.
    await storeWellnessEntries([]);
  });

  it("returns undefined when no config stored", async () => {
    expect(await fetchWellnessConfig()).toBeUndefined();
  });

  it("round-trips a config", async () => {
    await storeWellnessConfig(config);
    const loaded = await fetchWellnessConfig();
    expect(loaded).toEqual(config);
  });

  it("returns empty array when no entries stored", async () => {
    expect(await fetchWellnessEntries()).toEqual([]);
  });

  it("round-trips entries", async () => {
    await storeWellnessEntries([entry]);
    const loaded = await fetchWellnessEntries();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(entry);
  });

  it("overwrites entries on subsequent store", async () => {
    await storeWellnessEntries([entry]);
    await storeWellnessEntries([]);
    expect(await fetchWellnessEntries()).toEqual([]);
  });
});
