import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../../lib/energy-planner/context";
import type { Activity } from "../../../lib/energy-planner/schema";
import { CreateActivity } from "./CreateActivity";

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
  fetchOneOffActivities: vi.fn().mockResolvedValue([]),
  storeOneOffActivities: vi.fn().mockResolvedValue(undefined),
  fetchRepeatingActivities: vi.fn().mockResolvedValue([]),
  storeRepeatingActivities: vi.fn().mockResolvedValue(undefined),
  clearAll: vi.fn(),
}));

describe("CreateActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly when open", async () => {
    const onClose = vi.fn();
    render(<CreateActivity isOpen={true} onClose={onClose} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Create New Activity")).toBeDefined();
    });
  });

  it("focuses the activity name input when opened", async () => {
    const onClose = vi.fn();
    render(<CreateActivity isOpen={true} onClose={onClose} />, { wrapper });

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

  it("renders correctly when editing an activity", async () => {
    const onClose = vi.fn();
    const editingActivity: Activity = {
      id: "1",
      title: "Existing Activity",
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
      <CreateActivity
        editingActivity={editingActivity}
        isOpen={true}
        onClose={onClose}
      />,
      { wrapper },
    );

    await waitFor(() => {
      expect(screen.getByText("Edit Activity")).toBeDefined();
      expect(screen.getByDisplayValue("Existing Activity")).toBeDefined();
    });
  });
});
