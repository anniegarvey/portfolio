import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAll,
  getDailyCapacity,
  setDailyCapacity,
} from "@/lib/energy-planner/storage";
import { useDailyCapacity } from "./useDailyCapacity";

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple test cases
describe("useDailyCapacity", () => {
  beforeEach(async () => {
    await clearAll();
  });

  it("initializes with default capacity", async () => {
    const { result } = renderHook(() => useDailyCapacity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dailyCapacity).toEqual({
      physical: 50,
      social: 50,
      executive: 50,
    });
  });

  it("loads capacity from IndexedDB on mount", async () => {
    const storedCapacity = { physical: 70, social: 80, executive: 90 };
    await setDailyCapacity(storedCapacity);

    const { result } = renderHook(() => useDailyCapacity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dailyCapacity).toEqual(storedCapacity);
  });

  it("updates daily capacity", async () => {
    const { result } = renderHook(() => useDailyCapacity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setDailyCapacity({
        physical: 70,
        social: 80,
        executive: 90,
      });
    });

    expect(result.current.dailyCapacity).toEqual({
      physical: 70,
      social: 80,
      executive: 90,
    });
  });

  it("persists capacity to IndexedDB", async () => {
    const { result } = renderHook(() => useDailyCapacity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setDailyCapacity({
        physical: 60,
        social: 70,
        executive: 80,
      });
    });

    await waitFor(async () => {
      const stored = await getDailyCapacity();
      expect(stored).toEqual({
        physical: 60,
        social: 70,
        executive: 80,
      });
    });
  });
});
