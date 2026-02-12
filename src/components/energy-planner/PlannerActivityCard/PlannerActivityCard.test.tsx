import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../../lib/energy-planner/context";
import type { Activity } from "../../../lib/energy-planner/schema";
import { PlannerActivityCard } from ".";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
);

const mockActivity: Activity = {
  id: "activity-1",
  title: "Test Activity",
  createdAt: new Date(),
  energyCost: { physical: 10, social: 20, executive: 5 },
  factors: {
    initiationDifficulty: 1,
    terminationDifficulty: 1,
    isRestorative: false,
  },
  completed: false,
};

describe("PlannerActivityCard", () => {
  it("renders activity title and energy costs", () => {
    const mockOnEdit = vi.fn();
    render(
      <PlannerActivityCard activity={mockActivity} onEdit={mockOnEdit} />,
      {
        wrapper,
      },
    );

    expect(screen.getByText("Test Activity")).toBeInTheDocument();
    expect(screen.getByText("10 P")).toBeInTheDocument();
    expect(screen.getByText("20 S")).toBeInTheDocument();
    expect(screen.getByText("5 E")).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    render(
      <PlannerActivityCard activity={mockActivity} onEdit={mockOnEdit} />,
      {
        wrapper,
      },
    );

    await user.click(screen.getByLabelText("Edit activity"));
    expect(mockOnEdit).toHaveBeenCalledWith(mockActivity);
  });

  it("shows add button when not selected", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    const mockOnAdd = vi.fn();
    render(
      <PlannerActivityCard
        activity={mockActivity}
        onAdd={mockOnAdd}
        onEdit={mockOnEdit}
      />,
      { wrapper },
    );

    const addButton = screen.getByLabelText("Add to day");
    expect(addButton).toBeInTheDocument();

    await user.click(addButton);
    expect(mockOnAdd).toHaveBeenCalledWith("activity-1");
  });

  it("shows remove button when selected", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    const mockOnRemove = vi.fn();
    render(
      <PlannerActivityCard
        activity={mockActivity}
        onEdit={mockOnEdit}
        onRemove={mockOnRemove}
        selected
      />,
      { wrapper },
    );

    const removeButton = screen.getByLabelText("Remove from day");
    expect(removeButton).toBeInTheDocument();

    await user.click(removeButton);
    expect(mockOnRemove).toHaveBeenCalledWith("activity-1");
  });

  it("shows completion toggle when selected", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    const mockOnToggleCompletion = vi.fn();
    render(
      <PlannerActivityCard
        activity={mockActivity}
        onEdit={mockOnEdit}
        onToggleCompletion={mockOnToggleCompletion}
        selected
      />,
      { wrapper },
    );

    const toggleButton = screen.getByLabelText("Mark as done");
    expect(toggleButton).toBeInTheDocument();

    await user.click(toggleButton);
    expect(mockOnToggleCompletion).toHaveBeenCalledWith("activity-1");
  });

  it("shows 'Mark as not done' when activity is completed", () => {
    const mockOnEdit = vi.fn();
    const mockOnToggleCompletion = vi.fn();
    render(
      <PlannerActivityCard
        activity={mockActivity}
        completed
        onEdit={mockOnEdit}
        onToggleCompletion={mockOnToggleCompletion}
        selected
      />,
      { wrapper },
    );

    expect(screen.getByLabelText("Mark as not done")).toBeInTheDocument();
  });

  it("does not show add button when selected", () => {
    const mockOnEdit = vi.fn();
    render(
      <PlannerActivityCard
        activity={mockActivity}
        onEdit={mockOnEdit}
        selected
      />,
      {
        wrapper,
      },
    );

    expect(screen.queryByLabelText("Add to day")).not.toBeInTheDocument();
  });

  it("does not show remove button when not selected", () => {
    const mockOnEdit = vi.fn();
    render(
      <PlannerActivityCard activity={mockActivity} onEdit={mockOnEdit} />,
      {
        wrapper,
      },
    );

    expect(screen.queryByLabelText("Remove from day")).not.toBeInTheDocument();
  });

  it("does not show completion toggle when not selected", () => {
    const mockOnEdit = vi.fn();
    render(
      <PlannerActivityCard activity={mockActivity} onEdit={mockOnEdit} />,
      {
        wrapper,
      },
    );

    expect(screen.queryByLabelText("Mark as done")).not.toBeInTheDocument();
  });

  it("displays correct energy badge labels with P, S, E suffixes", () => {
    const mockOnEdit = vi.fn();
    render(
      <PlannerActivityCard activity={mockActivity} onEdit={mockOnEdit} />,
      {
        wrapper,
      },
    );

    // Verify the exact text including the suffix
    expect(screen.getByText(/10 P/)).toBeInTheDocument();
    expect(screen.getByText(/20 S/)).toBeInTheDocument();
    expect(screen.getByText(/5 E/)).toBeInTheDocument();
  });

  it("displays correct button titles for accessibility", () => {
    const mockOnEdit = vi.fn();
    const mockOnAdd = vi.fn();
    render(
      <PlannerActivityCard
        activity={mockActivity}
        onAdd={mockOnAdd}
        onEdit={mockOnEdit}
      />,
      { wrapper },
    );

    expect(screen.getByTitle("Edit activity")).toBeInTheDocument();
    expect(screen.getByTitle("Add to day")).toBeInTheDocument();
  });

  it("displays correct button titles when selected", () => {
    const mockOnEdit = vi.fn();
    const mockOnRemove = vi.fn();
    const mockOnToggleCompletion = vi.fn();
    render(
      <PlannerActivityCard
        activity={mockActivity}
        onEdit={mockOnEdit}
        onRemove={mockOnRemove}
        onToggleCompletion={mockOnToggleCompletion}
        selected
      />,
      { wrapper },
    );

    expect(screen.getByTitle("Mark as done")).toBeInTheDocument();
    expect(screen.getByTitle("Remove from day")).toBeInTheDocument();
  });

  it("toggles completion button when clicked on completed activity", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    const mockOnToggleCompletion = vi.fn();
    render(
      <PlannerActivityCard
        activity={mockActivity}
        completed
        onEdit={mockOnEdit}
        onToggleCompletion={mockOnToggleCompletion}
        selected
      />,
      { wrapper },
    );

    const toggleButton = screen.getByLabelText("Mark as not done");
    await user.click(toggleButton);
    expect(mockOnToggleCompletion).toHaveBeenCalledWith("activity-1");
  });

  it("renders all three energy types with correct values", () => {
    const mockOnEdit = vi.fn();
    const activityWithDifferentEnergy: Activity = {
      ...mockActivity,
      energyCost: { physical: 25, social: 50, executive: 75 },
    };
    render(
      <PlannerActivityCard
        activity={activityWithDifferentEnergy}
        onEdit={mockOnEdit}
      />,
      { wrapper },
    );

    expect(screen.getByText("25 P")).toBeInTheDocument();
    expect(screen.getByText("50 S")).toBeInTheDocument();
    expect(screen.getByText("75 E")).toBeInTheDocument();
  });

  it("does not render energy badge if cost is 0", () => {
    const mockOnEdit = vi.fn();
    const activityWithZeroCost: Activity = {
      ...mockActivity,
      energyCost: { physical: 0, social: 10, executive: 0 },
    };
    render(
      <PlannerActivityCard
        activity={activityWithZeroCost}
        onEdit={mockOnEdit}
      />,
      {
        wrapper,
      },
    );

    expect(screen.queryByText(/0 P/)).not.toBeInTheDocument();
    expect(screen.getByText(/10 S/)).toBeInTheDocument();
    expect(screen.queryByText(/0 E/)).not.toBeInTheDocument();
  });

  it("does not render actions if optional callbacks are not provided", () => {
    const mockOnEdit = vi.fn();
    render(
      <PlannerActivityCard
        activity={mockActivity}
        onEdit={mockOnEdit}
        selected
      />,
      {
        wrapper,
      },
    );

    expect(screen.queryByLabelText("Remove from day")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Mark as done")).not.toBeInTheDocument();
  });

  it("does not show add button when not selected but onAdd is missing", () => {
    const mockOnEdit = vi.fn();
    render(
      <PlannerActivityCard activity={mockActivity} onEdit={mockOnEdit} />,
      {
        wrapper,
      },
    );

    expect(screen.queryByLabelText("Add to day")).not.toBeInTheDocument();
  });
  it("renders drag handle when dragHandleProps are provided", () => {
    const mockOnEdit = vi.fn();
    const dragHandleProps = {
      listeners: {
        onPointerDown: vi.fn(),
      } as unknown as DraggableSyntheticListeners,
      attributes: {
        "data-testid": "drag-handle",
        "aria-pressed": false,
        role: "button",
        tabIndex: 0,
      } as unknown as DraggableAttributes,
      ref: vi.fn(),
    };

    render(
      <PlannerActivityCard
        activity={mockActivity}
        dragHandleProps={dragHandleProps}
        onEdit={mockOnEdit}
      />,
      { wrapper },
    );

    const handle = screen.getByLabelText("Reorder activity: Test Activity");
    expect(handle).toBeInTheDocument();
  });

  it("shows delete button and calls onDelete when clicked", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    render(
      <PlannerActivityCard
        activity={mockActivity}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />,
      { wrapper },
    );

    const deleteButton = screen.getByLabelText("Delete activity");
    expect(deleteButton).toBeInTheDocument();

    await user.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledWith(mockActivity.id);
  });

  it("does not show remove button for repeating activities", () => {
    const mockOnEdit = vi.fn();
    const mockOnRemove = vi.fn();
    const repeatingActivity: Activity = {
      ...mockActivity,
      repeatConfig: { frequency: 1, unit: "days" },
    };

    render(
      <PlannerActivityCard
        activity={repeatingActivity}
        onEdit={mockOnEdit}
        onRemove={mockOnRemove}
        selected
      />,
      { wrapper },
    );

    expect(screen.queryByLabelText("Remove from day")).not.toBeInTheDocument();
  });

  it("does not show completion toggle when isFutureDay is true", () => {
    const mockOnEdit = vi.fn();
    const mockOnToggleCompletion = vi.fn();
    render(
      <PlannerActivityCard
        activity={mockActivity}
        isFutureDay
        onEdit={mockOnEdit}
        onToggleCompletion={mockOnToggleCompletion}
        selected
      />,
      { wrapper },
    );

    expect(screen.queryByLabelText("Mark as done")).not.toBeInTheDocument();
  });
});
