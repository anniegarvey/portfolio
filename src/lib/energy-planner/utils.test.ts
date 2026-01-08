import { describe, expect, it } from "vitest";
import type { DayPlan, Task } from "./schema";
import { calculateEnergyUsage } from "./utils";

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
  },
];

describe("calculateEnergyUsage", () => {
  it("calculates energy usage for selected tasks correctly", () => {
    const dayPlan: DayPlan = {
      date: "2023-01-01",
      selectedTaskIds: ["task-1", "task-2"],
      completedTaskIds: [],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    };

    const usage = calculateEnergyUsage(mockTasks, dayPlan);

    expect(usage).toEqual({
      physical: 15, // 10 + 5
      social: 20, // 20 + 0
      executive: 20, // 5 + 15
    });
  });

  it("ignores unselected tasks", () => {
    // This test specifically targets the mutant where .filter() is removed
    const dayPlan: DayPlan = {
      date: "2023-01-01",
      selectedTaskIds: ["task-1"],
      completedTaskIds: [],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    };

    const usage = calculateEnergyUsage(mockTasks, dayPlan);

    expect(usage).toEqual({
      physical: 10,
      social: 20,
      executive: 5,
    });
    // If filter was removed, it would include task-2 and task-3, resulting in much higher values
  });

  it("returns zero usage when no tasks are selected", () => {
    const dayPlan: DayPlan = {
      date: "2023-01-01",
      selectedTaskIds: [],
      completedTaskIds: [],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    };

    const usage = calculateEnergyUsage(mockTasks, dayPlan);

    expect(usage).toEqual({
      physical: 0,
      social: 0,
      executive: 0,
    });
  });
});
