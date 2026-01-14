import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../lib/energy-planner/context";
import type { Task } from "../../lib/energy-planner/schema";
import { UncompletedTaskCard } from "./UncompletedTaskCard";

const mockTask: Task = {
  id: "test-task-1",
  title: "Test Uncompleted Task",
  description: "A task from yesterday",
  energyCost: { physical: 10, social: 5, executive: 15 },
  factors: {
    initiationDifficulty: 5,
    terminationDifficulty: 3,
    isRestorative: false,
  },
  createdAt: new Date(),
};

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite with multiple test cases
describe("UncompletedTaskCard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders task title", () => {
    const mockOnEdit = vi.fn();
    render(
      <EnergyPlannerProvider>
        <UncompletedTaskCard
          fromDate="2026-01-13"
          onEdit={mockOnEdit}
          task={mockTask}
        />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByText("Test Uncompleted Task")).toBeInTheDocument();
  });

  it("displays the original date", () => {
    const mockOnEdit = vi.fn();
    render(
      <EnergyPlannerProvider>
        <UncompletedTaskCard
          fromDate="2026-01-13"
          onEdit={mockOnEdit}
          task={mockTask}
        />
      </EnergyPlannerProvider>,
    );

    // Match partial date format - locale may vary
    expect(screen.getByText(/from.*January.*13.*2026/)).toBeInTheDocument();
  });

  it("displays energy badges", () => {
    const mockOnEdit = vi.fn();
    render(
      <EnergyPlannerProvider>
        <UncompletedTaskCard
          fromDate="2026-01-13"
          onEdit={mockOnEdit}
          task={mockTask}
        />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByText(/10.*P/)).toBeInTheDocument();
    expect(screen.getByText(/5.*S/)).toBeInTheDocument();
    expect(screen.getByText(/15.*E/)).toBeInTheDocument();
  });

  it("hides unchecked/zero energy types", () => {
    const mockOnEdit = vi.fn();
    const zeroEnergyTask: Task = {
      ...mockTask,
      energyCost: { physical: 10, social: 0, executive: 0 },
    };

    render(
      <EnergyPlannerProvider>
        <UncompletedTaskCard
          fromDate="2026-01-13"
          onEdit={mockOnEdit}
          task={zeroEnergyTask}
        />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByText(/10.*P/)).toBeInTheDocument();
    expect(screen.queryByText(/S/)).not.toBeInTheDocument();
    expect(screen.queryByText(/E/)).not.toBeInTheDocument();
  });

  it("calls onEdit when task title clicked", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    render(
      <EnergyPlannerProvider>
        <UncompletedTaskCard
          fromDate="2026-01-13"
          onEdit={mockOnEdit}
          task={mockTask}
        />
      </EnergyPlannerProvider>,
    );

    await user.click(screen.getByText("Test Uncompleted Task"));
    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  it("renders Complete button", () => {
    const mockOnEdit = vi.fn();
    render(
      <EnergyPlannerProvider>
        <UncompletedTaskCard
          fromDate="2026-01-13"
          onEdit={mockOnEdit}
          task={mockTask}
        />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByLabelText("Mark as complete")).toBeInTheDocument();
  });

  it("renders Move to Today button", () => {
    const mockOnEdit = vi.fn();
    render(
      <EnergyPlannerProvider>
        <UncompletedTaskCard
          fromDate="2026-01-13"
          onEdit={mockOnEdit}
          task={mockTask}
        />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByLabelText("Move to today")).toBeInTheDocument();
  });

  it("renders Unplan button", () => {
    const mockOnEdit = vi.fn();
    render(
      <EnergyPlannerProvider>
        <UncompletedTaskCard
          fromDate="2026-01-13"
          onEdit={mockOnEdit}
          task={mockTask}
        />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByLabelText("Return to unplanned")).toBeInTheDocument();
  });

  it("handles Complete button click", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();

    // Setup localStorage with the task planned for fromDate
    localStorage.setItem(
      "energy_planner_day_plan_2026-01-13",
      JSON.stringify({
        date: "2026-01-13",
        selectedTaskIds: ["test-task-1"],
        completedTaskIds: [],
        dailyCapacity: { physical: 50, social: 50, executive: 50 },
      }),
    );

    render(
      <EnergyPlannerProvider>
        <UncompletedTaskCard
          fromDate="2026-01-13"
          onEdit={mockOnEdit}
          task={mockTask}
        />
      </EnergyPlannerProvider>,
    );

    await user.click(screen.getByLabelText("Mark as complete"));
    // Button should be clickable without errors
    expect(screen.getByLabelText("Mark as complete")).toBeInTheDocument();
  });

  it("handles Move to Today button click", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();

    // Setup localStorage with the task planned for fromDate
    localStorage.setItem(
      "energy_planner_day_plan_2026-01-13",
      JSON.stringify({
        date: "2026-01-13",
        selectedTaskIds: ["test-task-1"],
        completedTaskIds: [],
        dailyCapacity: { physical: 50, social: 50, executive: 50 },
      }),
    );

    render(
      <EnergyPlannerProvider>
        <UncompletedTaskCard
          fromDate="2026-01-13"
          onEdit={mockOnEdit}
          task={mockTask}
        />
      </EnergyPlannerProvider>,
    );

    await user.click(screen.getByLabelText("Move to today"));
    // Button should be clickable without errors
    expect(screen.getByLabelText("Move to today")).toBeInTheDocument();
  });

  it("handles Unplan button click", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();

    // Setup localStorage with the task planned for fromDate
    localStorage.setItem(
      "energy_planner_day_plan_2026-01-13",
      JSON.stringify({
        date: "2026-01-13",
        selectedTaskIds: ["test-task-1"],
        completedTaskIds: [],
        dailyCapacity: { physical: 50, social: 50, executive: 50 },
      }),
    );

    render(
      <EnergyPlannerProvider>
        <UncompletedTaskCard
          fromDate="2026-01-13"
          onEdit={mockOnEdit}
          task={mockTask}
        />
      </EnergyPlannerProvider>,
    );

    await user.click(screen.getByLabelText("Return to unplanned"));
    // Button should be clickable without errors
    expect(screen.getByLabelText("Return to unplanned")).toBeInTheDocument();
  });
});
