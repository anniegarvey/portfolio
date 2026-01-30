import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../../lib/energy-planner/context";
import type { Task } from "../../../lib/energy-planner/schema";
import { CreateTask } from "./CreateTask";

// Helper wrapper
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
);

// Mock storage
vi.mock("../../../lib/energy-planner/storage", () => ({
  fetchEnergyTypes: vi
    .fn()
    .mockResolvedValue([{ id: "physical", label: "Physical", color: "red" }]),
  storeEnergyTypes: vi.fn().mockResolvedValue(undefined),
  fetchZones: vi.fn().mockResolvedValue([]),
  storeZones: vi.fn().mockResolvedValue(undefined),
  fetchDayPlan: vi.fn().mockResolvedValue(null),
  storeDayPlan: vi.fn().mockResolvedValue(undefined),
  deleteDayPlan: vi.fn().mockResolvedValue(undefined),
  fetchAllDayPlanDates: vi.fn().mockResolvedValue([]),
  fetchOneOffTasks: vi.fn().mockResolvedValue([]),
  storeOneOffTasks: vi.fn().mockResolvedValue(undefined),
  fetchRepeatingTasks: vi.fn().mockResolvedValue([]),
  storeRepeatingTasks: vi.fn().mockResolvedValue(undefined),
  clearAll: vi.fn(),
}));

describe("CreateTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly when open", async () => {
    const onClose = vi.fn();
    render(<CreateTask isOpen={true} onClose={onClose} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Create New Task")).toBeDefined();
    });
  });

  it("focuses the task name input when opened", async () => {
    const onClose = vi.fn();
    render(<CreateTask isOpen={true} onClose={onClose} />, { wrapper });

    const input = await screen.findByPlaceholderText("e.g., Do Laundry");

    // In JSDOM, we might need to wait for the focus to happen.
    // Radix generally uses requestAnimationFrame or setTimeout.
    await waitFor(
      () => {
        expect(input).toHaveFocus();
      },
      { timeout: 1000 },
    );
  });

  it("renders correctly when editing a task", async () => {
    const onClose = vi.fn();
    const editingTask: Task = {
      id: "1",
      title: "Existing Task",
      energyCost: { physical: 10, social: 0, executive: 0 },
      factors: {
        initiationDifficulty: 1,
        terminationDifficulty: 1,
        isRestorative: false,
      },
      createdAt: new Date(),
      completed: false,
    };

    render(
      <CreateTask editingTask={editingTask} isOpen={true} onClose={onClose} />,
      { wrapper },
    );

    await waitFor(() => {
      expect(screen.getByText("Edit Task")).toBeDefined();
      expect(screen.getByDisplayValue("Existing Task")).toBeDefined();
    });
  });
});
