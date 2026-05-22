import { describe, expect, it } from "vitest";
import {
  formatDateForDisplay,
  getNextDay,
  getPreviousDay,
  getTodayDateString,
  isToday,
} from "./date";

describe("lib/date", () => {
  describe("getTodayDateString", () => {
    it("returns today's date in YYYY-MM-DD format", () => {
      const result = getTodayDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("formatDateForDisplay", () => {
    it("formats date for display", () => {
      const result = formatDateForDisplay("2026-01-14");
      expect(result).toContain("2026");
    });
  });

  describe("isToday", () => {
    it("returns true for today's date", () => {
      const today = getTodayDateString();
      expect(isToday(today)).toBe(true);
    });

    it("returns false for other dates", () => {
      expect(isToday("1999-01-01")).toBe(false);
    });
  });

  describe("getPreviousDay and getNextDay", () => {
    it("getPreviousDay returns previous day", () => {
      expect(getPreviousDay("2026-01-15")).toBe("2026-01-14");
    });

    it("getNextDay returns next day", () => {
      expect(getNextDay("2026-01-14")).toBe("2026-01-15");
    });
  });
});
