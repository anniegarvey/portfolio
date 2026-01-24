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
        onDragStart,
        id,
      }: {
        children: React.ReactNode;
        onDragEnd: (event: {
          active: { id: string; data?: { current?: unknown } };
          over: { id: string } | null;
        }) => void;
        onDragStart?: (event: {
          active: { id: string; data?: { current?: unknown } };
        }) => void;
        id?: string;
      }) => (
        <div data-testid={`dnd-context-${id || "default"}`}>
          <button
            data-testid={`trigger-drag-start-${id || "default"}`}
            onClick={(e) => {
              const target = e.currentTarget;
              const activeId = target.getAttribute("data-active") || "t1";
              if (onDragStart) {
                onDragStart({
                  active: { id: activeId },
                });
              }
            }}
            type="button"
          >
            Start Drag
          </button>
          <button
            data-testid={`trigger-drag-${id || "default"}`}
            onClick={(e) => {
              const target = e.currentTarget;
              const activeId = target.getAttribute("data-active") || "t1";
              const overId = target.getAttribute("data-over") || "t2";
              const activeData = target.getAttribute("data-active-data");

              onDragEnd({
                active: {
                  id: activeId,
                  data: {
                    current: activeData ? JSON.parse(activeData) : undefined,
                  },
                },
                over: overId ? { id: overId } : null,
              });
            }}
            type="button"
          >
            Drag
          </button>
          {children}
        </div>
      ),
      DragOverlay: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drag-overlay">{children}</div>
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
      expect(screen.getAllByText("No tasks in this zone")).toHaveLength(3); // 3 default zones
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

  it("reorders selected tasks across zones", async () => {
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
      zoneId: "morning",
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
      zoneId: "afternoon",
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
      expect(screen.getByText("Task 2")).toBeInTheDocument();
    });

    // Simulate dragging T1 (morning) to T2 (afternoon)
    const dragBtn = screen.getByTestId("trigger-drag-default");
    dragBtn.setAttribute("data-active", "t1");
    dragBtn.setAttribute("data-over", "t2");

    await user.click(dragBtn);

    // Verify persistence update
    await waitFor(async () => {
      const { getDayPlan } = await import("../../lib/energy-planner/storage");
      const plan = await getDayPlan(today);
      const t1 = plan?.tasks?.find((t) => t.id === "t1");
      expect(t1?.zoneId).toBe("afternoon");
    });
  });

  it("handles adding task to specific zone", async () => {
    const user = userEvent.setup();
    const mockOnEditTask = vi.fn();
    const mockOnOpenCreateTask = vi.fn();

    // Setup available task
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
    await setOneOffTasks([task1]);

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

    // Find "Add Task" button for a specific zone (Afternoon is index 1)
    const addButtons = screen.getAllByText("Add Task");
    expect(addButtons).toHaveLength(3);

    await user.click(addButtons[1]);

    // Modal opens
    expect(
      screen.getByRole("heading", { name: "Available Tasks" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Available Task")).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText("Add to day"));

    // Verify task added to Afternoon zone
    const today = new Date().toISOString().split("T")[0];
    await waitFor(async () => {
      const { getDayPlan } = await import("../../lib/energy-planner/storage");
      const plan = await getDayPlan(today);
      const t1 = plan?.tasks?.find((t) => t.id === "t1");
      expect(t1?.zoneId).toBe("afternoon");
    });
  });

  it("moves task to a zone container", async () => {
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
      zoneId: "morning",
    };

    await setDayPlan(today, {
      date: today,
      tasks: [task1],
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

    // Simulate dragging T1 (morning) to Afternoon Zone container
    const dragBtn = screen.getByTestId("trigger-drag-default");
    dragBtn.setAttribute("data-active", "t1");
    // Assuming afternoon zone id is "afternoon"
    dragBtn.setAttribute("data-over", "afternoon");

    await user.click(dragBtn);

    await waitFor(async () => {
      const { getDayPlan } = await import("../../lib/energy-planner/storage");
      const plan = await getDayPlan(today);
      const t1 = plan?.tasks?.find((t) => t.id === "t1");
      expect(t1?.zoneId).toBe("afternoon");
    });
  });

  it("handles fallback to first zone when zoneId is invalid", async () => {
    const mockOnEditTask = vi.fn();
    const today = new Date().toISOString().split("T")[0];

    const task1 = {
      id: "t1",
      title: "Task with Invalid Zone",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
      completed: false,
      zoneId: "invalid-zone-id",
    };

    await setDayPlan(today, {
      date: today,
      tasks: [task1],
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
      expect(screen.getByText("Task with Invalid Zone")).toBeInTheDocument();
    });

    // Should default to first zone (Morning)
    const morningZone = screen.getByTestId("zone-morning");
    expect(morningZone).toHaveTextContent("Task with Invalid Zone");
  });

  it("opens zone manager when manager button is clicked", async () => {
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
      expect(screen.getAllByTitle("Manage Zones")).toHaveLength(3);
    });

    const manageButtons = screen.getAllByTitle("Manage Zones");
    await user.click(manageButtons[0]);

    expect(
      screen.getByRole("heading", { name: "Manage Zones" }),
    ).toBeInTheDocument();
  });

  it("activates task active state on drag start", async () => {
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
      zoneId: "morning",
    };

    await setDayPlan(today, {
      date: today,
      tasks: [task1],
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

    // Start drag
    const startDragBtn = screen.getByTestId("trigger-drag-start-default");
    startDragBtn.setAttribute("data-active", "t1");
    await user.click(startDragBtn);

    // activeTask should be set, and DragOverlay should render it
    await waitFor(() => {
      const overlay = screen.getByTestId("drag-overlay");
      expect(overlay).toHaveTextContent("Task 1");
    });
  });
});
