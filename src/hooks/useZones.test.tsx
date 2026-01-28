import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_ZONES } from "@/lib/energy-planner/schema";
import * as storageMock from "@/lib/energy-planner/storage";
import { useZones } from "./useZones";

// Manual mock
vi.mock("@/lib/energy-planner/storage");

describe("useZones", () => {
  beforeEach(async () => {
    // biome-ignore lint/suspicious/noExplicitAny: Accessing internal mock reset method
    (storageMock as any).__reset();
    vi.clearAllMocks();
  });

  it("loads default zones when storage is empty", async () => {
    const { result } = renderHook(() => useZones());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.zones).toEqual(DEFAULT_ZONES);
  });

  it("loads zones from storage", async () => {
    const storedZones = [{ id: "z1", name: "Custom Zone", order: 0 }];
    await storageMock.storeZones(storedZones);

    const { result } = renderHook(() => useZones());

    await waitFor(() => {
      expect(result.current.zones).toEqual(storedZones);
    });
  });

  it("adds a new zone", async () => {
    const { result } = renderHook(() => useZones());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addZone({ name: "New Zone", order: 3 });
    });

    expect(result.current.zones).toHaveLength(4); // 3 defaults + 1 new
    expect(result.current.zones[3].name).toBe("New Zone");
  });

  it("updates a zone", async () => {
    const { result } = renderHook(() => useZones());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const zoneToUpdate = result.current.zones[0];

    act(() => {
      result.current.updateZone({ ...zoneToUpdate, name: "Updated Morning" });
    });

    expect(result.current.zones[0].name).toBe("Updated Morning");
  });

  it("removes a zone", async () => {
    const { result } = renderHook(() => useZones());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const zoneToRemove = result.current.zones[0];

    act(() => {
      result.current.removeZone(zoneToRemove.id);
    });

    expect(result.current.zones).toHaveLength(2);
    expect(
      result.current.zones.find((z) => z.id === zoneToRemove.id),
    ).toBeUndefined();
  });

  it("prevents removing the last zone", async () => {
    const storedZones = [{ id: "z1", name: "Only Zone", order: 0 }];
    await storageMock.storeZones(storedZones);

    const { result } = renderHook(() => useZones());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.removeZone("z1");
    });

    expect(result.current.zones).toHaveLength(1);
  });

  it("reorders zones", async () => {
    const { result } = renderHook(() => useZones());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const [z1, z2, z3] = result.current.zones;

    // Swap first two
    act(() => {
      result.current.reorderZones([z2, z1, z3]);
    });

    expect(result.current.zones[0].id).toBe(z2.id);
    expect(result.current.zones[0].order).toBe(0);
    expect(result.current.zones[1].id).toBe(z1.id);
    expect(result.current.zones[1].order).toBe(1);
  });
});
