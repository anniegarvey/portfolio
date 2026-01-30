import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { EnergyPlannerProvider } from "../../../lib/energy-planner/context";
import type { Task } from "../../../lib/energy-planner/schema";
import { UncompletedTaskCard } from ".";

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
  completed: false,
};

describe("UncompletedTaskCard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders task title", () => {
    render(
      <EnergyPlannerProvider>
        <UncompletedTaskCard fromDate="2026-01-13" task={mockTask} />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByText("Test Uncompleted Task")).toBeInTheDocument();
  });

  it("displays the original date", () => {
    render(
      <EnergyPlannerProvider>
        <UncompletedTaskCard fromDate="2026-01-13" task={mockTask} />
      </EnergyPlannerProvider>,
    );

    // Match partial date format - locale may vary
    expect(screen.getByText(/from.*January.*13.*2026/)).toBeInTheDocument();
  });

  it("displays energy badges", () => {
    render(
      <EnergyPlannerProvider>
        <UncompletedTaskCard fromDate="2026-01-13" task={mockTask} />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByText(/10.*P/)).toBeInTheDocument();
    expect(screen.getByText(/5.*S/)).toBeInTheDocument();
    expect(screen.getByText(/15.*E/)).toBeInTheDocument();
  });

  it("hides unchecked/zero energy types", () => {
    const zeroEnergyTask: Task = {
      ...mockTask,
      energyCost: { physical: 10, social: 0, executive: 0 },
    };

    render(
      <EnergyPlannerProvider>
        <UncompletedTaskCard fromDate="2026-01-13" task={zeroEnergyTask} />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByText(/10.*P/)).toBeInTheDocument();
    expect(screen.queryByText(/S/)).not.toBeInTheDocument();
    expect(screen.queryByText(/E/)).not.toBeInTheDocument();
  });

  it("renders Complete button", () => {
    render(
      <EnergyPlannerProvider>
        <UncompletedTaskCard fromDate="2026-01-13" task={mockTask} />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByLabelText("Mark as complete")).toBeInTheDocument();
  });

  it("renders Move to Today button", () => {
    render(
      <EnergyPlannerProvider>
        <UncompletedTaskCard fromDate="2026-01-13" task={mockTask} />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByLabelText("Move to today")).toBeInTheDocument();
  });

  it("renders Unplan button", () => {
    render(
      <EnergyPlannerProvider>
        <UncompletedTaskCard fromDate="2026-01-13" task={mockTask} />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByLabelText("Return to unplanned")).toBeInTheDocument();
  });

  it("handles Complete button click", async () => {
    const user = userEvent.setup();

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
        <UncompletedTaskCard fromDate="2026-01-13" task={mockTask} />
      </EnergyPlannerProvider>,
    );

    await user.click(screen.getByLabelText("Mark as complete"));
    // Button should be clickable without errors
    expect(screen.getByLabelText("Mark as complete")).toBeInTheDocument();
  });

  it("handles Move to Today button click", async () => {
    const user = userEvent.setup();

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
        <UncompletedTaskCard fromDate="2026-01-13" task={mockTask} />
      </EnergyPlannerProvider>,
    );

    await user.click(screen.getByLabelText("Move to today"));
    // Button should be clickable without errors
    expect(screen.getByLabelText("Move to today")).toBeInTheDocument();
  });

  it("handles Unplan button click", async () => {
    const user = userEvent.setup();

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
        <UncompletedTaskCard fromDate="2026-01-13" task={mockTask} />
      </EnergyPlannerProvider>,
    );

    await user.click(screen.getByLabelText("Return to unplanned"));
    // Button should be clickable without errors
    expect(screen.getByLabelText("Return to unplanned")).toBeInTheDocument();
  });
});
