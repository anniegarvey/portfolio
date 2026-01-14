import { renderHook } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { useDailyCapacity } from "./useDailyCapacity";

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple test cases
describe("useDailyCapacity", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with default capacity", () => {
    const { result } = renderHook(() => useDailyCapacity());

    expect(result.current.dailyCapacity).toEqual({
      physical: 50,
      social: 50,
      executive: 50,
    });
  });

  it("loads capacity from localStorage on mount", () => {
    const storedCapacity = { physical: 70, social: 80, executive: 90 };
    localStorage.setItem(
      "energy_planner_capacity",
      JSON.stringify(storedCapacity),
    );

    const { result } = renderHook(() => useDailyCapacity());

    expect(result.current.dailyCapacity).toEqual(storedCapacity);
  });

  it("updates daily capacity", () => {
    const { result } = renderHook(() => useDailyCapacity());

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

  it("persists capacity to localStorage", () => {
    const { result } = renderHook(() => useDailyCapacity());

    act(() => {
      result.current.setDailyCapacity({
        physical: 60,
        social: 70,
        executive: 80,
      });
    });

    const stored = localStorage.getItem("energy_planner_capacity");
    expect(stored).not.toBeNull();
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed).toEqual({
        physical: 60,
        social: 70,
        executive: 80,
      });
    }
  });
});
