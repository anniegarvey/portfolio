import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";
import { useEnergyPlanner } from "@/lib/energy-planner/context";
import type { Activity } from "@/lib/energy-planner/schema";
import { EnergyPlanner } from ".";

// Mock dependencies
vi.mock("@/hooks/useActivityReminders", () => ({
  useActivityReminders: vi.fn(),
}));

vi.mock("@/lib/energy-planner/context");
vi.mock("@/components/energy-planner/ImportExport", () => ({
  ImportExport: () => <div data-testid="import-export">ImportExport</div>,
}));
vi.mock("@/components/energy-planner/DateSelector", () => ({
  DateSelector: () => <div data-testid="date-selector">Date Selector</div>,
}));
vi.mock("@/components/energy-planner/DayPlanner", () => ({
  DayPlanner: ({
    onOpenCreateActivity,
    onEditActivity,
    onOpenCapacityModal,
    jotBoxRef,
  }: {
    onOpenCreateActivity: () => void;
    onEditActivity: (activity: Activity) => void;
    onOpenCapacityModal: () => void;
    jotBoxRef: React.RefObject<HTMLInputElement | null>;
  }) => (
    <div data-testid="day-planner">
      Day Planner
      <input aria-label="Jot down an idea" ref={jotBoxRef} />
      <button
        data-testid="open-capacity-btn"
        onClick={onOpenCapacityModal}
        type="button"
      >
        Open Capacity
      </button>
      <button
        data-testid="new-activity-btn"
        onClick={onOpenCreateActivity}
        type="button"
      >
        New Activity
      </button>
      <button
        data-testid="edit-activity-btn"
        onClick={() =>
          onEditActivity({
            id: "1",
            title: "Test Activity",
            energyCost: {},
            createdAt: new Date(),
            factors: {
              initiationDifficulty: 0,
              terminationDifficulty: 0,
              isRestorative: false,
            },
          })
        }
        type="button"
      >
        Edit Activity
      </button>
    </div>
  ),
}));
let closeFocusEvent = new Event("focusout", { cancelable: true });
vi.mock("@/components/energy-planner/EnergyCapacityModal", () => ({
  EnergyCapacityModal: ({
    isOpen,
    onClose,
    onCloseAutoFocus,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onCloseAutoFocus: (event: Event) => void;
  }) =>
    isOpen ? (
      <div data-testid="energy-capacity-modal">
        Capacity Modal
        <button
          data-testid="capacity-close-focus"
          onClick={() => {
            closeFocusEvent = new Event("focusout", { cancelable: true });
            onCloseAutoFocus(closeFocusEvent);
          }}
          type="button"
        >
          Close focus
        </button>
        <button
          data-testid="close-capacity-btn"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>
    ) : null,
}));
vi.mock("@/components/energy-planner/ActivityForm", () => ({
  ActivityForm: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="activity-form">
      Activity Form
      <button
        data-testid="close-activity-form-btn"
        onClick={onClose}
        type="button"
      >
        Close Form
      </button>
    </div>
  ),
}));
vi.mock("@/components/energy-planner/CreateActivity", () => ({
  CreateActivity: ({
    isOpen,
    onClose,
    editingActivity,
  }: {
    isOpen: boolean;
    onClose: () => void;
    editingActivity?: Activity;
  }) =>
    isOpen ? (
      <div data-testid="modal">
        <h1>{editingActivity ? "Edit Activity" : "Create New Activity"}</h1>
        <button
          data-testid="close-activity-modal-btn"
          onClick={onClose}
          type="button"
        >
          Close Modal
        </button>
      </div>
    ) : null,
}));
// Mock PageHeader components
vi.mock("@/components/PageHeader", () => ({
  PageHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PageTitle: ({ children }: { children: React.ReactNode }) => (
    <h1>{children}</h1>
  ),
}));
// Mock MaxWidthWrapper
vi.mock("@/components/MaxWidthWrapper", () => ({
  MaxWidthWrapper: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("EnergyPlanner", () => {
  const mockGoToToday = vi.fn();
  const mockGoToNextDay = vi.fn();
  const mockGoToPreviousDay = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useEnergyPlanner as unknown as Mock).mockReturnValue({
      currentDate: new Date().toISOString().split("T")[0],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
      goToToday: mockGoToToday,
      goToNextDay: mockGoToNextDay,
      goToPreviousDay: mockGoToPreviousDay,
    });
  });

  test("renders main components", () => {
    render(<EnergyPlanner />);

    expect(screen.getByText("Energy Planner")).toBeInTheDocument();
    expect(screen.getByTestId("import-export")).toBeInTheDocument();
    expect(screen.getByTestId("day-planner")).toBeInTheDocument();
    expect(
      screen.queryByTestId("energy-capacity-modal"),
    ).not.toBeInTheDocument();
  });

  test("auto-opens capacity modal if viewing today and no capacity set", () => {
    // Override standard mock to return no capacity
    (useEnergyPlanner as unknown as Mock).mockReturnValue({
      currentDate: new Date().toISOString().split("T")[0], // Today
      dailyCapacity: { physical: 0, social: 0, executive: 0 },
      goToToday: mockGoToToday,
      goToNextDay: mockGoToNextDay,
      goToPreviousDay: mockGoToPreviousDay,
    });

    render(<EnergyPlanner />);

    // If it auto opens, modal should be in the document
    expect(screen.getByTestId("energy-capacity-modal")).toBeInTheDocument();
  });

  test("opens and closes capacity modal manually", () => {
    render(<EnergyPlanner />);

    // Trigger open via DayPlanner mock
    fireEvent.click(screen.getByTestId("open-capacity-btn"));
    expect(screen.getByTestId("energy-capacity-modal")).toBeInTheDocument();

    // Close it
    fireEvent.click(screen.getByTestId("close-capacity-btn"));
    expect(
      screen.queryByTestId("energy-capacity-modal"),
    ).not.toBeInTheDocument();
  });

  test("in the installed app, closing the daily energy prompt focuses the jot box", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    (useEnergyPlanner as unknown as Mock).mockReturnValue({
      currentDate: new Date().toISOString().split("T")[0],
      dailyCapacity: { physical: 0, social: 0, executive: 0 },
    });
    render(<EnergyPlanner />);

    fireEvent.click(screen.getByTestId("capacity-close-focus"));

    expect(closeFocusEvent.defaultPrevented).toBe(true);
    expect(screen.getByLabelText("Jot down an idea")).toHaveFocus();
    vi.unstubAllGlobals();
  });

  test("closing the capacity modal opened from its button leaves focus alone", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    render(<EnergyPlanner />);
    fireEvent.click(screen.getByTestId("open-capacity-btn"));

    fireEvent.click(screen.getByTestId("capacity-close-focus"));

    expect(screen.getByLabelText("Jot down an idea")).not.toHaveFocus();
    expect(closeFocusEvent.defaultPrevented).toBe(false);
    vi.unstubAllGlobals();
  });

  test("in a browser tab, closing the daily energy prompt leaves focus alone", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    (useEnergyPlanner as unknown as Mock).mockReturnValue({
      currentDate: new Date().toISOString().split("T")[0],
      dailyCapacity: { physical: 0, social: 0, executive: 0 },
    });
    render(<EnergyPlanner />);

    fireEvent.click(screen.getByTestId("capacity-close-focus"));

    expect(screen.getByLabelText("Jot down an idea")).not.toHaveFocus();
    expect(closeFocusEvent.defaultPrevented).toBe(false);
    vi.unstubAllGlobals();
  });

  test("opens and closes activity modal", () => {
    render(<EnergyPlanner />);

    // Initial state: modal closed (not in document or empty)
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();

    // Trigger open via DayPlanner mock (it has a New Activity button)
    fireEvent.click(screen.getByTestId("new-activity-btn"));

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByText("Create New Activity")).toBeInTheDocument();

    // Close it
    fireEvent.click(screen.getByTestId("close-activity-modal-btn"));
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  test("opens edit activity modal", () => {
    render(<EnergyPlanner />);

    // Click edit button from our enhanced mock
    fireEvent.click(screen.getByTestId("edit-activity-btn"));

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Edit Activity" }),
    ).toBeInTheDocument();
  });
});
