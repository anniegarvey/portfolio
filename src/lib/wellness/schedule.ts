import { toLocalDateString } from "@/lib/date";
import type { WellnessConfig, WellnessEntry } from "./schema";

export type Period = { start: string; end: string };

function parseDate(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);
  // Handle overflow (e.g. Jan 31 + 1 month → clamp to Feb 28/29)
  if (result.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    result.setDate(0);
  }
  return result;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Returns the [start, end) period that contains `date`, or null if `date` is
 * before the anchor.
 */
export function getPeriodForDate(
  config: WellnessConfig,
  date: string,
): Period | null {
  const anchor = parseDate(config.anchorDate);
  const target = parseDate(date);

  if (target < anchor) return null;

  const { frequency, unit } = config;

  if (unit === "days") {
    const index = Math.floor(diffDays(target, anchor) / frequency);
    const start = addDays(anchor, index * frequency);
    return {
      start: toLocalDateString(start),
      end: toLocalDateString(addDays(start, frequency)),
    };
  }

  if (unit === "weeks") {
    const periodDays = frequency * 7;
    const index = Math.floor(diffDays(target, anchor) / periodDays);
    const start = addDays(anchor, index * periodDays);
    return {
      start: toLocalDateString(start),
      end: toLocalDateString(addDays(start, periodDays)),
    };
  }

  // months
  const totalMonths =
    (target.getFullYear() - anchor.getFullYear()) * 12 +
    (target.getMonth() - anchor.getMonth());
  let index = Math.floor(totalMonths / frequency);

  let start = addMonths(anchor, index * frequency);
  let end = addMonths(start, frequency);

  // If anchor day > days in target month, addMonths may land past the target;
  // step back one period in that case.
  if (target < start) {
    index -= 1;
    start = addMonths(anchor, index * frequency);
    end = addMonths(start, frequency);
  }

  return { start: toLocalDateString(start), end: toLocalDateString(end) };
}

/**
 * Returns true when the check is enabled, today falls in an active period, and
 * no entry has been saved for that period yet.
 */
export function isCheckPending(
  config: WellnessConfig,
  entries: WellnessEntry[],
  today: string,
): boolean {
  if (!config.enabled) return false;
  const period = getPeriodForDate(config, today);
  if (!period) return false;
  return !entries.some((e) => e.date >= period.start && e.date < period.end);
}
