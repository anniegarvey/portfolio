import { describe, expect, it } from "vitest";
import type { EnergyTypeConfig } from "@/lib/energy-planner/schema";
import { defaultCapacity, getDefaultCapacity } from "./utils";

describe("hooks/utils", () => {
  describe("getDefaultCapacity", () => {
    it("returns capacity object with 50 for each energy type", () => {
      const energyTypes: EnergyTypeConfig[] = [
        { id: "physical", label: "Physical", color: "#ff0000", isPreset: true },
        { id: "social", label: "Social", color: "#00ff00", isPreset: true },
      ];

      const capacity = getDefaultCapacity(energyTypes);

      expect(capacity).toEqual({
        physical: 50,
        social: 50,
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
        custom: 50,
      });
    });
  });

  describe("defaultCapacity", () => {
    it("is defined with default energy types", () => {
      expect(defaultCapacity).toBeDefined();
      expect(defaultCapacity.physical).toBe(50);
      expect(defaultCapacity.social).toBe(50);
      expect(defaultCapacity.executive).toBe(50);
    });
  });
});
