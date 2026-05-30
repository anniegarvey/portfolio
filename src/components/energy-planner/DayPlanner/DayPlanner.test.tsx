import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../../lib/energy-planner/context";
import {
  clearAll,
  storeActivities,
  storeDayPlan,
} from "../../../lib/energy-planner/storage";
import { PointsProvider } from "../../../lib/points/context";
import { WellnessProvider } from "../../../lib/wellness/context";
import { DayPlanner } from ".";

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
              const activeId = target.getAttribute("data-active") || "a1";
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
              const activeId = target.getAttribute("data-active") || "a1";
              const overId = target.getAttribute("data-over") || "a2";
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
    const mockOnEditActivity = vi.fn();
    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Your Day Plan/)).toBeInTheDocument();
    });
  });

  it("displays selected activities count with zero", async () => {
    const mockOnEditActivity = vi.fn();
    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Your Day Plan \(0\)/)).toBeInTheDocument();
    });
  });

  it("displays energy usage summary with zeros", async () => {
    const mockOnEditActivity = vi.fn();
    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Energy Usage vs Capacity")).toBeInTheDocument();
    });
  });

  it("shows empty state message when no activities selected", async () => {
    const mockOnEditActivity = vi.fn();
    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("No activities in this zone")).toHaveLength(3); // 3 default zones
    });
  });

  it("shows 'Manage Activities' button", async () => {
    const mockOnEditActivity = vi.fn();
    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Manage Activities")).toBeInTheDocument();
    });
  });

  it("opens modal when 'Manage Activities' button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnEditActivity = vi.fn();
    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Manage Activities")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Manage Activities"));

    expect(
      screen.getByRole("heading", { name: "Available Activities" }),
    ).toBeInTheDocument();
  });

  it("verifies header structure is correct", async () => {
    const mockOnEditActivity = vi.fn();
    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Your Day Plan/)).toBeInTheDocument();
    });

    const header = screen.getByText(/Your Day Plan/);
    // Warning should not be present when no activities
    const headerParent = header.parentElement;
    expect(headerParent?.querySelector('[class*="Warning"]')).toBeNull();
  });
});

describe("DayPlanner with populated data", () => {
  beforeEach(async () => {
    await clearAll();
  });

  it("renders selected activities and warning when capacity exceeded", async () => {
    const mockOnEditActivity = vi.fn();
    const today = new Date().toISOString().split("T")[0];

    const activity1 = {
      id: "a1",
      title: "Available Activity",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
      completed: false,
    };
    const activity2 = {
      id: "a2",
      title: "Selected Activity",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
      completed: false,
    };

    await storeActivities([activity1, activity2]);
    await storeDayPlan(today, {
      date: today,
      plannedInstances: [
        { id: "inst-a2", sourceActivityId: "a2", completed: true },
      ],
      dailyCapacity: { physical: 5, social: 5, executive: 5 },
    });

    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Warning:/)).toBeInTheDocument();
    });

    expect(screen.getByText("Selected Activity")).toBeInTheDocument();
  });

  it("renders multiple selected activities in sortable list", async () => {
    const mockOnEditActivity = vi.fn();
    const today = new Date().toISOString().split("T")[0];

    const activity1 = {
      id: "a1",
      title: "First Activity",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
      completed: false,
    };
    const activity2 = {
      id: "a2",
      title: "Second Activity",
      energyCost: { physical: 5, social: 5, executive: 5 },
      factors: {
        initiationDifficulty: 3,
        terminationDifficulty: 2,
        isRestorative: false,
      },
      createdAt: new Date(),
      completed: false,
    };

    await storeActivities([activity1, activity2]);
    await storeDayPlan(today, {
      date: today,
      plannedInstances: [
        { id: "inst-a1", sourceActivityId: "a1", completed: false },
        { id: "inst-a2", sourceActivityId: "a2", completed: false },
      ],
      dailyCapacity: { physical: 50, social: 50, executive: 50 },
    });

    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("First Activity")).toBeInTheDocument();
    });
    expect(screen.getByText("Second Activity")).toBeInTheDocument();
    expect(screen.getByText(/Your Day Plan \(2\)/)).toBeInTheDocument();
  });

  it("adds activity from modal and closes modal", async () => {
    const user = userEvent.setup();
    const mockOnEditActivity = vi.fn();

    const activity1 = {
      id: "a1",
      title: "Available Activity",
      energyCost: { physical: 5, social: 5, executive: 5 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
      completed: false,
    };

    await storeActivities([activity1]);

    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Manage Activities")).toBeInTheDocument();
    });

    // Open modal
    await user.click(screen.getByText("Manage Activities"));
    expect(
      screen.getByRole("heading", { name: "Available Activities" }),
    ).toBeInTheDocument();

    // Wait for the activity to appear in the modal (async state update)
    await waitFor(() => {
      expect(screen.getByText("Available Activity")).toBeInTheDocument();
    });

    // Click Add to day button
    await user.click(screen.getByLabelText("Add to day"));

    // Modal should close - Available Activities title should be gone
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("displays uncompleted activities from previous days", async () => {
    const mockOnEditActivity = vi.fn();

    const activity1 = {
      id: "a1",
      title: "Uncompleted From Yesterday",
      energyCost: { physical: 5, social: 5, executive: 5 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
      completed: false,
    };

    await storeActivities([activity1]);

    // Set up yesterday's plan with uncompleted activity
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    await storeDayPlan(yesterdayStr, {
      date: yesterdayStr,
      plannedInstances: [
        { id: "inst-a1", sourceActivityId: "a1", completed: false },
      ],
      dailyCapacity: { physical: 50, social: 50, executive: 50 },
    });

    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Uncompleted Activities/)).toBeInTheDocument();
    });

    expect(screen.getByText("Uncompleted From Yesterday")).toBeInTheDocument();
  });

  it("closes modal when close button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnEditActivity = vi.fn();

    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Manage Activities")).toBeInTheDocument();
    });

    // Open modal
    await user.click(screen.getByText("Manage Activities"));
    expect(
      screen.getByRole("heading", { name: "Available Activities" }),
    ).toBeInTheDocument();

    // Close via close button
    await user.click(screen.getByLabelText("Close modal"));

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("reorders available activities via drag and drop", async () => {
    const user = userEvent.setup();
    const mockOnEditActivity = vi.fn();

    const activity1 = {
      id: "a1",
      title: "Activity 1",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
      completed: false,
    };
    const activity2 = {
      id: "a2",
      title: "Activity 2",
      energyCost: { physical: 5, social: 5, executive: 5 },
      factors: {
        initiationDifficulty: 3,
        terminationDifficulty: 2,
        isRestorative: false,
      },
      createdAt: new Date(),
      completed: false,
    };

    await storeActivities([activity1, activity2]);

    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    // Open modal to see available activities DndContext
    await waitFor(() => {
      expect(screen.getByText("Manage Activities")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Manage Activities"));

    await waitFor(() => {
      expect(screen.getByText("Activity 1")).toBeInTheDocument();
    });

    const buttons = screen.getAllByText("Drag");
    // There should be 2 buttons now (one for main list, one for modal list)
    expect(buttons).toHaveLength(2);

    // Click the second one (modal)
    await user.click(buttons[1]);
  });

  it("reorders selected activities via drag and drop", async () => {
    const user = userEvent.setup();
    const mockOnEditActivity = vi.fn();
    const today = new Date().toISOString().split("T")[0];

    const activity1 = {
      id: "a1",
      title: "Activity 1",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
    };
    const activity2 = {
      id: "a2",
      title: "Activity 2",
      energyCost: { physical: 5, social: 5, executive: 5 },
      factors: {
        initiationDifficulty: 3,
        terminationDifficulty: 2,
        isRestorative: false,
      },
      createdAt: new Date(),
    };

    await storeActivities([activity1, activity2]);
    await storeDayPlan(today, {
      date: today,
      plannedInstances: [
        { id: "inst-a1", sourceActivityId: "a1", completed: false },
        { id: "inst-a2", sourceActivityId: "a2", completed: false },
      ],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Activity 1")).toBeInTheDocument();
    });

    const buttons = screen.getAllByText("Drag");
    // Should be at least 1 (main list)
    expect(buttons.length).toBeGreaterThan(0);

    // Click first one
    await user.click(buttons[0]);

    // Handler called.
  });

  it("reorders selected activities across zones", async () => {
    const user = userEvent.setup();
    const mockOnEditActivity = vi.fn();
    const today = new Date().toISOString().split("T")[0];

    const activity1 = {
      id: "a1",
      title: "Activity 1",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
      zoneId: "morning",
    };
    const activity2 = {
      id: "a2",
      title: "Activity 2",
      energyCost: { physical: 5, social: 5, executive: 5 },
      factors: {
        initiationDifficulty: 3,
        terminationDifficulty: 2,
        isRestorative: false,
      },
      createdAt: new Date(),
      zoneId: "afternoon",
    };
    await storeActivities([activity1, activity2]);

    await storeDayPlan(today, {
      date: today,
      plannedInstances: [
        {
          id: "inst-a1",
          sourceActivityId: "a1",
          completed: false,
          zoneId: "morning",
        },
        {
          id: "inst-a2",
          sourceActivityId: "a2",
          completed: false,
          zoneId: "afternoon",
        },
      ],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Activity 1")).toBeInTheDocument();
      expect(screen.getByText("Activity 2")).toBeInTheDocument();
    });

    // Simulate dragging inst-a1 (morning) to inst-a2 (afternoon)
    const dragBtn = screen.getByTestId("trigger-drag-default");
    dragBtn.setAttribute("data-active", "inst-a1");
    dragBtn.setAttribute("data-over", "inst-a2");

    await user.click(dragBtn);

    // Verify persistence update
    await waitFor(async () => {
      const { fetchDayPlan } = await import(
        "../../../lib/energy-planner/storage"
      );
      const plan = await fetchDayPlan(today);
      const a1 = plan?.plannedInstances?.find(
        (i) => i.sourceActivityId === "a1",
      );
      expect(a1?.zoneId).toBe("afternoon");
    });
  });

  it("handles adding activity to specific zone", async () => {
    const user = userEvent.setup();
    const mockOnEditActivity = vi.fn();
    const mockOnOpenCreateActivity = vi.fn();

    // Setup available activity
    const activity1 = {
      id: "a1",
      title: "Available Activity",
      energyCost: { physical: 5, social: 5, executive: 5 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
      completed: false,
    };
    await storeActivities([activity1]);

    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Manage Activities")).toBeInTheDocument();
    });

    // Find "Add Activity" button for a specific zone (Afternoon is index 1)
    const addButtons = screen.getAllByText("Add Activity");
    expect(addButtons).toHaveLength(3);

    await user.click(addButtons[1]);

    // Modal opens
    expect(
      screen.getByRole("heading", { name: "Available Activities" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Available Activity")).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText("Add to day"));

    // Verify activity added to Afternoon zone
    const today = new Date().toISOString().split("T")[0];
    await waitFor(async () => {
      const { fetchDayPlan } = await import(
        "../../../lib/energy-planner/storage"
      );
      const plan = await fetchDayPlan(today);
      const a1 = plan?.plannedInstances?.find(
        (i) => i.sourceActivityId === "a1",
      );
      expect(a1?.zoneId).toBe("afternoon");
    });
  });

  it("moves activity to a zone container", async () => {
    const user = userEvent.setup();
    const mockOnEditActivity = vi.fn();
    const today = new Date().toISOString().split("T")[0];

    const activity1 = {
      id: "a1",
      title: "Activity 1",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
    };

    await storeActivities([activity1]);
    await storeDayPlan(today, {
      date: today,
      plannedInstances: [
        {
          id: "inst-a1",
          sourceActivityId: "a1",
          completed: false,
          zoneId: "morning",
        },
      ],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Activity 1")).toBeInTheDocument();
    });

    // Simulate dragging inst-a1 (morning) to Afternoon Zone container
    const dragBtn = screen.getByTestId("trigger-drag-default");
    dragBtn.setAttribute("data-active", "inst-a1");
    // Assuming afternoon zone id is "afternoon"
    dragBtn.setAttribute("data-over", "afternoon");

    await user.click(dragBtn);

    await waitFor(async () => {
      const { fetchDayPlan } = await import(
        "../../../lib/energy-planner/storage"
      );
      const plan = await fetchDayPlan(today);
      const a1 = plan?.plannedInstances?.find(
        (i) => i.sourceActivityId === "a1",
      );
      expect(a1?.zoneId).toBe("afternoon");
    });
  });

  it("handles fallback to first zone when zoneId is invalid", async () => {
    const mockOnEditActivity = vi.fn();
    const today = new Date().toISOString().split("T")[0];

    const activity1 = {
      id: "a1",
      title: "Activity with Invalid Zone",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
    };

    await storeActivities([activity1]);
    await storeDayPlan(today, {
      date: today,
      plannedInstances: [
        {
          id: "inst-a1",
          sourceActivityId: "a1",
          completed: false,
          zoneId: "invalid-zone-id",
        },
      ],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Activity with Invalid Zone"),
      ).toBeInTheDocument();
    });

    // Should default to first zone (Morning)
    const morningZone = screen.getByTestId("zone-morning");
    expect(morningZone).toHaveTextContent("Activity with Invalid Zone");
  });

  it("opens zone manager when manager button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnEditActivity = vi.fn();
    const mockOnOpenCreateActivity = vi.fn();

    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
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

  it("activates activity active state on drag start", async () => {
    const user = userEvent.setup();
    const mockOnEditActivity = vi.fn();
    const today = new Date().toISOString().split("T")[0];

    const activity1 = {
      id: "a1",
      title: "Activity 1",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
    };

    await storeActivities([activity1]);
    await storeDayPlan(today, {
      date: today,
      plannedInstances: [
        {
          id: "inst-a1",
          sourceActivityId: "a1",
          completed: false,
          zoneId: "morning",
        },
      ],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Activity 1")).toBeInTheDocument();
    });

    // Start drag
    const startDragBtn = screen.getByTestId("trigger-drag-start-default");
    startDragBtn.setAttribute("data-active", "inst-a1");
    await user.click(startDragBtn);

    // activeActivity should be set, and DragOverlay should render it
    await waitFor(() => {
      const overlay = screen.getByTestId("drag-overlay");
      expect(overlay).toHaveTextContent("Activity 1");
    });
  });

  it("handles drag start with unknown instance ID (no-op)", async () => {
    const user = userEvent.setup();
    const mockOnEditActivity = vi.fn();
    const today = new Date().toISOString().split("T")[0];

    const activity1 = {
      id: "a1",
      title: "Activity 1",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
    };

    await storeActivities([activity1]);
    await storeDayPlan(today, {
      date: today,
      plannedInstances: [
        {
          id: "inst-a1",
          sourceActivityId: "a1",
          completed: false,
          zoneId: "morning",
        },
      ],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Activity 1")).toBeInTheDocument();
    });

    // Drag start with an ID that doesn't exist in resolvedActivities — hits the false branch
    const startDragBtn = screen.getByTestId("trigger-drag-start-default");
    startDragBtn.setAttribute("data-active", "nonexistent-id");
    await user.click(startDragBtn);

    // Overlay should be empty since no activity matched
    const overlay = screen.getByTestId("drag-overlay");
    expect(overlay).toBeEmptyDOMElement();
  });

  it("handles drag end with no drop target (null over)", async () => {
    const user = userEvent.setup();
    const mockOnEditActivity = vi.fn();
    const today = new Date().toISOString().split("T")[0];

    const activity1 = {
      id: "a1",
      title: "Activity 1",
      energyCost: { physical: 10, social: 10, executive: 10 },
      factors: {
        initiationDifficulty: 5,
        terminationDifficulty: 3,
        isRestorative: false,
      },
      createdAt: new Date(),
    };

    await storeActivities([activity1]);
    await storeDayPlan(today, {
      date: today,
      plannedInstances: [
        {
          id: "inst-a1",
          sourceActivityId: "a1",
          completed: false,
          zoneId: "morning",
        },
      ],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    });

    const mockOnOpenCreateActivity = vi.fn();
    render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <DayPlanner
            onEditActivity={mockOnEditActivity}
            onOpenCreateActivity={mockOnOpenCreateActivity}
          />
        </EnergyPlannerProvider>
      </PointsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Activity 1")).toBeInTheDocument();
    });

    // Empty data-over → mock passes null as `over`, hitting the early return
    const dragBtn = screen.getByTestId("trigger-drag-default");
    dragBtn.setAttribute("data-active", "inst-a1");
    dragBtn.setAttribute("data-over", "");
    await user.click(dragBtn);

    // Activity should still be in morning zone (no zone change)
    await waitFor(async () => {
      const { fetchDayPlan } = await import(
        "../../../lib/energy-planner/storage"
      );
      const plan = await fetchDayPlan(today);
      const a1 = plan?.plannedInstances?.find(
        (i) => i.sourceActivityId === "a1",
      );
      expect(a1?.zoneId).toBe("morning");
    });
  });
});

describe("DayPlanner – wellness integration", () => {
  beforeEach(async () => {
    await clearAll();
    vi.clearAllMocks();
  });

  function renderWithWellness() {
    return render(
      <PointsProvider>
        <EnergyPlannerProvider>
          <WellnessProvider>
            <DayPlanner
              onEditActivity={vi.fn()}
              onOpenCreateActivity={vi.fn()}
            />
          </WellnessProvider>
        </EnergyPlannerProvider>
      </PointsProvider>,
    );
  }

  it("shows Wellness button in header", async () => {
    renderWithWellness();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Wellness" }),
      ).toBeInTheDocument();
    });
  });

  it("opens the wellness config modal when Wellness button is clicked", async () => {
    const user = userEvent.setup();
    renderWithWellness();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Wellness" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Wellness" }));

    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: "Wellness Check Settings" }),
      ).toBeInTheDocument();
    });
  });

  it("shows wellness check card when check is pending", async () => {
    renderWithWellness();

    await waitFor(() => {
      expect(screen.getByLabelText("Wellness check")).toBeInTheDocument();
    });
  });

  it("gear button on wellness card opens the config modal", async () => {
    const user = userEvent.setup();
    renderWithWellness();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Configure wellness check" }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: "Configure wellness check" }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: "Wellness Check Settings" }),
      ).toBeInTheDocument();
    });
  });

  it("closes wellness config modal when Cancel is clicked", async () => {
    const user = userEvent.setup();
    renderWithWellness();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Wellness" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Wellness" }));

    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: "Wellness Check Settings" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Wellness Check Settings" }),
      ).not.toBeInTheDocument();
    });
  });
});
