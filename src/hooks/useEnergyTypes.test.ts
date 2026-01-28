import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAll,
  fetchEnergyTypes,
  storeEnergyTypes,
} from "@/lib/energy-planner/storage";
import { useEnergyTypes } from "./useEnergyTypes";

describe("useEnergyTypes", () => {
  beforeEach(async () => {
    await clearAll();
  });

  it("initializes with default energy types", async () => {
    const { result } = renderHook(() => useEnergyTypes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.energyTypes).toHaveLength(3);
    expect(result.current.energyTypes.map((t) => t.id)).toContain("physical");
    expect(result.current.energyTypes.map((t) => t.id)).toContain("social");
    expect(result.current.energyTypes.map((t) => t.id)).toContain("executive");
  });

  it("loads energy types from IndexedDB on mount", async () => {
    await storeEnergyTypes([
      { id: "custom", label: "Custom", color: "#ff0000", isPreset: false },
    ]);

    const { result } = renderHook(() => useEnergyTypes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.energyTypes).toHaveLength(1);
    expect(result.current.energyTypes[0].id).toBe("custom");
  });

  it("adds a new energy type with human-readable id based on label", async () => {
    const { result } = renderHook(() => useEnergyTypes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addEnergyType({
        label: "Creative Energy",
        color: "#ff0000",
      });
    });

    expect(result.current.energyTypes).toHaveLength(4);
    const newType = result.current.energyTypes.find(
      (t) => t.label === "Creative Energy",
    );
    expect(newType).toBeDefined();
    expect(newType?.id).toBe("creative-energy");
    expect(newType?.isPreset).toBe(false);
  });

  it("generates unique id when label clashes with existing key", async () => {
    const { result } = renderHook(() => useEnergyTypes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // "Physical" should clash with the preset "physical" id
    act(() => {
      result.current.addEnergyType({
        label: "Physical",
        color: "#ff0000",
      });
    });

    const newType = result.current.energyTypes.find(
      (t) => t.label === "Physical" && !t.isPreset,
    );
    expect(newType).toBeDefined();
    expect(newType?.id).toBe("physical-2");
  });

  it("updates an existing energy type", async () => {
    const { result } = renderHook(() => useEnergyTypes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

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

  it("updates only the specified energy type", async () => {
    const { result } = renderHook(() => useEnergyTypes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

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

  it("removes an energy type", async () => {
    const { result } = renderHook(() => useEnergyTypes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

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

  it("removes only the specified energy type", async () => {
    const { result } = renderHook(() => useEnergyTypes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

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

  it("persists energy types to IndexedDB", async () => {
    const { result } = renderHook(() => useEnergyTypes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addEnergyType({
        label: "Persisted",
        color: "#ff0000",
      });
    });

    await waitFor(async () => {
      const stored = await fetchEnergyTypes();
      expect(stored).toBeDefined();
      expect(stored?.find((t) => t.label === "Persisted")).toBeDefined();
    });
  });
});
