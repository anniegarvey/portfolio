import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as storageMock from "@/lib/energy-planner/storage";
import { EnergyPlannerProvider } from "./context";
import {
  useActivityManagement,
  useDayPlanActions,
  useEnergyConfiguration,
} from "./hooks";

vi.mock("@/lib/energy-planner/storage");

const wrapper = ({ children }: { children: ReactNode }) => (
  <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
);

describe("useDayPlanActions", () => {
  beforeEach(() => {
    // biome-ignore lint/suspicious/noExplicitAny: wrapper for mock reset
    (storageMock as any).__reset();
    localStorage.clear();
  });

  it("throws when used outside provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useDayPlanActions())).toThrow(
      "useEnergyPlanner must be used within an EnergyPlannerProvider",
    );
    consoleSpy.mockRestore();
  });

  it("exposes day plan navigation and mutation methods", async () => {
    const { result } = renderHook(() => useDayPlanActions(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current).toMatchObject({
      currentDate: expect.any(String),
      dayPlan: expect.any(Object),
      resolvedActivities: expect.any(Array),
      navigateToDate: expect.any(Function),
      goToPreviousDay: expect.any(Function),
      goToNextDay: expect.any(Function),
      goToToday: expect.any(Function),
      addToPlan: expect.any(Function),
      removeFromPlan: expect.any(Function),
      toggleActivityCompletion: expect.any(Function),
      markActivityCompleteOnDate: expect.any(Function),
      moveActivityToToday: expect.any(Function),
      moveActivityToUnplanned: expect.any(Function),
      moveActivityToDate: expect.any(Function),
      energyUsage: expect.any(Object),
      capacityWarnings: expect.any(Array),
      uncompletedActivities: expect.any(Array),
      reorderPlannedActivities: expect.any(Function),
      assignActivityToZone: expect.any(Function),
      skipActivity: expect.any(Function),
      isLoading: false,
    });
  });

  it("does not expose activity CRUD or energy type methods", async () => {
    const { result } = renderHook(() => useDayPlanActions(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current).not.toHaveProperty("addActivity");
    expect(result.current).not.toHaveProperty("energyTypes");
    expect(result.current).not.toHaveProperty("setDailyCapacity");
  });
});

describe("useActivityManagement", () => {
  beforeEach(() => {
    // biome-ignore lint/suspicious/noExplicitAny: wrapper for mock reset
    (storageMock as any).__reset();
    localStorage.clear();
  });

  it("throws when used outside provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useActivityManagement())).toThrow(
      "useEnergyPlanner must be used within an EnergyPlannerProvider",
    );
    consoleSpy.mockRestore();
  });

  it("exposes activity CRUD and list methods", async () => {
    const { result } = renderHook(() => useActivityManagement(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current).toMatchObject({
      oneOffActivities: expect.any(Array),
      repeatingActivities: expect.any(Array),
      availableActivities: expect.any(Array),
      addActivity: expect.any(Function),
      updateActivity: expect.any(Function),
      removeActivity: expect.any(Function),
      reorderActivities: expect.any(Function),
      reorderRepeatingActivities: expect.any(Function),
      isLoading: false,
    });
  });

  it("does not expose day plan actions or energy configuration", async () => {
    const { result } = renderHook(() => useActivityManagement(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current).not.toHaveProperty("addToPlan");
    expect(result.current).not.toHaveProperty("energyTypes");
    expect(result.current).not.toHaveProperty("currentDate");
  });
});

describe("useEnergyConfiguration", () => {
  beforeEach(() => {
    // biome-ignore lint/suspicious/noExplicitAny: wrapper for mock reset
    (storageMock as any).__reset();
    localStorage.clear();
  });

  it("throws when used outside provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useEnergyConfiguration())).toThrow(
      "useEnergyPlanner must be used within an EnergyPlannerProvider",
    );
    consoleSpy.mockRestore();
  });

  it("exposes energy types, capacity, and zone configuration", async () => {
    const { result } = renderHook(() => useEnergyConfiguration(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current).toMatchObject({
      energyTypes: expect.any(Array),
      addEnergyType: expect.any(Function),
      updateEnergyType: expect.any(Function),
      removeEnergyType: expect.any(Function),
      dailyCapacity: expect.any(Object),
      setDailyCapacity: expect.any(Function),
      zones: expect.any(Array),
      addZone: expect.any(Function),
      updateZone: expect.any(Function),
      removeZone: expect.any(Function),
      reorderZones: expect.any(Function),
      isLoading: false,
    });
  });

  it("does not expose day plan actions or activity management", async () => {
    const { result } = renderHook(() => useEnergyConfiguration(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current).not.toHaveProperty("addToPlan");
    expect(result.current).not.toHaveProperty("addActivity");
    expect(result.current).not.toHaveProperty("currentDate");
  });
});
