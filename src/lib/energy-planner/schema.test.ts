import { describe, expect, it } from "vitest";
import { EnergyCostSchema, TaskFactorSchema } from "./schema";

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

  it("rejects difficulty < 1 or > 10", () => {
    const result = TaskFactorSchema.safeParse({
      initiationDifficulty: 0,
      terminationDifficulty: 11,
      isRestorative: false,
    });
    expect(result.success).toBe(false);
  });
});
