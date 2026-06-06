import { describe, expect, it } from "vitest";
import { buildEntry, isEntryFilled } from "./entry";
import type { WellnessConfig } from "./schema";
import { DEFAULT_WELLNESS_METRICS } from "./schema";

const BASE_CONFIG: WellnessConfig = {
  enabled: true,
  anchorDate: "2026-01-01",
  frequency: 1,
  unit: "weeks",
  metrics: DEFAULT_WELLNESS_METRICS,
};

const METRIC_ID = DEFAULT_WELLNESS_METRICS[0].id;

describe("isEntryFilled", () => {
  it("returns false when all responses are null and note is empty", () => {
    expect(isEntryFilled({ [METRIC_ID]: null }, "")).toBe(false);
  });

  it("returns true when at least one response has a rating", () => {
    expect(isEntryFilled({ [METRIC_ID]: 3 }, "")).toBe(true);
  });

  it("returns true when note is non-empty and all responses are null", () => {
    expect(isEntryFilled({ [METRIC_ID]: null }, "Feeling good")).toBe(true);
  });

  it("returns false when note is whitespace-only and all responses are null", () => {
    expect(isEntryFilled({ [METRIC_ID]: null }, "   ")).toBe(false);
  });

  it("returns true when both a rating and a note are present", () => {
    expect(isEntryFilled({ [METRIC_ID]: 5 }, "Great day")).toBe(true);
  });
});

describe("buildEntry", () => {
  it("snapshots the metric label from config at call time", () => {
    const entry = buildEntry(BASE_CONFIG, { [METRIC_ID]: 4 }, "", "2026-01-01");
    expect(entry.metrics[0].label).toBe("Overall mood");
    expect(entry.metrics[0].metricId).toBe(METRIC_ID);
  });

  it("uses the supplied date", () => {
    const entry = buildEntry(BASE_CONFIG, { [METRIC_ID]: 2 }, "", "2026-03-15");
    expect(entry.date).toBe("2026-03-15");
  });

  it("assigns a unique id on each call", () => {
    const a = buildEntry(BASE_CONFIG, { [METRIC_ID]: 1 }, "", "2026-01-01");
    const b = buildEntry(BASE_CONFIG, { [METRIC_ID]: 1 }, "", "2026-01-01");
    expect(a.id).not.toBe(b.id);
  });

  it("unanswered metrics get value null", () => {
    const config: WellnessConfig = {
      ...BASE_CONFIG,
      metrics: [
        ...DEFAULT_WELLNESS_METRICS,
        {
          id: "b3f8d1c2-7b4e-4f9a-8c6d-1e2f3a4b5c6e",
          label: "Sleep quality",
        },
      ],
    };
    const entry = buildEntry(config, { [METRIC_ID]: 3 }, "", "2026-01-01");
    expect(entry.metrics[0].value).toBe(3);
    expect(entry.metrics[1].value).toBeNull();
  });

  it("omits note when note is empty", () => {
    const entry = buildEntry(BASE_CONFIG, { [METRIC_ID]: 3 }, "", "2026-01-01");
    expect(entry.note).toBeUndefined();
  });

  it("omits note when note is whitespace-only", () => {
    const entry = buildEntry(
      BASE_CONFIG,
      { [METRIC_ID]: 3 },
      "  ",
      "2026-01-01",
    );
    expect(entry.note).toBeUndefined();
  });

  it("trims and includes note when non-empty", () => {
    const entry = buildEntry(
      BASE_CONFIG,
      { [METRIC_ID]: 3 },
      " Great day ",
      "2026-01-01",
    );
    expect(entry.note).toBe("Great day");
  });

  it("includes all metrics in order", () => {
    const entry = buildEntry(BASE_CONFIG, { [METRIC_ID]: 5 }, "", "2026-01-01");
    expect(entry.metrics).toHaveLength(1);
    expect(entry.metrics[0].value).toBe(5);
  });
});
