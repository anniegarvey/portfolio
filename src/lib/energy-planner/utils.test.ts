import { describe, expect, it } from "vitest";
import type {
  Activity,
  EnergyTypeConfig,
  ResolvedActivity,
  ZoneConfig,
} from "./schema";
import {
  applyRepeatingDrag,
  filterActivities,
  getReorderedItems,
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
