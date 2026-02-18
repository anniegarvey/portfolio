import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@/lib/energy-planner/schema";
import { AvailableActivitiesModal } from ".";

vi.mock("../PlannerActivityCard", () => ({
  PlannerActivityCard: ({
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

describe("AvailableActivitiesModal", () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    availableActivities: [],
    repeatingActivities: [],
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
});
