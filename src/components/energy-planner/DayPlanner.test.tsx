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

  it("displays available tasks count", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByText(/Available Tasks \(0\)/)).toBeInTheDocument();
  });

  it("displays selected tasks count", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByText(/Selected Tasks \(0\)/)).toBeInTheDocument();
  });

  it("displays energy usage summary", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByText(/Usage: P:0 S:0 E:0/)).toBeInTheDocument();
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
});
