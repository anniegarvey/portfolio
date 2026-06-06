import { v4 as uuidv4 } from "uuid";
import type { WellnessConfig, WellnessEntry } from "./schema";

export function buildEntry(
  config: WellnessConfig,
  responses: Record<string, number | null>,
  note: string,
  date: string,
): WellnessEntry {
  const metrics = config.metrics.map((m) => ({
    metricId: m.id,
    label: m.label,
    value: responses[m.id] ?? null,
  }));
  const entry: WellnessEntry = { id: uuidv4(), date, metrics };
  const trimmed = note.trim();
  if (trimmed) entry.note = trimmed;
  return entry;
}

export function isEntryFilled(
  responses: Record<string, number | null>,
  note: string,
): boolean {
  return (
    Object.values(responses).some((v) => v !== null) || note.trim().length > 0
  );
}
