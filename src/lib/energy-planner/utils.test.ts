import { describe, expect, it } from "vitest";
import type { DayPlan, Task } from "./schema";
import { calculateEnergyUsage, getReorderedItems } from "./utils";

const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Task 1",
    createdAt: new Date(),
    energyCost: { physical: 10, social: 20, executive: 5 },
    factors: {
      initiationDifficulty: 1,
      terminationDifficulty: 1,
      isRestorative: false,
    },
    completed: false,
  },
  {
    id: "task-2",
    title: "Task 2",
    createdAt: new Date(),
    energyCost: { physical: 5, social: 0, executive: 15 },
    factors: {
      initiationDifficulty: 1,
      terminationDifficulty: 1,
      isRestorative: false,
    },
    completed: false,
  },
  {
    id: "task-3",
    title: "Task 3",
    createdAt: new Date(),
    energyCost: { physical: 50, social: 50, executive: 50 },
    factors: {
      initiationDifficulty: 1,
      terminationDifficulty: 1,
      isRestorative: false,
    },
    completed: false,
  },
];

describe("calculateEnergyUsage", () => {
  it("calculates energy usage for selected tasks correctly", () => {
    const dayPlan: DayPlan = {
      date: "2023-01-01",
      tasks: [
        { ...mockTasks[0], completed: false },
        { ...mockTasks[1], completed: false },
      ],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    };

    const usage = calculateEnergyUsage(dayPlan);

    expect(usage).toEqual({
      physical: 15, // 10 + 5
      social: 20, // 20 + 0
      executive: 20, // 5 + 15
    });
  });

  it("returns zero usage when no tasks are selected", () => {
    const dayPlan: DayPlan = {
      date: "2023-01-01",
      tasks: [],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    };

    const usage = calculateEnergyUsage(dayPlan);

    // With dynamic energy types, empty selection returns object with 0 values
    expect(usage).toEqual({ physical: 0, social: 0, executive: 0 });
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
