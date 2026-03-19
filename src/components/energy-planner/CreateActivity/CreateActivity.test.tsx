import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../../lib/energy-planner/context";
import type { Activity } from "../../../lib/energy-planner/schema";
import { PointsProvider } from "../../../lib/points/context";
import { CreateActivity } from "./CreateActivity";

// Helper wrapper
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PointsProvider>
    <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
  </PointsProvider>
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
  fetchActivities: vi.fn().mockResolvedValue([]),
  storeActivities: vi.fn().mockResolvedValue(undefined),
  migrateStorageIfNeeded: vi.fn().mockResolvedValue(undefined),
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

  it("tracks suggestions visibility and intercepts Escape when suggestions are open", async () => {
    const { fetchActivities } = await import(
      "../../../lib/energy-planner/storage"
    );
    (fetchActivities as unknown as Mock).mockResolvedValue([
      {
        id: "seed-1",
        createdAt: new Date("2024-01-01"),
        title: "Do Laundry",
        energyCost: { physical: 10, social: 0, executive: 0 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      },
    ]);

    const onClose = vi.fn();
    render(<CreateActivity isOpen={true} onClose={onClose} />, { wrapper });

    const input = await screen.findByPlaceholderText("e.g., Do Laundry");

    // Type to trigger suggestions
    fireEvent.change(input, { target: { value: "laundry" } });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeDefined();
    });

    // Pressing Escape should close the suggestions (Radix fires onEscapeKeyDown,
    // which calls e.preventDefault(), keeping the dialog open).
    // Verify onClose was not called — dialog remains open.
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });
    expect(onClose).not.toHaveBeenCalled();
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
