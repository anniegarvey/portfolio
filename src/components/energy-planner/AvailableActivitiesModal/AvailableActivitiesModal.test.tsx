import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity, ZoneConfig } from "@/lib/energy-planner/schema";
import { AvailableActivitiesModal } from ".";

vi.mock("../PlannerActivityCard", () => ({
  AvailableActivityCard: ({
    activity,
    onDelete,
  }: {
    activity: Activity;
    onDelete: (id: string) => void;
  }) => (
    <div data-testid="activity-card">
      {activity.title}
      {onDelete && (
        <button onClick={() => onDelete(activity.id)} type="button">
          Delete Activity
        </button>
      )}
    </div>
  ),
}));

const DEFAULT_ZONES: ZoneConfig[] = [
  { id: "morning", name: "Morning", order: 0 },
  { id: "afternoon", name: "Afternoon", order: 1 },
  { id: "evening", name: "Evening", order: 2 },
];

describe("AvailableActivitiesModal", () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    availableActivities: [],
    repeatingActivities: [],
    zones: DEFAULT_ZONES,
    onOpenCreateActivity: vi.fn(),
    onEditActivity: vi.fn(),
    onAddActivity: vi.fn(),
    onReorderActivities: vi.fn(),
    onReorderRepeatingActivities: vi.fn(),
    onDeleteActivity: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when open", () => {
    // No context needed if mocked
    render(<AvailableActivitiesModal {...mockProps} />);
    expect(screen.getByText("Available Activities")).toBeDefined();
    expect(screen.getByText("One-Off Activities")).toBeDefined();
    expect(screen.getByText("Repeating Activities")).toBeDefined();
  });

  it("switches tabs", () => {
    render(
      <AvailableActivitiesModal
        {...mockProps}
        availableActivities={[{ id: "1", title: "One Off" } as Activity]}
        repeatingActivities={[{ id: "2", title: "Repeating" } as Activity]}
      />,
    );

    // Default is one-off
    expect(screen.getByText("One Off")).toBeDefined();
    expect(screen.queryByText("Repeating")).toBeNull();

    // Switch to repeating
    fireEvent.click(screen.getByText("Repeating Activities"));
    expect(screen.getByText("Repeating")).toBeDefined();
    expect(screen.queryByText("One Off")).toBeNull();

    // Switch back
    fireEvent.click(screen.getByText("One-Off Activities"));
    expect(screen.getByText("One Off")).toBeDefined();
  });

  it("shows empty states", () => {
    render(<AvailableActivitiesModal {...mockProps} />);

    // One-off empty
    expect(screen.getByText(/No one-off activities available/i)).toBeDefined();

    fireEvent.click(screen.getByText("Repeating Activities"));
    expect(
      screen.getByText(/No repeating activities configured/i),
    ).toBeDefined();
  });

  it("opens confirmation modal and deletes activity", async () => {
    const activityToDelete = {
      id: "1",
      title: "Activity to Delete",
    } as Activity;
    render(
      <AvailableActivitiesModal
        {...mockProps}
        availableActivities={[activityToDelete]}
        repeatingActivities={[]}
      />,
    );

    const deleteButton = screen.getByText("Delete Activity");
    fireEvent.click(deleteButton);

    // Check confirmation modal content - wait for it
    expect(await screen.findByText("Delete Activity?")).toBeDefined();
    expect(
      await screen.findByText(/Are you sure you want to delete/),
    ).toBeDefined();

    // Click confirm delete button
    // "Delete" is the text of the confirm button.
    const confirmButton = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(confirmButton);

    // Verify onDeleteActivity was called
    expect(mockProps.onDeleteActivity).toHaveBeenCalledWith("1");
  });

  it("calls onOpenCreateActivity with a callback when New Activity is clicked", () => {
    render(<AvailableActivitiesModal {...mockProps} />);
    fireEvent.click(screen.getByText("New Activity"));
    expect(mockProps.onOpenCreateActivity).toHaveBeenCalledWith(
      expect.any(Function),
    );
  });

  it("switches to repeating tab when callback is called with 'repeating'", () => {
    render(
      <AvailableActivitiesModal
        {...mockProps}
        availableActivities={[{ id: "1", title: "One Off" } as Activity]}
        repeatingActivities={[{ id: "2", title: "Repeating" } as Activity]}
      />,
    );

    fireEvent.click(screen.getByText("New Activity"));
    const callback = (
      mockProps.onOpenCreateActivity as ReturnType<typeof vi.fn>
    ).mock.calls[0][0] as (type: "one-off" | "repeating") => void;

    // Simulate activity created as repeating — tab should switch
    act(() => callback("repeating"));
    expect(screen.queryByText("One Off")).toBeNull();
    expect(screen.getByText("Repeating")).toBeDefined();

    // Simulate activity created as one-off — tab should switch back
    act(() => callback("one-off"));
    expect(screen.getByText("One Off")).toBeDefined();
  });

  it("cancels deletion", async () => {
    const activity = { id: "1", title: "Activity 1" } as Activity;
    render(
      <AvailableActivitiesModal
        {...mockProps}
        availableActivities={[activity]}
        repeatingActivities={[]}
      />,
    );

    // Open delete modal
    fireEvent.click(screen.getByText("Delete Activity"));
    expect(await screen.findByText("Delete Activity?")).toBeDefined();

    // Click cancel
    fireEvent.click(screen.getByText("Cancel"));

    expect(mockProps.onDeleteActivity).not.toHaveBeenCalled();
  });

  it("deletes repeating activity", async () => {
    const activity = { id: "2", title: "Repeating Activity" } as Activity;
    render(
      <AvailableActivitiesModal
        {...mockProps}
        availableActivities={[]}
        repeatingActivities={[activity]}
      />,
    );

    // Switch to repeating tab
    fireEvent.click(screen.getByText("Repeating Activities"));

    // Find delete button
    fireEvent.click(screen.getByText("Delete Activity"));

    // Confirm
    expect(await screen.findByText("Delete Activity?")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(mockProps.onDeleteActivity).toHaveBeenCalledWith("2");
  });

  describe("Repeating tab: zone-aware ordering", () => {
    const makeRepeating = (
      id: string,
      title: string,
      defaultZoneId?: string,
    ): Activity =>
      ({
        id,
        title,
        energyCost: {},
        factors: {
          initiationDifficulty: 0,
          terminationDifficulty: 0,
          isRestorative: false,
        },
        createdAt: new Date(),
        repeatConfig: {
          frequency: 1,
          unit: "days",
          ...(defaultZoneId ? { defaultZoneId } : {}),
        },
      }) as Activity;

    it("renders repeating activities ordered by (no zone first, then zone order, then stored order)", () => {
      const repeatingActivities = [
        makeRepeating("e1", "Evening 1", "evening"),
        makeRepeating("m1", "Morning 1", "morning"),
        makeRepeating("n1", "No zone 1"),
        makeRepeating("m2", "Morning 2", "morning"),
        makeRepeating("n2", "No zone 2"),
      ];
      render(
        <AvailableActivitiesModal
          {...mockProps}
          repeatingActivities={repeatingActivities}
        />,
      );

      fireEvent.click(screen.getByText("Repeating Activities"));

      const cards = screen.getAllByTestId("activity-card");
      expect(cards.map((c) => c.firstChild?.textContent ?? "")).toEqual([
        "No zone 1",
        "No zone 2",
        "Morning 1",
        "Morning 2",
        "Evening 1",
      ]);
    });

    it("treats a dangling defaultZoneId as no-zone in the display", () => {
      const repeatingActivities = [
        makeRepeating("orphan", "Orphan", "deleted-zone-id"),
        makeRepeating("m", "Morning item", "morning"),
      ];
      render(
        <AvailableActivitiesModal
          {...mockProps}
          repeatingActivities={repeatingActivities}
        />,
      );

      fireEvent.click(screen.getByText("Repeating Activities"));

      const cards = screen.getAllByTestId("activity-card");
      expect(cards.map((c) => c.firstChild?.textContent ?? "")).toEqual([
        "Orphan",
        "Morning item",
      ]);
    });

    it("re-derives order live when zones are reordered", () => {
      const repeatingActivities = [
        makeRepeating("m", "Morning item", "morning"),
        makeRepeating("e", "Evening item", "evening"),
      ];
      const reorderedZones: ZoneConfig[] = [
        { id: "evening", name: "Evening", order: 0 },
        { id: "morning", name: "Morning", order: 1 },
      ];
      render(
        <AvailableActivitiesModal
          {...mockProps}
          repeatingActivities={repeatingActivities}
          zones={reorderedZones}
        />,
      );

      fireEvent.click(screen.getByText("Repeating Activities"));

      const cards = screen.getAllByTestId("activity-card");
      expect(cards.map((c) => c.firstChild?.textContent ?? "")).toEqual([
        "Evening item",
        "Morning item",
      ]);
    });
  });
});
