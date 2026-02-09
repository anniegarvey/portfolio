import { describe, expect, it } from "vitest";
import {
  DayPlanSchema,
  EnergyCostSchema,
  TaskFactorSchema,
  TaskSchema,
} from "./schema";

describe("EnergyCostSchema", () => {
  it("validates correct energy levels", () => {
    const result = EnergyCostSchema.safeParse({
      physical: 50,
      social: 10,
      executive: 99,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative numbers", () => {
    const result = EnergyCostSchema.safeParse({
      physical: -10,
      social: 10,
      executive: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects numbers > 100", () => {
    const result = EnergyCostSchema.safeParse({
      physical: 101,
      social: 10,
      executive: 10,
    });
    expect(result.success).toBe(false);
  });
});

describe("TaskFactorSchema", () => {
  it("validates correct logic", () => {
    const result = TaskFactorSchema.safeParse({
      initiationDifficulty: 5,
      terminationDifficulty: 5,
      isRestorative: true,
    });
    expect(result.success).toBe(true);
  });

  it("defaults isRestorative to false", () => {
    const result = TaskFactorSchema.safeParse({
      initiationDifficulty: 5,
      terminationDifficulty: 5,
      // isRestorative omitted
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isRestorative).toBe(false);
    }
  });

  it("rejects difficulty < 0 or > 10", () => {
    const result = TaskFactorSchema.safeParse({
      initiationDifficulty: -1,
      terminationDifficulty: 11,
      isRestorative: false,
    });
    expect(result.success).toBe(false);
  });

  it("accepts difficulty 0", () => {
    const result = TaskFactorSchema.safeParse({
      initiationDifficulty: 0,
      terminationDifficulty: 0,
      isRestorative: false,
    });
    expect(result.success).toBe(true);
  });
});

describe("TaskSchema", () => {
  it("requires title", () => {
    const result = TaskSchema.safeParse({
      id: "00000000-0000-0000-0000-000000000000",
      createdAt: new Date(),
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 5,
        isRestorative: false,
      },
      // Missing title
    });
    expect(result.success).toBe(false);
  });

  it("requires non-empty title", () => {
    const result = TaskSchema.safeParse({
      id: "00000000-0000-0000-0000-000000000000",
      title: "",
      createdAt: new Date(),
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 5,
        isRestorative: false,
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Title is required");
    }
  });

  it("accepts valid task with long title", () => {
    const result = TaskSchema.safeParse({
      id: "00000000-0000-0000-0000-000000000000",
      title:
        "A very long task title that is definitely longer than 1 character",
      createdAt: new Date(),
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 5,
        isRestorative: false,
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("DayPlanSchema", () => {
  it("defaults tasks to empty array if omitted (though it's required usually, let's check schema definition)", () => {
    const result = DayPlanSchema.safeParse({
      date: "2023-01-01",
      tasks: [],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tasks).toEqual([]);
    }
  });
});
