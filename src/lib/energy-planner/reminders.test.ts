import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDueReminders,
  markRemindersSent,
  readSentReminders,
  showReminder,
} from "./reminders";
import type { Activity, DayPlan } from "./schema";

const TODAY = "2026-09-27";
const AT_0915 = new Date(2026, 8, 27, 9, 15);

function makeActivity(id: string, overrides?: Partial<Activity>): Activity {
  return {
    id,
    title: `Activity ${id}`,
    energyCost: {},
    factors: {
      initiationDifficulty: 0,
      terminationDifficulty: 0,
      isRestorative: false,
    },
    createdAt: new Date(),
    reminderTime: "09:00",
    ...overrides,
  };
}

function makePlan(overrides?: Partial<DayPlan>): DayPlan {
  return {
    date: TODAY,
    plannedInstances: [],
    dailyCapacity: {},
    ...overrides,
  };
}

function planWith(sourceActivityId: string, completed = false): DayPlan {
  return makePlan({
    plannedInstances: [{ id: "i1", sourceActivityId, completed }],
  });
}

const dailyRepeat = { frequency: 1, unit: "days" as const };

describe("getDueReminders", () => {
  it("fires for an uncompleted activity on today's plan once its time arrives", () => {
    const activity = makeActivity("a");
    expect(getDueReminders([activity], planWith("a"), AT_0915, [])).toEqual([
      activity,
    ]);
  });

  it("fires at exactly the reminder time", () => {
    const at0900 = new Date(2026, 8, 27, 9, 0);
    expect(
      getDueReminders([makeActivity("a")], planWith("a"), at0900, []),
    ).toHaveLength(1);
  });

  it("waits until the reminder time", () => {
    const at0859 = new Date(2026, 8, 27, 8, 59);
    expect(
      getDueReminders([makeActivity("a")], planWith("a"), at0859, []),
    ).toEqual([]);
  });

  it("gives up once the grace window has passed", () => {
    const at1000 = new Date(2026, 8, 27, 10, 0);
    expect(
      getDueReminders([makeActivity("a")], planWith("a"), at1000, []),
    ).toEqual([]);
  });

  it("ignores activities without a reminder time", () => {
    const activity = makeActivity("a", { reminderTime: undefined });
    expect(getDueReminders([activity], planWith("a"), AT_0915, [])).toEqual([]);
  });

  it("ignores activities already notified today", () => {
    expect(
      getDueReminders([makeActivity("a")], planWith("a"), AT_0915, ["a"]),
    ).toEqual([]);
  });

  it("ignores completed activities", () => {
    expect(
      getDueReminders([makeActivity("a")], planWith("a", true), AT_0915, []),
    ).toEqual([]);
  });

  it("ignores one-off activities not on today's plan", () => {
    expect(
      getDueReminders([makeActivity("a")], makePlan(), AT_0915, []),
    ).toEqual([]);
    expect(getDueReminders([makeActivity("a")], null, AT_0915, [])).toEqual([]);
  });

  it("fires for a repeating activity due today even with no stored plan", () => {
    const activity = makeActivity("r", {
      repeatConfig: { ...dailyRepeat, nextDueDate: TODAY },
    });
    expect(getDueReminders([activity], null, AT_0915, [])).toEqual([activity]);
  });

  it("ignores a repeating activity not due today", () => {
    const activity = makeActivity("r", {
      repeatConfig: { ...dailyRepeat, nextDueDate: "2026-09-28" },
    });
    expect(getDueReminders([activity], makePlan(), AT_0915, [])).toEqual([]);
  });

  it("ignores a repeating activity skipped today", () => {
    const activity = makeActivity("r", {
      repeatConfig: { ...dailyRepeat, nextDueDate: TODAY },
    });
    const plan = makePlan({ skippedSourceActivityIds: ["r"] });
    expect(getDueReminders([activity], plan, AT_0915, [])).toEqual([]);
  });

  it("ignores a repeating activity completed today", () => {
    const activity = makeActivity("r", {
      repeatConfig: { ...dailyRepeat, nextDueDate: TODAY },
    });
    expect(
      getDueReminders([activity], planWith("r", true), AT_0915, []),
    ).toEqual([]);
  });
});

describe("sent reminders", () => {
  beforeEach(() => localStorage.clear());

  it("starts empty", () => {
    expect(readSentReminders(TODAY)).toEqual([]);
  });

  it("accumulates ids for today", () => {
    markRemindersSent(TODAY, ["a"]);
    markRemindersSent(TODAY, ["b"]);
    expect(readSentReminders(TODAY)).toEqual(["a", "b"]);
  });

  it("resets on a new day", () => {
    markRemindersSent(TODAY, ["a"]);
    expect(readSentReminders("2026-09-28")).toEqual([]);
  });

  it("treats unreadable storage as nothing sent", () => {
    localStorage.setItem("energy-planner-reminders-sent", "{not json");
    expect(readSentReminders(TODAY)).toEqual([]);
  });

  it("doesn't throw when storage can't be written", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => markRemindersSent(TODAY, ["a"])).not.toThrow();
  });
});

describe("showReminder", () => {
  const NotificationMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("Notification", NotificationMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    NotificationMock.mockClear();
  });

  it("shows through the service worker when one is registered", async () => {
    const showNotification = vi.fn();
    vi.stubGlobal("navigator", {
      serviceWorker: {
        getRegistration: async () => ({ showNotification }),
      },
    });
    await showReminder(makeActivity("a", { description: "Hang it out" }));
    expect(showNotification).toHaveBeenCalledWith(
      "Activity a",
      expect.objectContaining({
        body: "Hang it out",
        tag: "activity-reminder-a",
      }),
    );
    expect(NotificationMock).not.toHaveBeenCalled();
  });

  it("falls back to the page Notification API without a service worker", async () => {
    vi.stubGlobal("navigator", {});
    await showReminder(makeActivity("a"));
    expect(NotificationMock).toHaveBeenCalledWith(
      "Activity a",
      expect.objectContaining({ body: "Time for this activity." }),
    );
  });
});
