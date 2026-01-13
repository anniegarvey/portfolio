import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../lib/energy-planner/context";
import { DayPlanner } from "./DayPlanner";

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple test cases
describe("DayPlanner", () => {
  it("renders the day planner with empty state", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByText("Your Day Plan")).toBeInTheDocument();
    expect(screen.getByText(/Available Tasks/)).toBeInTheDocument();
    expect(screen.getByText(/Selected Tasks/)).toBeInTheDocument();
  });

  it("displays available tasks count with zero", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByText(/Available Tasks \(0\)/)).toBeInTheDocument();
  });

  it("displays selected tasks count with zero", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByText(/Selected Tasks \(0\)/)).toBeInTheDocument();
  });

  it("displays energy usage summary with zeros", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    const summary = screen.getByText(/Usage:/);
    expect(summary.textContent).toMatch(/P:0\s*S:0\s*E:0/);
  });

  it("shows empty state message when no tasks available", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    expect(
      screen.getByText("No tasks available. Create some above!"),
    ).toBeInTheDocument();
  });

  it("shows empty state message when no tasks selected", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    expect(
      screen.getByText("No tasks selected for today."),
    ).toBeInTheDocument();
  });

  it("displays header text correctly", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    const header = screen.getByText("Your Day Plan");
    expect(header.tagName).toBe("H3");
  });

  it("renders both column headers", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByText(/Available Tasks/)).toBeInTheDocument();
    expect(screen.getByText(/Selected Tasks/)).toBeInTheDocument();
  });

  it("displays usage summary in selected tasks column", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    const usageSummary = screen.getByText(/Usage:/);
    expect(usageSummary).toBeInTheDocument();
    expect(usageSummary.textContent).toContain("P:");
    expect(usageSummary.textContent).toContain("S:");
    expect(usageSummary.textContent).toContain("E:");
  });

  it("does not show warning when capacity is not exceeded", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    expect(screen.queryByText(/Warning:/)).not.toBeInTheDocument();
  });

  it("verifies available tasks count displays correctly", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    const availableHeader = screen.getByText(/Available Tasks/);
    expect(availableHeader.textContent).toMatch(/\(0\)/);
  });

  it("verifies selected tasks count displays correctly", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    const selectedHeader = screen.getByText(/Selected Tasks/);
    expect(selectedHeader.textContent).toMatch(/\(0\)/);
  });

  it("verifies usage values are displayed with correct format", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    const usageText = screen.getByText(/Usage:/);
    expect(usageText.textContent).toContain("P:0");
    expect(usageText.textContent).toContain("S:0");
    expect(usageText.textContent).toContain("E:0");
  });

  it("renders empty task lists correctly", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    // Both empty state messages should be present
    expect(
      screen.getByText("No tasks available. Create some above!"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No tasks selected for today."),
    ).toBeInTheDocument();
  });

  it("verifies header structure is correct", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    const header = screen.getByText("Your Day Plan");
    expect(header).toBeInTheDocument();
    // Warning should not be present when no tasks
    const headerParent = header.parentElement;
    expect(headerParent?.querySelector('[class*="Warning"]')).toBeNull();
  });
});

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite
describe("DayPlanner with populated data", () => {
  // biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test case
  it("renders tasks and warning when capacity exceeded", () => {
    const mockOnEditTask = vi.fn();

    const task1 = {
      id: "t1",
      title: "Available Task",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {},
      createdAt: new Date().toISOString(),
    };
    const task2 = {
      id: "t2",
      title: "Selected Task",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {},
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "energy_planner_tasks",
      JSON.stringify([task1, task2]),
    );

    // Seed DayPlan to have t2 selected
    const dayPlan = {
      date: new Date().toISOString().split("T")[0],
      selectedTaskIds: ["t2"],
      completedTaskIds: ["t2"],
      dailyCapacity: { physical: 5, social: 5, executive: 5 }, // Low capacity to trigger warning
    };
    localStorage.setItem("energy_planner_day_plan", JSON.stringify(dayPlan));

    // Capacity for warning
    localStorage.setItem(
      "energy_planner_capacity",
      JSON.stringify({ physical: 5, social: 5, executive: 5 }),
    );

    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    // Verify Warning
    // The warning logic depends on `checkExceedsCapacity` which relies on `calculateEnergyUsage`.
    // Task 2 is selected. Cost: 10, 10, 10. Capacity: 5, 5, 5. Should exceed.
    expect(screen.getByText(/Warning:/)).toBeInTheDocument();

    // Verify Tasks Lists
    expect(screen.getByText("Available Task")).toBeInTheDocument();
    expect(screen.getByText("Selected Task")).toBeInTheDocument();
  });
});
