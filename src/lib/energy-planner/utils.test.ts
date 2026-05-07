import { describe, expect, it } from "vitest";
import type { Activity, EnergyTypeConfig, ResolvedActivity } from "./schema";
import { getReorderedItems, validateEnergyCapacity } from "./utils";

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
