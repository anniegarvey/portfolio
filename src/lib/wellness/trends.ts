import type { WellnessEntry, WellnessMetric } from "./schema";

export type TrendPoint = { date: string; value: number | null };

export type MetricSeries = {
  metricId: string;
  label: string;
  points: TrendPoint[];
  isHistoricalOnly: boolean;
};

/**
 * Turns wellness entries + current metric config into per-metric chartable series.
 * Config metrics come first (in config order), then historical-only metrics
 * (deleted from config but still referenced in entries) in order of first appearance.
 * Only metrics that appear in at least one entry are included.
 */
export function buildTrends(
  entries: WellnessEntry[],
  configMetrics: WellnessMetric[],
): MetricSeries[] {
  if (entries.length === 0) return [];

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  const configIdSet = new Set(configMetrics.map((m) => m.id));
  const configLabelMap = new Map(configMetrics.map((m) => [m.id, m.label]));

  // Collect historical metrics in order of first appearance across all entries
  const historicalOrder: { id: string; label: string }[] = [];
  const seenHistorical = new Set<string>();
  for (const entry of sorted) {
    for (const em of entry.metrics) {
      if (!(configIdSet.has(em.metricId) || seenHistorical.has(em.metricId))) {
        historicalOrder.push({ id: em.metricId, label: em.label });
        seenHistorical.add(em.metricId);
      }
    }
  }

  const allMetrics: { id: string; label: string; isHistoricalOnly: boolean }[] =
    [
      ...configMetrics.map((m) => ({
        id: m.id,
        label: m.label,
        isHistoricalOnly: false,
      })),
      ...historicalOrder.map((m) => ({ ...m, isHistoricalOnly: true })),
    ];

  return allMetrics
    .filter((m) =>
      sorted.some((e) => e.metrics.some((em) => em.metricId === m.id)),
    )
    .map(({ id, label, isHistoricalOnly }) => ({
      metricId: id,
      label: isHistoricalOnly ? label : (configLabelMap.get(id) ?? label),
      isHistoricalOnly,
      points: sorted.map((entry) => {
        const found = entry.metrics.find((em) => em.metricId === id);
        return { date: entry.date, value: found?.value ?? null };
      }),
    }));
}
