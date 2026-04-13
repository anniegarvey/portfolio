import { describe, expect, it } from "vitest";
import type { Activity, PlannedInstance } from "@/lib/energy-planner/schema";
import {
  calculateNextDueDate,
  checkIsActivityDue,
  mergeInstancesWithOrder,
  projectedInstanceId,
} from "./dayPlanUtils";

const baseActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: "act-1",
  title: "Test",
  createdAt: new Date(),
  energyCost: { physical: 0, social: 0, executive: 0 },
  factors: {
    initiationDifficulty: 1,
    terminationDifficulty: 1,
    isRestorative: false,
  },
  ...overrides,
});

describe("checkIsActivityDue", () => {
  it("returns false when activity has no repeatConfig", () => {
    expect(checkIsActivityDue(baseActivity(), "2026-01-15")).toBe(false);
  });

  it("returns false when nextDueDate is missing", () => {
    const activity = baseActivity({
      repeatConfig: { frequency: 1, unit: "days", nextDueDate: undefined },
    });
    expect(checkIsActivityDue(activity, "2026-01-15")).toBe(false);
  });

  it("returns false when target date is before nextDueDate", () => {
    const activity = baseActivity({
      repeatConfig: { frequency: 1, unit: "days", nextDueDate: "2026-01-20" },
    });
    expect(checkIsActivityDue(activity, "2026-01-15")).toBe(false);
  });

  describe("days", () => {
    it("returns true on the due date itself", () => {
      const activity = baseActivity({
        repeatConfig: { frequency: 1, unit: "days", nextDueDate: "2026-01-15" },
      });
      expect(checkIsActivityDue(activity, "2026-01-15")).toBe(true);
    });

    it("returns true on a subsequent due date", () => {
      const activity = baseActivity({
        repeatConfig: { frequency: 3, unit: "days", nextDueDate: "2026-01-01" },
      });
      expect(checkIsActivityDue(activity, "2026-01-07")).toBe(true);
    });

    it("returns false on a non-due date", () => {
      const activity = baseActivity({
        repeatConfig: { frequency: 3, unit: "days", nextDueDate: "2026-01-01" },
      });
      expect(checkIsActivityDue(activity, "2026-01-03")).toBe(false);
    });
  });

  describe("weeks", () => {
    it("returns true exactly one week later", () => {
      const activity = baseActivity({
        repeatConfig: {
          frequency: 1,
          unit: "weeks",
          nextDueDate: "2026-01-01",
        },
      });
      expect(checkIsActivityDue(activity, "2026-01-08")).toBe(true);
    });

    it("returns false on a non-week multiple", () => {
      const activity = baseActivity({
        repeatConfig: {
          frequency: 1,
          unit: "weeks",
          nextDueDate: "2026-01-01",
        },
      });
      expect(checkIsActivityDue(activity, "2026-01-09")).toBe(false);
    });
  });

  describe("months", () => {
    it("returns true one month later on same day", () => {
      const activity = baseActivity({
        repeatConfig: {
          frequency: 1,
          unit: "months",
          nextDueDate: "2026-01-15",
        },
      });
      expect(checkIsActivityDue(activity, "2026-02-15")).toBe(true);
    });

    it("returns false on same month but different day", () => {
      const activity = baseActivity({
        repeatConfig: {
          frequency: 1,
          unit: "months",
          nextDueDate: "2026-01-15",
        },
      });
      expect(checkIsActivityDue(activity, "2026-02-16")).toBe(false);
    });

    it("returns false when month count is not a multiple of frequency", () => {
      const activity = baseActivity({
        repeatConfig: {
          frequency: 3,
          unit: "months",
          nextDueDate: "2026-01-15",
        },
      });
      expect(checkIsActivityDue(activity, "2026-02-15")).toBe(false);
    });
  });

  describe("years", () => {
    it("returns true exactly one year later", () => {
      const activity = baseActivity({
        repeatConfig: {
          frequency: 1,
          unit: "years",
          nextDueDate: "2026-01-15",
        },
      });
      expect(checkIsActivityDue(activity, "2027-01-15")).toBe(true);
    });

    it("returns false on same year/month but different day", () => {
      const activity = baseActivity({
        repeatConfig: {
          frequency: 1,
          unit: "years",
          nextDueDate: "2026-01-15",
        },
      });
      expect(checkIsActivityDue(activity, "2027-01-16")).toBe(false);
    });

    it("returns false on same year/day but different month", () => {
      const activity = baseActivity({
        repeatConfig: {
          frequency: 1,
          unit: "years",
          nextDueDate: "2026-01-15",
        },
      });
      expect(checkIsActivityDue(activity, "2027-02-15")).toBe(false);
    });

    it("returns false when year count is not a multiple of frequency", () => {
      const activity = baseActivity({
        repeatConfig: {
          frequency: 2,
          unit: "years",
          nextDueDate: "2026-01-15",
        },
      });
      expect(checkIsActivityDue(activity, "2027-01-15")).toBe(false);
    });
  });
});

describe("projectedInstanceId", () => {
  it("returns a valid UUID", () => {
    const id = projectedInstanceId("act-1", "2026-01-15");
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("is deterministic for the same inputs", () => {
    expect(projectedInstanceId("act-1", "2026-01-15")).toBe(
      projectedInstanceId("act-1", "2026-01-15"),
    );
  });

  it("differs for different activity IDs", () => {
    expect(projectedInstanceId("act-1", "2026-01-15")).not.toBe(
      projectedInstanceId("act-2", "2026-01-15"),
    );
  });

  it("differs for different dates", () => {
    expect(projectedInstanceId("act-1", "2026-01-15")).not.toBe(
      projectedInstanceId("act-1", "2026-01-16"),
    );
  });
});

describe("mergeInstancesWithOrder", () => {
  const makeInstance = (id: string): PlannedInstance => ({
    id,
    sourceActivityId: `src-${id}`,
    completed: false,
  });

  it("returns instances as-is when no stored order", () => {
    const instances = [makeInstance("a"), makeInstance("b")];
    expect(mergeInstancesWithOrder(instances, undefined)).toEqual(instances);
  });

  it("returns instances as-is when stored order is empty", () => {
    const instances = [makeInstance("a"), makeInstance("b")];
    expect(mergeInstancesWithOrder(instances, [])).toEqual(instances);
  });

  it("places stored-order instances first, appends new ones", () => {
    const a = makeInstance("a");
    const b = makeInstance("b");
    const c = makeInstance("c");
    const result = mergeInstancesWithOrder([a, b, c], ["b", "a"]);
    expect(result.map((i) => i.id)).toEqual(["b", "a", "c"]);
  });

  it("skips IDs in storedOrder that no longer exist", () => {
    const a = makeInstance("a");
    const b = makeInstance("b");
    const result = mergeInstancesWithOrder([a, b], ["deleted", "b", "a"]);
    expect(result.map((i) => i.id)).toEqual(["b", "a"]);
  });
});

describe("calculateNextDueDate", () => {
  it("returns undefined when config is missing", () => {
    expect(calculateNextDueDate("2026-01-15", undefined)).toBeUndefined();
  });

  it("returns undefined when currentDueDate is missing", () => {
    expect(
      calculateNextDueDate(undefined, { frequency: 1, unit: "days" }),
    ).toBeUndefined();
  });

  it("advances by days", () => {
    expect(
      calculateNextDueDate("2026-01-15", { frequency: 3, unit: "days" }),
    ).toBe("2026-01-18");
  });

  it("advances by weeks", () => {
    expect(
      calculateNextDueDate("2026-01-15", { frequency: 2, unit: "weeks" }),
    ).toBe("2026-01-29");
  });

  it("advances by months", () => {
    expect(
      calculateNextDueDate("2026-01-15", { frequency: 1, unit: "months" }),
    ).toBe("2026-02-15");
  });

  it("advances by years", () => {
    expect(
      calculateNextDueDate("2026-01-15", { frequency: 1, unit: "years" }),
    ).toBe("2027-01-15");
  });
});
