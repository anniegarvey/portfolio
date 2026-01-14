import { renderHook } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { useEnergyTypes } from "./useEnergyTypes";

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple test cases
describe("useEnergyTypes", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with default energy types", () => {
    const { result } = renderHook(() => useEnergyTypes());

    expect(result.current.energyTypes).toHaveLength(3);
    expect(result.current.energyTypes.map((t) => t.id)).toContain("physical");
    expect(result.current.energyTypes.map((t) => t.id)).toContain("social");
    expect(result.current.energyTypes.map((t) => t.id)).toContain("executive");
  });

  it("loads energy types from localStorage on mount", () => {
    const storedTypes = [
      { id: "custom", label: "Custom", color: "#ff0000", isPreset: false },
    ];
    localStorage.setItem("energy_planner_types", JSON.stringify(storedTypes));

    const { result } = renderHook(() => useEnergyTypes());

    expect(result.current.energyTypes).toHaveLength(1);
    expect(result.current.energyTypes[0].id).toBe("custom");
  });

  it("adds a new energy type with generated id", () => {
    const { result } = renderHook(() => useEnergyTypes());

    act(() => {
      result.current.addEnergyType({
        label: "Custom",
        color: "#ff0000",
      });
    });

    expect(result.current.energyTypes).toHaveLength(4);
    const newType = result.current.energyTypes.find(
      (t) => t.label === "Custom",
    );
    expect(newType).toBeDefined();
    expect(newType?.id).toBeDefined();
    expect(newType?.isPreset).toBe(false);
  });

  it("updates an existing energy type", () => {
    const { result } = renderHook(() => useEnergyTypes());

    const physical = result.current.energyTypes.find(
      (t) => t.id === "physical",
    );
    expect(physical).toBeDefined();

    act(() => {
      if (physical) {
        result.current.updateEnergyType({
          ...physical,
          label: "Body Energy",
        });
      }
    });

    const updated = result.current.energyTypes.find((t) => t.id === "physical");
    expect(updated?.label).toBe("Body Energy");
  });

  it("updates only the specified energy type", () => {
    const { result } = renderHook(() => useEnergyTypes());

    const physical = result.current.energyTypes.find(
      (t) => t.id === "physical",
    );
    expect(physical).toBeDefined();

    act(() => {
      if (physical) {
        result.current.updateEnergyType({
          ...physical,
          label: "Updated Physical",
        });
      }
    });

    const updatedPhysical = result.current.energyTypes.find(
      (t) => t.id === "physical",
    );
    const social = result.current.energyTypes.find((t) => t.id === "social");

    expect(updatedPhysical?.label).toBe("Updated Physical");
    expect(social?.label).toBe("Social");
  });

  it("removes an energy type", () => {
    const { result } = renderHook(() => useEnergyTypes());

    act(() => {
      result.current.addEnergyType({
        label: "Custom",
        color: "#ff0000",
      });
    });

    const customType = result.current.energyTypes.find(
      (t) => t.label === "Custom",
    );
    expect(customType).toBeDefined();

    act(() => {
      if (customType) {
        result.current.removeEnergyType(customType.id);
      }
    });

    expect(result.current.energyTypes).toHaveLength(3);
    expect(
      result.current.energyTypes.find((t) => t.label === "Custom"),
    ).toBeUndefined();
  });

  it("removes only the specified energy type", () => {
    const { result } = renderHook(() => useEnergyTypes());

    act(() => {
      result.current.addEnergyType({
        label: "Custom 1",
        color: "#ff0000",
      });
      result.current.addEnergyType({
        label: "Custom 2",
        color: "#00ff00",
      });
    });

    const custom1 = result.current.energyTypes.find(
      (t) => t.label === "Custom 1",
    );
    expect(custom1).toBeDefined();

    act(() => {
      if (custom1) {
        result.current.removeEnergyType(custom1.id);
      }
    });

    expect(result.current.energyTypes).toHaveLength(4);
    expect(
      result.current.energyTypes.find((t) => t.label === "Custom 2"),
    ).toBeDefined();
  });

  it("persists energy types to localStorage", () => {
    const { result } = renderHook(() => useEnergyTypes());

    act(() => {
      result.current.addEnergyType({
        label: "Persisted",
        color: "#ff0000",
      });
    });

    const stored = localStorage.getItem("energy_planner_types");
    expect(stored).not.toBeNull();
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(
        parsed.find((t: { label: string }) => t.label === "Persisted"),
      ).toBeDefined();
    }
  });
});
