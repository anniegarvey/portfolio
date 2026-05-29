import { describe, expect, it } from "vitest";
import { getPeriodForDate, isCheckPending } from "./schedule";
import type { WellnessConfig, WellnessEntry } from "./schema";
import { DEFAULT_WELLNESS_METRICS } from "./schema";

const baseConfig: WellnessConfig = {
  enabled: true,
  anchorDate: "2024-01-01",
  frequency: 1,
  unit: "weeks",
  metrics: DEFAULT_WELLNESS_METRICS,
};

describe("getPeriodForDate", () => {
  it("returns null when date is before anchor", () => {
    expect(getPeriodForDate(baseConfig, "2023-12-31")).toBeNull();
  });

  it("returns the anchor day itself as period start", () => {
    const period = getPeriodForDate(baseConfig, "2024-01-01");
    expect(period?.start).toBe("2024-01-01");
    expect(period?.end).toBe("2024-01-08");
  });

  it("weekly: last day of period is still in that period", () => {
    const period = getPeriodForDate(baseConfig, "2024-01-07");
    expect(period?.start).toBe("2024-01-01");
    expect(period?.end).toBe("2024-01-08");
  });

  it("weekly: first day of next period is in the new period", () => {
    const period = getPeriodForDate(baseConfig, "2024-01-08");
    expect(period?.start).toBe("2024-01-08");
    expect(period?.end).toBe("2024-01-15");
  });

  it("daily: each day is its own period", () => {
    const cfg: WellnessConfig = { ...baseConfig, frequency: 1, unit: "days" };
    const period = getPeriodForDate(cfg, "2024-01-05");
    expect(period?.start).toBe("2024-01-05");
    expect(period?.end).toBe("2024-01-06");
  });

  it("daily: multi-day period groups correctly", () => {
    const cfg: WellnessConfig = { ...baseConfig, frequency: 3, unit: "days" };
    // anchor 2024-01-01, period 0: Jan 1–3, period 1: Jan 4–6
    expect(getPeriodForDate(cfg, "2024-01-03")?.start).toBe("2024-01-01");
    expect(getPeriodForDate(cfg, "2024-01-04")?.start).toBe("2024-01-04");
  });

  it("monthly: same calendar month is one period", () => {
    const cfg: WellnessConfig = {
      ...baseConfig,
      frequency: 1,
      unit: "months",
    };
    const period = getPeriodForDate(cfg, "2024-01-31");
    expect(period?.start).toBe("2024-01-01");
    expect(period?.end).toBe("2024-02-01");
  });

  it("monthly: next month starts a new period", () => {
    const cfg: WellnessConfig = {
      ...baseConfig,
      frequency: 1,
      unit: "months",
    };
    const period = getPeriodForDate(cfg, "2024-02-01");
    expect(period?.start).toBe("2024-02-01");
    expect(period?.end).toBe("2024-03-01");
  });

  it("bi-weekly: groups two weeks together", () => {
    const cfg: WellnessConfig = { ...baseConfig, frequency: 2, unit: "weeks" };
    // anchor Jan 1; period 0: Jan 1–14; period 1: Jan 15–28
    expect(getPeriodForDate(cfg, "2024-01-14")?.start).toBe("2024-01-01");
    expect(getPeriodForDate(cfg, "2024-01-15")?.start).toBe("2024-01-15");
  });
});

describe("isCheckPending", () => {
  it("returns true when no entries exist", () => {
    expect(isCheckPending(baseConfig, [], "2024-01-03")).toBe(true);
  });

  it("returns false when an entry exists in the current period", () => {
    const entry: WellnessEntry = {
      id: "e1",
      date: "2024-01-02",
      metrics: [],
    };
    expect(isCheckPending(baseConfig, [entry], "2024-01-03")).toBe(false);
  });

  it("returns true when an entry exists in a previous period", () => {
    const entry: WellnessEntry = {
      id: "e1",
      date: "2023-12-25",
      metrics: [],
    };
    expect(isCheckPending(baseConfig, [entry], "2024-01-03")).toBe(true);
  });

  it("returns false when disabled", () => {
    const cfg = { ...baseConfig, enabled: false };
    expect(isCheckPending(cfg, [], "2024-01-03")).toBe(false);
  });

  it("returns false when date is before anchor", () => {
    expect(isCheckPending(baseConfig, [], "2023-12-15")).toBe(false);
  });

  it("carry-forward: still pending on last day of period with no entry", () => {
    expect(isCheckPending(baseConfig, [], "2024-01-07")).toBe(true);
  });

  it("new period: pending again after period boundary", () => {
    const entry: WellnessEntry = {
      id: "e1",
      date: "2024-01-03",
      metrics: [],
    };
    // Entry is in week Jan 1–7; week Jan 8–14 has no entry → pending
    expect(isCheckPending(baseConfig, [entry], "2024-01-10")).toBe(true);
  });

  it("daily cadence: pending resets each day", () => {
    const cfg: WellnessConfig = { ...baseConfig, frequency: 1, unit: "days" };
    const entry: WellnessEntry = {
      id: "e1",
      date: "2024-01-03",
      metrics: [],
    };
    expect(isCheckPending(cfg, [entry], "2024-01-03")).toBe(false);
    expect(isCheckPending(cfg, [entry], "2024-01-04")).toBe(true);
  });

  it("monthly cadence: entry in same month satisfies check", () => {
    const cfg: WellnessConfig = {
      ...baseConfig,
      frequency: 1,
      unit: "months",
    };
    const entry: WellnessEntry = {
      id: "e1",
      date: "2024-01-15",
      metrics: [],
    };
    expect(isCheckPending(cfg, [entry], "2024-01-31")).toBe(false);
    expect(isCheckPending(cfg, [entry], "2024-02-01")).toBe(true);
  });
});
