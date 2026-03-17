import { renderHook } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@/lib/energy-planner/schema";
import { useActivityForm } from "./useActivityForm";

const mockActivity: Activity = {
  id: "activity-1",
  title: "Test Activity",
  createdAt: new Date(),
  energyCost: { physical: 10, social: 20, executive: 5 },
  factors: {
    initiationDifficulty: 3,
    terminationDifficulty: 7,
    isRestorative: true,
  },
};

// Mock the context hook
vi.mock("@/lib/energy-planner/context", () => ({
  useEnergyPlanner: vi.fn(),
}));

import { useEnergyPlanner } from "@/lib/energy-planner/context";

describe("useActivityForm", () => {
  const mockAddActivity = vi.fn().mockReturnValue({ id: "new-activity-id" });
  const mockUpdateActivity = vi.fn();
  const mockAddToPlan = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useEnergyPlanner as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      addActivity: mockAddActivity,
      updateActivity: mockUpdateActivity,
      addToPlan: mockAddToPlan,
      isLoading: false,
      oneOffActivities: [],
      repeatingActivities: [],
    });
  });

  it("initializes with default values when no initial data", () => {
    const { result } = renderHook(() => useActivityForm({}));

    expect(result.current.title).toBe("");
    expect(result.current.energyCost).toEqual({
      physical: 0,
      social: 0,
      executive: 0,
    });
    expect(result.current.factors).toEqual({
      initiationDifficulty: 0,
      terminationDifficulty: 0,
      isRestorative: false,
    });
  });

  it("initializes with initial data when provided", () => {
    const { result } = renderHook(() =>
      useActivityForm({ initialData: mockActivity }),
    );

    expect(result.current.title).toBe("Test Activity");
    expect(result.current.energyCost).toEqual({
      physical: 10,
      social: 20,
      executive: 5,
    });
    expect(result.current.factors).toEqual({
      initiationDifficulty: 3,
      terminationDifficulty: 7,
      isRestorative: true,
    });
  });

  it("updates title when setTitle is called", () => {
    const { result } = renderHook(() => useActivityForm({}));

    act(() => {
      result.current.setTitle("New Title");
    });

    expect(result.current.title).toBe("New Title");
  });

  it("updates energy cost when setEnergyCost is called", () => {
    const { result } = renderHook(() => useActivityForm({}));

    act(() => {
      result.current.setEnergyCost({ physical: 50, social: 60, executive: 70 });
    });

    expect(result.current.energyCost).toEqual({
      physical: 50,
      social: 60,
      executive: 70,
    });
  });

  it("updates factors when setFactors is called", () => {
    const { result } = renderHook(() => useActivityForm({}));

    act(() => {
      result.current.setFactors({
        initiationDifficulty: 8,
        terminationDifficulty: 2,
        isRestorative: true,
      });
    });

    expect(result.current.factors).toEqual({
      initiationDifficulty: 8,
      terminationDifficulty: 2,
      isRestorative: true,
    });
  });

  it("calls onClose when form is submitted with initial data", () => {
    const mockOnClose = vi.fn();
    const { result } = renderHook(() =>
      useActivityForm({ initialData: mockActivity, onClose: mockOnClose }),
    );

    act(() => {
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockUpdateActivity).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("resets form when submitted without onClose", () => {
    const { result } = renderHook(() => useActivityForm({}));

    // Setup form
    act(() => {
      result.current.setTitle("Test");
      result.current.setEnergyCost({ physical: 50, social: 60, executive: 70 });
      result.current.setFactors({
        initiationDifficulty: 8,
        terminationDifficulty: 2,
        isRestorative: true,
      });
    });

    // Submit
    act(() => {
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockAddActivity).toHaveBeenCalled();
    expect(result.current.title).toBe("");
    expect(result.current.energyCost).toEqual({
      physical: 0,
      social: 0,
      executive: 0,
    });
    expect(result.current.factors).toEqual({
      initiationDifficulty: 0,
      terminationDifficulty: 0,
      isRestorative: false,
    });
  });

  it("does not submit when title is empty", () => {
    const mockOnClose = vi.fn();
    const { result } = renderHook(() =>
      useActivityForm({ onClose: mockOnClose }),
    );

    act(() => {
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockAddActivity).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("assigns zone when creating a repeating activity with context", () => {
    const mockOnClose = vi.fn();
    const { result } = renderHook(() =>
      useActivityForm({
        initialContext: { date: "2024-01-01", zoneId: "morning" },
        onClose: mockOnClose,
      }),
    );

    act(() => {
      result.current.setTitle("Repeating w/ Zone");
      result.current.setIsRepeating(true);
      result.current.setFrequency(1);
      result.current.setUnit("days");
    });

    act(() => {
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockAddActivity).toHaveBeenCalled();
    // Validate that addActivity is called with defaultZoneId in the repeatConfig
    const addActivityCall = mockAddActivity.mock.calls[0][0];
    expect(addActivityCall.repeatConfig.defaultZoneId).toBe("morning");
    expect(addActivityCall.repeatConfig.nextDueDate).toBe("2024-01-01");
  });

  it("pre-selects defaultZoneId from context if it exists", () => {
    const { result } = renderHook(() =>
      useActivityForm({
        initialContext: { date: "2024-01-01", zoneId: "morning" },
      }),
    );

    expect(result.current.defaultZoneId).toBe("morning");
  });

  it("resets defaultZoneId to initial context zoneId", () => {
    const { result } = renderHook(() =>
      useActivityForm({
        initialContext: { date: "2024-01-01", zoneId: "afternoon" },
      }),
    );

    act(() => {
      result.current.setTitle("Test"); // Need title to submit
      result.current.setDefaultZoneId("evening");
    });
    expect(result.current.defaultZoneId).toBe("evening");

    act(() => {
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    // handleSubmit calls resetForm if no onClose is provided
    expect(result.current.defaultZoneId).toBe("afternoon");
  });

  it("returns empty suggestions when title is empty", () => {
    const { result } = renderHook(() => useActivityForm({}));
    expect(result.current.suggestions).toEqual([]);
  });

  it("returns suggestions matching the typed title", () => {
    (useEnergyPlanner as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      addActivity: mockAddActivity,
      updateActivity: mockUpdateActivity,
      addToPlan: mockAddToPlan,
      isLoading: false,
      oneOffActivities: [
        {
          ...mockActivity,
          id: "a1",
          title: "Do Laundry",
          createdAt: new Date("2024-01-01"),
        },
        {
          ...mockActivity,
          id: "a2",
          title: "Buy Groceries",
          createdAt: new Date("2024-01-01"),
        },
      ],
      repeatingActivities: [],
    });

    const { result } = renderHook(() => useActivityForm({}));

    act(() => {
      result.current.setTitle("laundry");
    });

    expect(result.current.suggestions).toHaveLength(1);
    expect(result.current.suggestions[0].title).toBe("Do Laundry");
  });

  it("deduplicates suggestions by title keeping the most recent", () => {
    (useEnergyPlanner as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      addActivity: mockAddActivity,
      updateActivity: mockUpdateActivity,
      addToPlan: mockAddToPlan,
      isLoading: false,
      oneOffActivities: [
        {
          ...mockActivity,
          id: "a1",
          title: "Do Laundry",
          createdAt: new Date("2024-01-01"),
        },
        {
          ...mockActivity,
          id: "a2",
          title: "do laundry",
          createdAt: new Date("2024-06-01"),
        },
      ],
      repeatingActivities: [],
    });

    const { result } = renderHook(() => useActivityForm({}));

    act(() => {
      result.current.setTitle("laundry");
    });

    expect(result.current.suggestions).toHaveLength(1);
    expect(result.current.suggestions[0].id).toBe("a2");
  });

  it("populateFromActivity fills all fields for a one-off activity", () => {
    const activity: Activity = {
      id: "populate-1",
      createdAt: new Date(),
      title: "Populate Me",
      description: "Some description",
      energyCost: { physical: 30, social: 40, executive: 50 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 2,
        isRestorative: true,
      },
      defaultZoneId: "morning",
    };

    const { result } = renderHook(() => useActivityForm({}));

    act(() => {
      result.current.populateFromActivity(activity);
    });

    expect(result.current.title).toBe("Populate Me");
    expect(result.current.description).toBe("Some description");
    expect(result.current.energyCost).toEqual({
      physical: 30,
      social: 40,
      executive: 50,
    });
    expect(result.current.factors).toEqual({
      initiationDifficulty: 5,
      terminationDifficulty: 2,
      isRestorative: true,
    });
    expect(result.current.defaultZoneId).toBe("morning");
    expect(result.current.isRepeating).toBe(false);
    expect(result.current.frequency).toBe(1);
    expect(result.current.unit).toBe("days");
  });

  it("populateFromActivity fills repeat config for a repeating activity", () => {
    const activity: Activity = {
      id: "repeat-1",
      createdAt: new Date(),
      title: "Weekly Jog",
      energyCost: { physical: 60, social: 0, executive: 10 },
      factors: {
        initiationDifficulty: 4,
        terminationDifficulty: 1,
        isRestorative: true,
      },
      repeatConfig: { frequency: 1, unit: "weeks", nextDueDate: "2024-03-01" },
    };

    const { result } = renderHook(() => useActivityForm({}));

    act(() => {
      result.current.populateFromActivity(activity);
    });

    expect(result.current.title).toBe("Weekly Jog");
    expect(result.current.isRepeating).toBe(true);
    expect(result.current.frequency).toBe(1);
    expect(result.current.unit).toBe("weeks");
    expect(result.current.nextDueDate).toBe("2024-03-01");
  });

  it("provides a unique formId", () => {
    const { result } = renderHook(() => useActivityForm({}));

    expect(result.current.formId).toBeDefined();
    expect(typeof result.current.formId).toBe("string");
  });

  it("calls onCreated after planning a one-off activity with date and zone context", () => {
    const mockOnClose = vi.fn();
    const mockOnCreated = vi.fn();
    const { result } = renderHook(() =>
      useActivityForm({
        initialContext: { date: "2024-01-01", zoneId: "morning" },
        onClose: mockOnClose,
        onCreated: mockOnCreated,
      }),
    );

    act(() => {
      result.current.setTitle("Planned Activity");
    });

    act(() => {
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockAddToPlan).toHaveBeenCalledWith(
      "new-activity-id",
      "morning",
      expect.objectContaining({ id: "new-activity-id" }),
    );
    expect(mockOnCreated).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("does not call onCreated when creating a repeating activity", () => {
    const mockOnCreated = vi.fn();
    const { result } = renderHook(() =>
      useActivityForm({
        initialContext: { date: "2024-01-01", zoneId: "morning" },
        onCreated: mockOnCreated,
      }),
    );

    act(() => {
      result.current.setTitle("Repeating Activity");
      result.current.setIsRepeating(true);
    });

    act(() => {
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockAddActivity).toHaveBeenCalled();
    expect(mockAddToPlan).not.toHaveBeenCalled();
    expect(mockOnCreated).not.toHaveBeenCalled();
  });

  it("does not call onCreated when creating a one-off activity without zone context", () => {
    const mockOnCreated = vi.fn();
    const { result } = renderHook(() =>
      useActivityForm({
        // Date only — no zoneId, so activity should not be auto-planned
        initialContext: { date: "2024-01-01" },
        onCreated: mockOnCreated,
      }),
    );

    act(() => {
      result.current.setTitle("Unplanned Activity");
    });

    act(() => {
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockAddActivity).toHaveBeenCalled();
    expect(mockAddToPlan).not.toHaveBeenCalled();
    expect(mockOnCreated).not.toHaveBeenCalled();
  });
});
