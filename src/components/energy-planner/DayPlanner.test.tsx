import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../lib/energy-planner/context";
import { DayPlanner } from "./DayPlanner";

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple test cases
describe("DayPlanner", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the day planner with header", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByText("Your Day Plan")).toBeInTheDocument();
    expect(screen.getByText(/Selected Tasks/)).toBeInTheDocument();
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

  it("shows empty state message when no tasks selected", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    expect(
      screen.getByText("No tasks selected for this day."),
    ).toBeInTheDocument();
  });

  it("shows 'Plan an available task' button", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByText("Plan an available task")).toBeInTheDocument();
  });

  it("opens modal when 'Plan an available task' button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    await user.click(screen.getByText("Plan an available task"));

    expect(
      screen.getByRole("heading", { name: "Available Tasks" }),
    ).toBeInTheDocument();
  });

  it("shows date navigation buttons", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByLabelText("Previous day")).toBeInTheDocument();
    expect(screen.getByLabelText("Next day")).toBeInTheDocument();
  });

  it("shows 'Today' indicator when viewing today", () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    expect(screen.getByText("Today")).toBeInTheDocument();
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

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test with extensive localStorage seeding
describe("DayPlanner with populated data", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders selected tasks and warning when capacity exceeded", () => {
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
    const today = new Date().toISOString().split("T")[0];
    const dayPlan = {
      date: today,
      selectedTaskIds: ["t2"],
      completedTaskIds: ["t2"],
      dailyCapacity: { physical: 5, social: 5, executive: 5 }, // Low capacity to trigger warning
    };
    localStorage.setItem(
      `energy_planner_day_plan_${today}`,
      JSON.stringify(dayPlan),
    );

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

    // Verify Selected Task is visible (Available Task is now in modal, not visible by default)
    expect(screen.getByText("Selected Task")).toBeInTheDocument();
  });

  it("adds task from modal and closes modal", async () => {
    const user = userEvent.setup();
    const mockOnEditTask = vi.fn();

    const task1 = {
      id: "t1",
      title: "Available Task",
      energyCost: { physical: 5, social: 5, executive: 5 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("energy_planner_tasks", JSON.stringify([task1]));

    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    // Open modal
    await user.click(screen.getByText("Plan an available task"));
    expect(
      screen.getByRole("heading", { name: "Available Tasks" }),
    ).toBeInTheDocument();

    // Click Add to day button
    await user.click(screen.getByLabelText("Add to day"));

    // Modal should close - Available Tasks title should be gone
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("displays uncompleted tasks from previous days", () => {
    const mockOnEditTask = vi.fn();

    const task1 = {
      id: "t1",
      title: "Uncompleted From Yesterday",
      energyCost: { physical: 5, social: 5, executive: 5 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("energy_planner_tasks", JSON.stringify([task1]));

    // Set up yesterday's plan with uncompleted task
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    localStorage.setItem(
      `energy_planner_day_plan_${yesterdayStr}`,
      JSON.stringify({
        date: yesterdayStr,
        selectedTaskIds: ["t1"],
        completedTaskIds: [],
        dailyCapacity: { physical: 50, social: 50, executive: 50 },
      }),
    );

    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    // Should show uncompleted tasks section
    expect(screen.getByText(/Uncompleted Tasks/)).toBeInTheDocument();
    expect(screen.getByText("Uncompleted From Yesterday")).toBeInTheDocument();
  });

  it("closes modal when close button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnEditTask = vi.fn();

    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    // Open modal
    await user.click(screen.getByText("Plan an available task"));
    expect(
      screen.getByRole("heading", { name: "Available Tasks" }),
    ).toBeInTheDocument();

    // Close via close button
    await user.click(screen.getByLabelText("Close modal"));

    // Modal should be closed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
