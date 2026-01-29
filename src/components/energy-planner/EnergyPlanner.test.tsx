import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";
import { useEnergyPlanner } from "@/lib/energy-planner/context";
import type { Task } from "@/lib/energy-planner/schema";
import { EnergyPlanner } from "./EnergyPlanner";

// Mock dependencies
vi.mock("@/lib/energy-planner/context");
vi.mock("@/components/energy-planner/ImportExport", () => ({
  ImportExport: () => <div data-testid="import-export">ImportExport</div>,
}));
vi.mock("@/components/energy-planner/DateSelector", () => ({
  DateSelector: () => <div data-testid="date-selector">Date Selector</div>,
}));
vi.mock("@/components/energy-planner/DayPlanner", () => ({
  DayPlanner: ({
    onOpenCreateTask,
    onEditTask,
  }: {
    onOpenCreateTask: () => void;
    onEditTask: (task: Task) => void;
  }) => (
    <div data-testid="day-planner">
      Day Planner
      <button
        data-testid="new-task-btn"
        onClick={onOpenCreateTask}
        type="button"
      >
        New Task
      </button>
      <button
        data-testid="edit-task-btn"
        onClick={() =>
          onEditTask({
            id: "1",
            title: "Test Task",
            energyCost: {},
            createdAt: new Date(),
            factors: {
              initiationDifficulty: 0,
              terminationDifficulty: 0,
              isRestorative: false,
            },
            completed: false,
          })
        }
        type="button"
      >
        Edit Task
      </button>
    </div>
  ),
}));
vi.mock("@/components/energy-planner/EnergyInput", () => ({
  EnergyInput: () => <div data-testid="energy-input">Energy Input</div>,
}));
vi.mock("@/components/energy-planner/TaskForm", () => ({
  TaskForm: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="task-form">
      Task Form
      <button data-testid="close-task-form-btn" onClick={onClose} type="button">
        Close Form
      </button>
    </div>
  ),
}));
// Mock Modal to just render children if open
vi.mock("@/components/Modal", () => ({
  Modal: ({
    isOpen,
    children,
    title,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
    title: string;
  }) =>
    isOpen ? (
      <div data-testid="modal">
        <h1>{title}</h1>
        {children}
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
      currentDate: new Date(),
      goToToday: mockGoToToday,
      goToNextDay: mockGoToNextDay,
      goToPreviousDay: mockGoToPreviousDay,
    });
  });

  test("renders main components", () => {
    render(<EnergyPlanner />);

    expect(screen.getByText("Energy Planner")).toBeInTheDocument();
    expect(screen.getByTestId("import-export")).toBeInTheDocument();
    expect(screen.getByTestId("date-selector")).toBeInTheDocument();
    expect(screen.getByTestId("energy-input")).toBeInTheDocument();
    expect(screen.getByTestId("day-planner")).toBeInTheDocument();
  });

  test("opens and closes task modal", () => {
    render(<EnergyPlanner />);

    // Initial state: modal closed (not in document or empty)
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();

    // Trigger open via DayPlanner mock (it has a New Task button)
    fireEvent.click(screen.getByTestId("new-task-btn"));

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByText("Create New Task")).toBeInTheDocument();

    // Close it
    fireEvent.click(screen.getByTestId("close-task-form-btn"));
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  test("opens edit task modal", () => {
    render(<EnergyPlanner />);

    // Click edit button from our enhanced mock
    fireEvent.click(screen.getByTestId("edit-task-btn"));

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Edit Task" }),
    ).toBeInTheDocument();
  });
});
