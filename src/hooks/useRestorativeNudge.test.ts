import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Activity, ResolvedActivity } from "@/lib/energy-planner/schema";
import {
  DEFAULT_RESTORATIVE_SUGGESTIONS,
  useRestorativeNudge,
} from "./useRestorativeNudge";

function makeActivity(
  id: string,
  isRestorative = false,
  overrides?: Partial<Activity>,
): Activity {
  return {
    id,
    title: `Activity ${id}`,
    energyCost: {},
    factors: {
      initiationDifficulty: 0,
      terminationDifficulty: 0,
      isRestorative,
    },
    createdAt: new Date(),
    ...overrides,
  };
}

function makeResolved(id: string, isRestorative = false): ResolvedActivity {
  return {
    instance: { id, sourceActivityId: id, completed: false },
    activity: makeActivity(id, isRestorative),
  };
}

const NON_RESTORATIVE = [
  makeResolved("a1"),
  makeResolved("a2"),
  makeResolved("a3"),
];

describe("useRestorativeNudge", () => {
  describe("shouldShow", () => {
    it("is false when fewer than 3 non-restorative activities are planned", () => {
      const { result } = renderHook(() =>
        useRestorativeNudge([makeResolved("a1"), makeResolved("a2")], []),
      );
      expect(result.current.shouldShow).toBe(false);
    });

    it("is true when 3+ non-restorative and no restorative activities", () => {
      const { result } = renderHook(() =>
        useRestorativeNudge(NON_RESTORATIVE, []),
      );
      expect(result.current.shouldShow).toBe(true);
    });

    it("is false when 3+ non-restorative but at least one restorative is planned", () => {
      const { result } = renderHook(() =>
        useRestorativeNudge([...NON_RESTORATIVE, makeResolved("r1", true)], []),
      );
      expect(result.current.shouldShow).toBe(false);
    });

    it("is false after dismissal with the same plan", () => {
      const { result } = renderHook(() =>
        useRestorativeNudge(NON_RESTORATIVE, []),
      );
      expect(result.current.shouldShow).toBe(true);

      act(() => result.current.dismiss());

      expect(result.current.shouldShow).toBe(false);
    });

    it("reappears after dismissal when the plan changes", () => {
      let resolved = NON_RESTORATIVE;
      const { result, rerender } = renderHook(() =>
        useRestorativeNudge(resolved, []),
      );

      act(() => result.current.dismiss());
      expect(result.current.shouldShow).toBe(false);

      resolved = [
        ...NON_RESTORATIVE,
        makeResolved("a4"), // plan now has a new activity
      ];
      rerender();

      expect(result.current.shouldShow).toBe(true);
    });
  });

  describe("nonRestorativeCount", () => {
    it("counts only non-restorative planned activities", () => {
      const { result } = renderHook(() =>
        useRestorativeNudge([...NON_RESTORATIVE, makeResolved("r1", true)], []),
      );
      expect(result.current.nonRestorativeCount).toBe(3);
    });
  });

  describe("suggestions", () => {
    it("returns up to 3 restorative activities from available activities", () => {
      const available = [
        makeActivity("r1", true, { title: "Yoga" }),
        makeActivity("r2", true, { title: "Nap" }),
        makeActivity("r3", true, { title: "Bath" }),
        makeActivity("r4", true, { title: "Extra" }),
        makeActivity("nr1", false, { title: "Work" }),
      ];
      const { result } = renderHook(() =>
        useRestorativeNudge(NON_RESTORATIVE, available),
      );
      expect(result.current.restorativeSuggestions).toHaveLength(3);
      expect(result.current.restorativeSuggestions[0].title).toBe("Yoga");
    });

    it("excludes non-restorative available activities from suggestions", () => {
      const available = [makeActivity("nr1", false, { title: "Work" })];
      const { result } = renderHook(() =>
        useRestorativeNudge(NON_RESTORATIVE, available),
      );
      expect(result.current.restorativeSuggestions).toHaveLength(0);
    });

    it("always returns the default suggestions list", () => {
      const { result } = renderHook(() =>
        useRestorativeNudge(NON_RESTORATIVE, []),
      );
      expect(result.current.defaultSuggestions).toEqual(
        DEFAULT_RESTORATIVE_SUGGESTIONS,
      );
    });
  });
});
