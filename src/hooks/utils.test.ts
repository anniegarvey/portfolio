import { beforeEach, describe, expect, it } from "vitest";
import type { EnergyTypeConfig } from "@/lib/energy-planner/schema";
import { clearAll } from "@/lib/energy-planner/storage";
import {
  createEmptyDayPlan,
  defaultCapacity,
  fetchDayPlanForDate,
  generateUniqueKey,
  getAllStoredDates,
  getDefaultCapacity,
  saveDayPlanForDate,
  slugify,
} from "./utils";

describe("hooks/utils", () => {
  beforeEach(async () => {
    await clearAll();
  });

  describe("getDefaultCapacity", () => {
    it("returns capacity object with 0 for each energy type", () => {
      const energyTypes: EnergyTypeConfig[] = [
        { id: "physical", label: "Physical", color: "#ff0000", isPreset: true },
        { id: "social", label: "Social", color: "#00ff00", isPreset: true },
      ];

      const capacity = getDefaultCapacity(energyTypes);

      expect(capacity).toEqual({
        physical: 0,
        social: 0,
      });
    });

    it("returns empty object for empty energy types array", () => {
      const capacity = getDefaultCapacity([]);

      expect(capacity).toEqual({});
    });

    it("includes custom energy types", () => {
      const energyTypes: EnergyTypeConfig[] = [
        { id: "custom", label: "Custom", color: "#0000ff", isPreset: false },
      ];

      const capacity = getDefaultCapacity(energyTypes);

      expect(capacity).toEqual({
        custom: 0,
      });
    });
  });

  describe("defaultCapacity", () => {
    it("is defined with default energy types", () => {
      expect(defaultCapacity).toBeDefined();
      expect(defaultCapacity.physical).toBe(0);
      expect(defaultCapacity.social).toBe(0);
      expect(defaultCapacity.executive).toBe(0);
    });
  });

  describe("fetchDayPlanForDate and saveDayPlanForDate", () => {
    it("saves and retrieves day plan", async () => {
      const plan = {
        date: "2026-01-14",
        plannedInstances: [
          {
            id: "instance-1",
            sourceActivityId: "activity-1",
            completed: false,
          },
        ],
        dailyCapacity: defaultCapacity,
      };
      await saveDayPlanForDate("2026-01-14", plan);

      const retrieved = await fetchDayPlanForDate("2026-01-14");
      expect(retrieved?.date).toBe(plan.date);
      expect(retrieved?.plannedInstances).toHaveLength(1);
      expect(retrieved?.plannedInstances[0].id).toBe("instance-1");
    });

    it("returns null for non-existent date", async () => {
      const result = await fetchDayPlanForDate("1999-01-01");
      expect(result).toBeNull();
    });
  });

  describe("createEmptyDayPlan", () => {
    it("creates empty day plan with specified date", async () => {
      const plan = await createEmptyDayPlan("2026-01-15");
      expect(plan.date).toBe("2026-01-15");
      expect(plan.plannedInstances).toEqual([]);
    });
  });

  describe("getAllStoredDates", () => {
    it("returns empty array when no dates stored", async () => {
      expect(await getAllStoredDates()).toEqual([]);
    });

    it("returns sorted dates", async () => {
      await saveDayPlanForDate(
        "2026-01-15",
        await createEmptyDayPlan("2026-01-15"),
      );
      await saveDayPlanForDate(
        "2026-01-13",
        await createEmptyDayPlan("2026-01-13"),
      );
      await saveDayPlanForDate(
        "2026-01-14",
        await createEmptyDayPlan("2026-01-14"),
      );

      const dates = await getAllStoredDates();
      expect(dates).toEqual(["2026-01-13", "2026-01-14", "2026-01-15"]);
    });
  });

  describe("slugify", () => {
    it("converts label to lowercase kebab-case", () => {
      expect(slugify("Creative Energy")).toBe("creative-energy");
    });

    it("handles single word", () => {
      expect(slugify("Physical")).toBe("physical");
    });

    it("removes special characters", () => {
      expect(slugify("Energy!@#$%^&*()Type")).toBe("energy-type");
    });

    it("trims whitespace", () => {
      expect(slugify("  Physical Energy  ")).toBe("physical-energy");
    });

    it("handles multiple spaces", () => {
      expect(slugify("My   Custom   Type")).toBe("my-custom-type");
    });

    it("handles numbers", () => {
      expect(slugify("Energy 2024")).toBe("energy-2024");
    });

    it("returns empty string for empty input", () => {
      expect(slugify("")).toBe("");
    });

    it("returns empty string for special chars only", () => {
      expect(slugify("!@#$%^")).toBe("");
    });
  });

  describe("generateUniqueKey", () => {
    it("returns slugified label when no clash", () => {
      const existingKeys = ["physical", "social"];
      expect(generateUniqueKey("Creative Energy", existingKeys)).toBe(
        "creative-energy",
      );
    });

    it("appends -2 suffix when key clashes", () => {
      const existingKeys = ["physical", "social", "creative-energy"];
      expect(generateUniqueKey("Creative Energy", existingKeys)).toBe(
        "creative-energy-2",
      );
    });

    it("appends -3 suffix when -2 also clashes", () => {
      const existingKeys = ["creative-energy", "creative-energy-2"];
      expect(generateUniqueKey("Creative Energy", existingKeys)).toBe(
        "creative-energy-3",
      );
    });

    it("handles empty existing keys", () => {
      expect(generateUniqueKey("New Type", [])).toBe("new-type");
    });

    it("handles key that matches exactly", () => {
      const existingKeys = ["physical"];
      expect(generateUniqueKey("Physical", existingKeys)).toBe("physical-2");
    });
  });
});
