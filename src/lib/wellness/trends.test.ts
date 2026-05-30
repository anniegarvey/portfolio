import { describe, expect, it } from "vitest";
import type { WellnessEntry, WellnessMetric } from "./schema";
import { buildTrends } from "./trends";

const metricA: WellnessMetric = { id: "aaa", label: "Mood" };
const metricB: WellnessMetric = { id: "bbb", label: "Energy" };

function makeEntry(
  id: string,
  date: string,
  ratings: { metricId: string; label: string; value: number | null }[],
): WellnessEntry {
  return { id, date, metrics: ratings };
}

describe("buildTrends", () => {
  it("returns empty array when there are no entries", () => {
    expect(buildTrends([], [metricA])).toEqual([]);
  });

  it("returns empty array when there are no entries and no config metrics", () => {
    expect(buildTrends([], [])).toEqual([]);
  });

  it("returns a single series with one point for one entry", () => {
    const entries = [
      makeEntry("e1", "2024-01-01", [
        { metricId: "aaa", label: "Mood", value: 3 },
      ]),
    ];
    const result = buildTrends(entries, [metricA]);
    expect(result).toHaveLength(1);
    expect(result[0].metricId).toBe("aaa");
    expect(result[0].label).toBe("Mood");
    expect(result[0].isHistoricalOnly).toBe(false);
    expect(result[0].points).toEqual([{ date: "2024-01-01", value: 3 }]);
  });

  it("sorts entries chronologically regardless of input order", () => {
    const entries = [
      makeEntry("e2", "2024-01-03", [
        { metricId: "aaa", label: "Mood", value: 5 },
      ]),
      makeEntry("e1", "2024-01-01", [
        { metricId: "aaa", label: "Mood", value: 2 },
      ]),
    ];
    const result = buildTrends(entries, [metricA]);
    expect(result[0].points[0]).toEqual({ date: "2024-01-01", value: 2 });
    expect(result[0].points[1]).toEqual({ date: "2024-01-03", value: 5 });
  });

  it("produces null point when a metric is absent from an entry (honest gap)", () => {
    const entries = [
      makeEntry("e1", "2024-01-01", [
        { metricId: "aaa", label: "Mood", value: 3 },
      ]),
      makeEntry("e2", "2024-01-08", [
        { metricId: "bbb", label: "Energy", value: 4 },
      ]),
    ];
    const result = buildTrends(entries, [metricA, metricB]);

    const moodSeries = result.find((s) => s.metricId === "aaa");
    expect(moodSeries?.points).toEqual([
      { date: "2024-01-01", value: 3 },
      { date: "2024-01-08", value: null },
    ]);

    const energySeries = result.find((s) => s.metricId === "bbb");
    expect(energySeries?.points).toEqual([
      { date: "2024-01-01", value: null },
      { date: "2024-01-08", value: 4 },
    ]);
  });

  it("produces null point when metric value was explicitly null (unanswered)", () => {
    const entries = [
      makeEntry("e1", "2024-01-01", [
        { metricId: "aaa", label: "Mood", value: null },
      ]),
    ];
    const result = buildTrends(entries, [metricA]);
    expect(result[0].points[0].value).toBeNull();
  });

  it("marks a deleted metric as isHistoricalOnly", () => {
    const entries = [
      makeEntry("e1", "2024-01-01", [
        { metricId: "old-metric", label: "Old metric", value: 2 },
      ]),
    ];
    const result = buildTrends(entries, [metricA]);

    const historical = result.find((s) => s.metricId === "old-metric");
    expect(historical?.isHistoricalOnly).toBe(true);
    expect(historical?.label).toBe("Old metric");
  });

  it("excludes config metrics that have no entries", () => {
    const entries = [
      makeEntry("e1", "2024-01-01", [
        { metricId: "aaa", label: "Mood", value: 3 },
      ]),
    ];
    const result = buildTrends(entries, [metricA, metricB]);
    expect(result.find((s) => s.metricId === "bbb")).toBeUndefined();
  });

  it("uses the current config label for active metrics, not the snapshotted label", () => {
    const entries = [
      makeEntry("e1", "2024-01-01", [
        { metricId: "aaa", label: "Old label", value: 3 },
      ]),
    ];
    const renamedMetric: WellnessMetric = { id: "aaa", label: "New label" };
    const result = buildTrends(entries, [renamedMetric]);
    expect(result[0].label).toBe("New label");
  });

  it("orders config metrics before historical-only metrics", () => {
    const entries = [
      makeEntry("e1", "2024-01-01", [
        { metricId: "historical", label: "Old", value: 1 },
        { metricId: "aaa", label: "Mood", value: 3 },
      ]),
    ];
    const result = buildTrends(entries, [metricA]);
    expect(result[0].metricId).toBe("aaa");
    expect(result[1].metricId).toBe("historical");
  });

  it("handles multiple metrics across multiple entries", () => {
    const entries = [
      makeEntry("e1", "2024-01-01", [
        { metricId: "aaa", label: "Mood", value: 3 },
        { metricId: "bbb", label: "Energy", value: 4 },
      ]),
      makeEntry("e2", "2024-01-08", [
        { metricId: "aaa", label: "Mood", value: 5 },
        { metricId: "bbb", label: "Energy", value: 2 },
      ]),
    ];
    const result = buildTrends(entries, [metricA, metricB]);
    expect(result).toHaveLength(2);
    expect(result[0].points).toHaveLength(2);
    expect(result[1].points).toHaveLength(2);
  });
});
