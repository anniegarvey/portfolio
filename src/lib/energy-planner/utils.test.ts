import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  Activity,
  EnergyTypeConfig,
  ResolvedActivity,
  ZoneConfig,
} from "./schema";
import { DEFAULT_HELPERS } from "./schema";
import {
  applyRepeatingDrag,
  filterActivities,
  formatIdeaAge,
  getHelperOptions,
  getReorderedItems,
  isHardToStart,
  isInstalledApp,
  sortIdeas,
  sortRepeatingByZone,
  validateEnergyCapacity,
} from "./utils";

const mockEnergyTypes: EnergyTypeConfig[] = [
  { id: "physical", label: "Physical", color: "#14b8a6", isPreset: true },
  { id: "social", label: "Social", color: "#f43f5e", isPreset: true },
  { id: "executive", label: "Executive", color: "#f97316", isPreset: true },
];

const mockActivities: Activity[] = [
  {
    id: "activity-1",
    title: "Activity 1",
    createdAt: new Date(),
    energyCost: { physical: 10, social: 20, executive: 5 },
    factors: {
      initiationDifficulty: 1,
      terminationDifficulty: 1,
      isRestorative: false,
    },
  },
  {
    id: "activity-2",
    title: "Activity 2",
    createdAt: new Date(),
    energyCost: { physical: 5, social: 0, executive: 15 },
    factors: {
      initiationDifficulty: 1,
      terminationDifficulty: 1,
      isRestorative: false,
    },
  },
  {
    id: "activity-3",
    title: "Activity 3",
    createdAt: new Date(),
    energyCost: { physical: 50, social: 50, executive: 50 },
    factors: {
      initiationDifficulty: 1,
      terminationDifficulty: 1,
      isRestorative: false,
    },
  },
];

const makeResolved = (activities: Activity[]): ResolvedActivity[] =>
  activities.map((activity, i) => ({
    activity,
    instance: {
      id: `instance-${i}`,
      sourceActivityId: activity.id,
      completed: false,
    },
  }));

describe("filterActivities", () => {
  const makeActivity = (
    id: string,
    title: string,
    description?: string,
  ): Activity => ({
    id,
    title,
    description,
    createdAt: new Date(),
    energyCost: { physical: 0, social: 0, executive: 0 },
    factors: {
      initiationDifficulty: 1,
      terminationDifficulty: 1,
      isRestorative: false,
    },
  });

  const activities = [
    makeActivity("a", "Morning walk", "A gentle stroll outside"),
    makeActivity("b", "Reply to emails", "Clear the inbox backlog"),
    makeActivity("c", "Yoga session"),
  ];

  it("returns all activities for an empty query", () => {
    expect(filterActivities(activities, "")).toEqual(activities);
  });

  it("returns all activities for a whitespace-only query", () => {
    expect(filterActivities(activities, "   ")).toEqual(activities);
  });

  it("matches against the title", () => {
    expect(filterActivities(activities, "walk")).toEqual([activities[0]]);
  });

  it("matches against the description", () => {
    expect(filterActivities(activities, "inbox")).toEqual([activities[1]]);
  });

  it("is case-insensitive", () => {
    expect(filterActivities(activities, "YOGA")).toEqual([activities[2]]);
  });

  it("does not throw and ignores missing descriptions", () => {
    expect(filterActivities(activities, "stroll")).toEqual([activities[0]]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterActivities(activities, "nonexistent")).toEqual([]);
  });

  it("trims surrounding whitespace from the query", () => {
    expect(filterActivities(activities, "  walk  ")).toEqual([activities[0]]);
  });

  it("requires every whitespace-separated term to match", () => {
    // Both terms appear in the first activity (title + description)
    expect(filterActivities(activities, "morning stroll")).toEqual([
      activities[0],
    ]);
    // "morning" matches the first activity but "inbox" does not -> no result
    expect(filterActivities(activities, "morning inbox")).toEqual([]);
  });

  it("matches terms across both title and description", () => {
    // "reply" from the title, "backlog" from the description
    expect(filterActivities(activities, "reply backlog")).toEqual([
      activities[1],
    ]);
  });

  it("collapses repeated whitespace between terms", () => {
    expect(filterActivities(activities, "morning   stroll")).toEqual([
      activities[0],
    ]);
  });
});

describe("validateEnergyCapacity", () => {
  it("calculates usage correctly for selected activities", () => {
    const resolved = makeResolved([mockActivities[0], mockActivities[1]]);
    const { usage } = validateEnergyCapacity(resolved, mockEnergyTypes, {
      physical: 100,
      social: 100,
      executive: 100,
    });
    expect(usage).toEqual({ physical: 15, social: 20, executive: 20 });
  });

  it("returns zero usage per energy type when no activities are planned", () => {
    const { usage } = validateEnergyCapacity([], mockEnergyTypes, {
      physical: 50,
      social: 50,
      executive: 50,
    });
    expect(usage).toEqual({ physical: 0, social: 0, executive: 0 });
  });

  it("returns empty warnings when within capacity", () => {
    const resolved = makeResolved([mockActivities[0]]);
    const { warnings } = validateEnergyCapacity(resolved, mockEnergyTypes, {
      physical: 50,
      social: 50,
      executive: 50,
    });
    expect(warnings).toEqual([]);
  });

  it("returns warning labels for exceeded energy types", () => {
    const resolved = makeResolved([mockActivities[2]]);
    const { warnings } = validateEnergyCapacity(resolved, mockEnergyTypes, {
      physical: 20,
      social: 100,
      executive: 20,
    });
    expect(warnings).toEqual(["Physical", "Executive"]);
  });

  it("does not warn when usage exactly equals capacity", () => {
    const resolved = makeResolved([mockActivities[0]]);
    const { warnings } = validateEnergyCapacity(resolved, mockEnergyTypes, {
      physical: 10,
      social: 20,
      executive: 5,
    });
    expect(warnings).toEqual([]);
  });

  it("uses zero baseline from energyTypes rather than hardcoded defaults", () => {
    const customTypes: EnergyTypeConfig[] = [
      { id: "creative", label: "Creative", color: "#8b5cf6", isPreset: false },
    ];
    const { usage } = validateEnergyCapacity([], customTypes, { creative: 50 });
    expect(usage).toEqual({ creative: 0 });
  });
});

describe("getReorderedItems", () => {
  it("returns null if overId is null", () => {
    const items = ["a", "b", "c"];
    const result = getReorderedItems(
      items,
      { active: { id: "a" }, over: null },
      (id) => id,
    );
    expect(result).toBeNull();
  });

  it("returns null if activeId equals overId", () => {
    const items = ["a", "b", "c"];
    const result = getReorderedItems(
      items,
      { active: { id: "a" }, over: { id: "a" } },
      (id) => id,
    );
    expect(result).toBeNull();
  });

  it("returns reordered string array", () => {
    const items = ["a", "b", "c"];
    // Move 'a' to 'c' (index 0 to 2) -> b, c, a
    const result = getReorderedItems(
      items,
      { active: { id: "a" }, over: { id: "c" } },
      (id) => id,
    );
    expect(result).toEqual(["b", "c", "a"]);
  });

  it("returns reordered object array", () => {
    const items = [{ id: "1" }, { id: "2" }, { id: "3" }];
    // Move '3' to '2' (index 2 to 1) -> 1, 3, 2
    const result = getReorderedItems(
      items,
      { active: { id: "3" }, over: { id: "2" } },
      (item) => item.id,
    );
    expect(result).toEqual([{ id: "1" }, { id: "3" }, { id: "2" }]);
  });

  it("returns null if item not found", () => {
    const items = ["a", "b"];
    const result = getReorderedItems(
      items,
      { active: { id: "z" }, over: { id: "b" } },
      (id) => id,
    );
    expect(result).toBeNull();
  });
});

describe("sortRepeatingByZone", () => {
  const zones: ZoneConfig[] = [
    { id: "morning", name: "Morning", order: 0 },
    { id: "afternoon", name: "Afternoon", order: 1 },
    { id: "evening", name: "Evening", order: 2 },
  ];

  const makeRepeating = (
    id: string,
    title: string,
    defaultZoneId?: string,
  ): Activity => ({
    id,
    title,
    createdAt: new Date(),
    energyCost: {},
    factors: {
      initiationDifficulty: 0,
      terminationDifficulty: 0,
      isRestorative: false,
    },
    repeatConfig: {
      frequency: 1,
      unit: "days",
      ...(defaultZoneId ? { defaultZoneId } : {}),
    },
  });

  it("places no-default-zone activities at the top", () => {
    const activities: Activity[] = [
      makeRepeating("a", "Has zone", "morning"),
      makeRepeating("b", "No zone"),
    ];
    const sorted = sortRepeatingByZone(activities, zones);
    expect(sorted.map((a) => a.id)).toEqual(["b", "a"]);
  });

  it("groups by zone in zone order", () => {
    const activities: Activity[] = [
      makeRepeating("e", "Evening item", "evening"),
      makeRepeating("m", "Morning item", "morning"),
      makeRepeating("a", "Afternoon item", "afternoon"),
    ];
    const sorted = sortRepeatingByZone(activities, zones);
    expect(sorted.map((a) => a.id)).toEqual(["m", "a", "e"]);
  });

  it("preserves stored order within each bucket", () => {
    const activities: Activity[] = [
      makeRepeating("m2", "Morning second", "morning"),
      makeRepeating("m1", "Morning first", "morning"),
      makeRepeating("n2", "No zone second"),
      makeRepeating("n1", "No zone first"),
    ];
    const sorted = sortRepeatingByZone(activities, zones);
    expect(sorted.map((a) => a.id)).toEqual(["n2", "n1", "m2", "m1"]);
  });

  it("treats a dangling defaultZoneId (deleted zone) as no zone", () => {
    const activities: Activity[] = [
      makeRepeating("orphan", "Was in deleted zone", "deleted-zone"),
      makeRepeating("m", "Morning", "morning"),
    ];
    const sorted = sortRepeatingByZone(activities, zones);
    expect(sorted.map((a) => a.id)).toEqual(["orphan", "m"]);
  });

  it("re-derives order live when zones are reordered", () => {
    const activities: Activity[] = [
      makeRepeating("m", "Morning item", "morning"),
      makeRepeating("e", "Evening item", "evening"),
    ];
    const reorderedZones: ZoneConfig[] = [
      { id: "evening", name: "Evening", order: 0 },
      { id: "morning", name: "Morning", order: 1 },
    ];
    const sorted = sortRepeatingByZone(activities, reorderedZones);
    expect(sorted.map((a) => a.id)).toEqual(["e", "m"]);
  });

  it("returns an empty array for empty input", () => {
    expect(sortRepeatingByZone([], zones)).toEqual([]);
  });
});

describe("applyRepeatingDrag", () => {
  const zones: ZoneConfig[] = [
    { id: "morning", name: "Morning", order: 0 },
    { id: "afternoon", name: "Afternoon", order: 1 },
    { id: "evening", name: "Evening", order: 2 },
  ];

  const makeRepeating = (
    id: string,
    title: string,
    defaultZoneId?: string,
  ): Activity => ({
    id,
    title,
    createdAt: new Date(),
    energyCost: {},
    factors: {
      initiationDifficulty: 0,
      terminationDifficulty: 0,
      isRestorative: false,
    },
    repeatConfig: {
      frequency: 1,
      unit: "days",
      ...(defaultZoneId ? { defaultZoneId } : {}),
    },
  });

  it("reorders within the same zone bucket without touching defaultZoneId", () => {
    const sorted = [
      makeRepeating("m1", "Morning 1", "morning"),
      makeRepeating("m2", "Morning 2", "morning"),
    ];
    const updated = applyRepeatingDrag(
      sorted,
      { active: { id: "m2" }, over: { id: "m1" } },
      zones,
    );
    expect(updated?.map((a) => a.id)).toEqual(["m2", "m1"]);
    expect(updated?.[0].repeatConfig?.defaultZoneId).toBe("morning");
  });

  it("updates defaultZoneId when dragged across a bucket boundary", () => {
    const sorted = [
      makeRepeating("n1", "No zone 1"),
      makeRepeating("m1", "Morning 1", "morning"),
    ];
    // Drag the no-zone item down past the morning item.
    const updated = applyRepeatingDrag(
      sorted,
      { active: { id: "n1" }, over: { id: "m1" } },
      zones,
    );
    expect(updated).not.toBeNull();
    const moved = updated?.find((a) => a.id === "n1");
    expect(moved?.repeatConfig?.defaultZoneId).toBe("morning");
  });

  it("clears defaultZoneId when dragged into the no-zone bucket", () => {
    const sorted = [
      makeRepeating("m1", "Morning 1", "morning"),
      makeRepeating("n1", "No zone 1"),
    ];
    // Drag morning up past the no-zone item — it joins the no-zone bucket.
    const updated = applyRepeatingDrag(
      sorted,
      { active: { id: "m1" }, over: { id: "n1" } },
      zones,
    );
    expect(updated).not.toBeNull();
    const moved = updated?.find((a) => a.id === "m1");
    expect(moved?.repeatConfig?.defaultZoneId).toBeUndefined();
  });

  it("returns null when the drag is invalid (no over target)", () => {
    const sorted = [makeRepeating("m1", "Morning 1", "morning")];
    const updated = applyRepeatingDrag(
      sorted,
      { active: { id: "m1" }, over: null },
      zones,
    );
    expect(updated).toBeNull();
  });
});

describe("isHardToStart", () => {
  const withDifficulty = (initiationDifficulty: number) =>
    ({
      factors: {
        initiationDifficulty,
        terminationDifficulty: 0,
        isRestorative: false,
      },
    }) as Activity;

  it("is true from a start difficulty of 6", () => {
    expect(isHardToStart(withDifficulty(5))).toBe(false);
    expect(isHardToStart(withDifficulty(6))).toBe(true);
    expect(isHardToStart(withDifficulty(10))).toBe(true);
  });
});

describe("getHelperOptions", () => {
  it("starts with the default ideas", () => {
    expect(getHelperOptions([])).toEqual(DEFAULT_HELPERS);
  });

  it("adds helpers used before after the defaults, once each", () => {
    expect(
      getHelperOptions([" Podcast ", "coffee", "podcast", "", "Dog nearby"]),
    ).toEqual([...DEFAULT_HELPERS, "Podcast", "Dog nearby"]);
  });
});

describe("sortIdeas", () => {
  const idea = (
    id: string,
    created: string,
    energyCost: Record<string, number>,
    helpers?: string[],
  ): Activity => ({
    id,
    title: id,
    createdAt: new Date(created),
    energyCost,
    factors: {
      initiationDifficulty: 0,
      terminationDifficulty: 0,
      isRestorative: false,
    },
    helpers,
  });
  const ideas = [
    idea("old", "2026-01-01", { physical: 10, social: 10 }),
    idea("mid", "2026-02-01", { physical: 5 }, ["Audiobook"]),
    idea("new", "2026-03-01", { physical: 40 }),
    idea("same-energy", "2026-01-15", { executive: 20 }, ["audiobook"]),
  ];
  const ids = (list: Activity[]) => list.map((a) => a.id);

  it("sorts newest first", () => {
    expect(ids(sortIdeas(ideas, "newest"))).toEqual([
      "new",
      "mid",
      "same-energy",
      "old",
    ]);
  });

  it("sorts oldest first", () => {
    expect(ids(sortIdeas(ideas, "oldest"))).toEqual([
      "old",
      "same-energy",
      "mid",
      "new",
    ]);
  });

  it("sorts by total energy, newest first on ties", () => {
    expect(ids(sortIdeas(ideas, "least-energy"))).toEqual([
      "mid",
      "same-energy",
      "old",
      "new",
    ]);
    expect(ids(sortIdeas(ideas, "most-energy"))).toEqual([
      "new",
      "same-energy",
      "old",
      "mid",
    ]);
  });

  it("brings ideas using a helper to the front, ignoring case", () => {
    expect(ids(sortIdeas(ideas, "helper:Audiobook"))).toEqual([
      "mid",
      "same-energy",
      "new",
      "old",
    ]);
  });

  it("does not change the list it was given", () => {
    const copy = [...ideas];
    sortIdeas(ideas, "oldest");
    expect(ideas).toEqual(copy);
  });
});

describe("formatIdeaAge", () => {
  const now = new Date("2026-06-30T12:00:00");
  const daysAgo = (n: number) =>
    new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  it.each([
    [0, "Today"],
    [1, "1 day"],
    [13, "13 days"],
    [14, "2 weeks"],
    [59, "8 weeks"],
    [60, "2 months"],
    [729, "24 months"],
    [730, "2 years"],
  ])("%i days ago reads %s", (days, label) => {
    expect(formatIdeaAge(daysAgo(days), now)).toBe(label);
  });

  it("counts calendar days, not 24-hour periods", () => {
    expect(
      formatIdeaAge(
        new Date("2026-06-29T23:00:00"),
        new Date("2026-06-30T08:00:00"),
      ),
    ).toBe("1 day");
    expect(
      formatIdeaAge(
        new Date("2026-06-30T00:30:00"),
        new Date("2026-06-30T23:30:00"),
      ),
    ).toBe("Today");
  });
});

describe("isInstalledApp", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is true only in the installed app's standalone window", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(display-mode: standalone)",
    }));
    expect(isInstalledApp()).toBe(true);

    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    expect(isInstalledApp()).toBe(false);
  });
});
