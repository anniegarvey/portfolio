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
