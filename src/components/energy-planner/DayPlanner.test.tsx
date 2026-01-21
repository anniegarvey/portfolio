import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../lib/energy-planner/context";
import {
  clearAll,
  setDailyCapacity,
  setDayPlan,
  setTasks,
} from "../../lib/energy-planner/storage";
import { DayPlanner } from "./DayPlanner";

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple test cases
describe("DayPlanner", () => {
  beforeEach(async () => {
    await clearAll();
  });

  it("renders the day planner with header", async () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Your Day Plan")).toBeInTheDocument();
    });
    expect(screen.getByText(/Selected Tasks/)).toBeInTheDocument();
  });

  it("displays selected tasks count with zero", async () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Selected Tasks \(0\)/)).toBeInTheDocument();
    });
  });

  it("displays energy usage summary with zeros", async () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      const summary = screen.getByText(/Usage:/);
      expect(summary.textContent).toMatch(/P:0\s*S:0\s*E:0/);
    });
  });

  it("shows empty state message when no tasks selected", async () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("No tasks selected for this day."),
      ).toBeInTheDocument();
    });
  });

  it("shows 'Plan an available task' button", async () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Plan an available task")).toBeInTheDocument();
    });
  });

  it("opens modal when 'Plan an available task' button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Plan an available task")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Plan an available task"));

    expect(
      screen.getByRole("heading", { name: "Available Tasks" }),
    ).toBeInTheDocument();
  });

  it("shows date navigation buttons", async () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Previous day")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Next day")).toBeInTheDocument();
  });

  it("shows 'Today' indicator when viewing today", async () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Today")).toBeInTheDocument();
    });
  });

  it("verifies header structure is correct", async () => {
    const mockOnEditTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Your Day Plan")).toBeInTheDocument();
    });

    const header = screen.getByText("Your Day Plan");
    // Warning should not be present when no tasks
    const headerParent = header.parentElement;
    expect(headerParent?.querySelector('[class*="Warning"]')).toBeNull();
  });
});

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test with extensive storage seeding
describe("DayPlanner with populated data", () => {
  beforeEach(async () => {
    await clearAll();
  });

  it("renders selected tasks and warning when capacity exceeded", async () => {
    const mockOnEditTask = vi.fn();
    const today = new Date().toISOString().split("T")[0];

    const task1 = {
      id: "t1",
      title: "Available Task",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
    };
    const task2 = {
      id: "t2",
      title: "Selected Task",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
    };

    await setTasks([task1, task2]);
    await setDayPlan(today, {
      date: today,
      selectedTaskIds: ["t2"],
      completedTaskIds: ["t2"],
      dailyCapacity: { physical: 5, social: 5, executive: 5 },
    });
    await setDailyCapacity({ physical: 5, social: 5, executive: 5 });

    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Warning:/)).toBeInTheDocument();
    });

    expect(screen.getByText("Selected Task")).toBeInTheDocument();
  });

  it("renders multiple selected tasks in sortable list", async () => {
    const mockOnEditTask = vi.fn();
    const today = new Date().toISOString().split("T")[0];

    const task1 = {
      id: "t1",
      title: "First Task",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
    };
    const task2 = {
      id: "t2",
      title: "Second Task",
      energyCost: { physical: 5, social: 5, executive: 5 },
      factors: {
        initiationDifficulty: 3,
        terminationDifficulty: 2,
        isRestorative: false,
      },
      createdAt: new Date(),
    };

    await setTasks([task1, task2]);
    await setDayPlan(today, {
      date: today,
      selectedTaskIds: ["t1", "t2"],
      completedTaskIds: [],
      dailyCapacity: { physical: 50, social: 50, executive: 50 },
    });

    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("First Task")).toBeInTheDocument();
    });
    expect(screen.getByText("Second Task")).toBeInTheDocument();
    expect(screen.getByText(/Selected Tasks \(2\)/)).toBeInTheDocument();
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
      createdAt: new Date(),
    };

    await setTasks([task1]);

    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Plan an available task")).toBeInTheDocument();
    });

    // Open modal
    await user.click(screen.getByText("Plan an available task"));
    expect(
      screen.getByRole("heading", { name: "Available Tasks" }),
    ).toBeInTheDocument();

    // Wait for the task to appear in the modal (async state update)
    await waitFor(() => {
      expect(screen.getByText("Available Task")).toBeInTheDocument();
    });

    // Click Add to day button
    await user.click(screen.getByLabelText("Add to day"));

    // Modal should close - Available Tasks title should be gone
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("displays uncompleted tasks from previous days", async () => {
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
      createdAt: new Date(),
    };

    await setTasks([task1]);

    // Set up yesterday's plan with uncompleted task
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    await setDayPlan(yesterdayStr, {
      date: yesterdayStr,
      selectedTaskIds: ["t1"],
      completedTaskIds: [],
      dailyCapacity: { physical: 50, social: 50, executive: 50 },
    });

    render(
      <EnergyPlannerProvider>
        <DayPlanner onEditTask={mockOnEditTask} />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Uncompleted Tasks/)).toBeInTheDocument();
    });

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

    await waitFor(() => {
      expect(screen.getByText("Plan an available task")).toBeInTheDocument();
    });

    // Open modal
    await user.click(screen.getByText("Plan an available task"));
    expect(
      screen.getByRole("heading", { name: "Available Tasks" }),
    ).toBeInTheDocument();

    // Close via close button
    await user.click(screen.getByLabelText("Close modal"));

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
