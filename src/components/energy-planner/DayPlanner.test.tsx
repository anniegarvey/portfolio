import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../lib/energy-planner/context";
import {
  clearAll,
  setDayPlan,
  setOneOffTasks,
} from "../../lib/energy-planner/storage";
import { DayPlanner } from "./DayPlanner";

describe("DayPlanner", () => {
  beforeEach(async () => {
    await clearAll();

    // Reset mocks
    vi.clearAllMocks();
  });

  // Mock DndContext to expose handlers
  vi.mock("@dnd-kit/core", async () => {
    const actual = await vi.importActual("@dnd-kit/core");
    return {
      ...actual,
      DndContext: ({
        children,
        onDragEnd,
        id,
      }: {
        children: React.ReactNode;
        onDragEnd: (event: {
          active: { id: string };
          over: { id: string } | null;
        }) => void;
        id?: string;
      }) => (
        <div data-testid={`dnd-context-${id || "default"}`}>
          <button
            data-testid={`trigger-drag-${id || "default"}`}
            onClick={() =>
              onDragEnd({
                active: { id: "t1" },
                over: { id: "t2" },
              })
            }
            type="button"
          >
            Drag
          </button>
          {children}
        </div>
      ),
    };
  });

  it("renders the day planner with header", async () => {
    const mockOnEditTask = vi.fn();
    const mockOnOpenCreateTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner
          onEditTask={mockOnEditTask}
          onOpenCreateTask={mockOnOpenCreateTask}
        />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Your Day Plan")).toBeInTheDocument();
    });
    expect(screen.getByText(/Selected Tasks/)).toBeInTheDocument();
  });

  it("displays selected tasks count with zero", async () => {
    const mockOnEditTask = vi.fn();
    const mockOnOpenCreateTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner
          onEditTask={mockOnEditTask}
          onOpenCreateTask={mockOnOpenCreateTask}
        />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Selected Tasks \(0\)/)).toBeInTheDocument();
    });
  });

  it("displays energy usage summary with zeros", async () => {
    const mockOnEditTask = vi.fn();
    const mockOnOpenCreateTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner
          onEditTask={mockOnEditTask}
          onOpenCreateTask={mockOnOpenCreateTask}
        />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      const summary = screen.getByText(/Usage:/);
      expect(summary.textContent).toMatch(/P:0\s*S:0\s*E:0/);
    });
  });

  it("shows empty state message when no tasks selected", async () => {
    const mockOnEditTask = vi.fn();
    const mockOnOpenCreateTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner
          onEditTask={mockOnEditTask}
          onOpenCreateTask={mockOnOpenCreateTask}
        />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("No tasks selected for this day."),
      ).toBeInTheDocument();
    });
  });

  it("shows 'Manage Tasks' button", async () => {
    const mockOnEditTask = vi.fn();
    const mockOnOpenCreateTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner
          onEditTask={mockOnEditTask}
          onOpenCreateTask={mockOnOpenCreateTask}
        />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Manage Tasks")).toBeInTheDocument();
    });
  });

  it("opens modal when 'Manage Tasks' button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnEditTask = vi.fn();
    const mockOnOpenCreateTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner
          onEditTask={mockOnEditTask}
          onOpenCreateTask={mockOnOpenCreateTask}
        />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Manage Tasks")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Manage Tasks"));

    expect(
      screen.getByRole("heading", { name: "Available Tasks" }),
    ).toBeInTheDocument();
  });

  it("verifies header structure is correct", async () => {
    const mockOnEditTask = vi.fn();
    const mockOnOpenCreateTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner
          onEditTask={mockOnEditTask}
          onOpenCreateTask={mockOnOpenCreateTask}
        />
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

    await setOneOffTasks([task1, task2]);
    await setDayPlan(today, {
      date: today,
      tasks: [{ ...task2, completed: true }],
      dailyCapacity: { physical: 5, social: 5, executive: 5 },
    });

    const mockOnOpenCreateTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner
          onEditTask={mockOnEditTask}
          onOpenCreateTask={mockOnOpenCreateTask}
        />
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
      completed: false,
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
      completed: false,
    };

    await setOneOffTasks([task1, task2]); // Changed from setTasks
    await setDayPlan(today, {
      date: today,
      tasks: [task1, task2],
      dailyCapacity: { physical: 50, social: 50, executive: 50 },
    });

    const mockOnOpenCreateTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner
          onEditTask={mockOnEditTask}
          onOpenCreateTask={mockOnOpenCreateTask}
        />
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

    await setOneOffTasks([task1]); // Changed from setTasks

    const mockOnOpenCreateTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner
          onEditTask={mockOnEditTask}
          onOpenCreateTask={mockOnOpenCreateTask}
        />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Manage Tasks")).toBeInTheDocument();
    });

    // Open modal
    await user.click(screen.getByText("Manage Tasks"));
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
      completed: false, // Added missing property
    };

    await setOneOffTasks([task1]);

    // Set up yesterday's plan with uncompleted task
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    await setDayPlan(yesterdayStr, {
      date: yesterdayStr,
      tasks: [task1],
      dailyCapacity: { physical: 50, social: 50, executive: 50 },
    });

    const mockOnOpenCreateTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner
          onEditTask={mockOnEditTask}
          onOpenCreateTask={mockOnOpenCreateTask}
        />
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

    const mockOnOpenCreateTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner
          onEditTask={mockOnEditTask}
          onOpenCreateTask={mockOnOpenCreateTask}
        />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Manage Tasks")).toBeInTheDocument();
    });

    // Open modal
    await user.click(screen.getByText("Manage Tasks"));
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

  it("reorders available tasks via drag and drop", async () => {
    const user = userEvent.setup();
    const mockOnEditTask = vi.fn();

    const task1 = {
      id: "t1",
      title: "Task 1",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
      completed: false,
    };
    const task2 = {
      id: "t2",
      title: "Task 2",
      energyCost: { physical: 5, social: 5, executive: 5 },
      factors: {
        initiationDifficulty: 3,
        terminationDifficulty: 2,
        isRestorative: false,
      },
      createdAt: new Date(),
      completed: false,
    };

    await setOneOffTasks([task1, task2]);

    const mockOnOpenCreateTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner
          onEditTask={mockOnEditTask}
          onOpenCreateTask={mockOnOpenCreateTask}
        />
      </EnergyPlannerProvider>,
    );

    // Open modal to see available tasks DndContext
    await user.click(screen.getByText("Manage Tasks"));

    await waitFor(() => {
      expect(screen.getByText("Task 1")).toBeInTheDocument();
    });

    const buttons = screen.getAllByText("Drag");
    // There should be 2 buttons now (one for main list, one for modal list)
    expect(buttons).toHaveLength(2);

    // Click the second one (modal)
    await user.click(buttons[1]);
  });

  it("reorders selected tasks via drag and drop", async () => {
    const user = userEvent.setup();
    const mockOnEditTask = vi.fn();
    const today = new Date().toISOString().split("T")[0];

    const task1 = {
      id: "t1",
      title: "Task 1",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
      completed: false,
    };
    const task2 = {
      id: "t2",
      title: "Task 2",
      energyCost: { physical: 5, social: 5, executive: 5 },
      factors: {
        initiationDifficulty: 3,
        terminationDifficulty: 2,
        isRestorative: false,
      },
      createdAt: new Date(),
      completed: false,
    };

    await setDayPlan(today, {
      date: today,
      tasks: [task1, task2],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    const mockOnOpenCreateTask = vi.fn();
    render(
      <EnergyPlannerProvider>
        <DayPlanner
          onEditTask={mockOnEditTask}
          onOpenCreateTask={mockOnOpenCreateTask}
        />
      </EnergyPlannerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Task 1")).toBeInTheDocument();
    });

    const buttons = screen.getAllByText("Drag");
    // Should be at least 1 (main list)
    expect(buttons.length).toBeGreaterThan(0);

    // Click first one
    await user.click(buttons[0]);

    // Handler called.
  });
});
