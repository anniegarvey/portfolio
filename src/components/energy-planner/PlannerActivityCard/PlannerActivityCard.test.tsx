import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../../lib/energy-planner/context";
import type {
  Activity,
  PlannedInstance,
} from "../../../lib/energy-planner/schema";
import { PointsProvider } from "../../../lib/points/context";
import { AvailableActivityCard, PlannedActivityCard } from ".";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PointsProvider>
    <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
  </PointsProvider>
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
};

const mockInstance: PlannedInstance = {
  id: "instance-1",
  sourceActivityId: "activity-1",
  completed: false,
};

// ─── PlannedActivityCard ──────────────────────────────────────────────────────

describe("PlannedActivityCard", () => {
  it("renders activity title and energy costs", () => {
    render(
      <PlannedActivityCard
        activity={mockActivity}
        dayContext="today"
        instance={mockInstance}
        onEdit={vi.fn()}
      />,
      { wrapper },
    );

    expect(screen.getByText("Test Activity")).toBeInTheDocument();
    expect(screen.getByText("10 P")).toBeInTheDocument();
    expect(screen.getByText("20 S")).toBeInTheDocument();
    expect(screen.getByText("5 E")).toBeInTheDocument();
  });

  it("calls onEdit when title is clicked", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    render(
      <PlannedActivityCard
        activity={mockActivity}
        dayContext="today"
        instance={mockInstance}
        onEdit={mockOnEdit}
      />,
      { wrapper },
    );

    await user.click(screen.getByText("Test Activity"));
    expect(mockOnEdit).toHaveBeenCalledWith(mockActivity);
  });

  describe("getting-started help", () => {
    const hardActivity: Activity = {
      ...mockActivity,
      factors: { ...mockActivity.factors, initiationDifficulty: 6 },
    };

    function renderCard(
      activity: Activity,
      props: Partial<React.ComponentProps<typeof PlannedActivityCard>> = {},
    ) {
      const onEdit = vi.fn();
      render(
        <PlannedActivityCard
          activity={activity}
          dayContext="today"
          instance={mockInstance}
          onEdit={onEdit}
          {...props}
        />,
        { wrapper },
      );
      return onEdit;
    }

    it("shows the first tiny step", () => {
      renderCard({ ...mockActivity, firstStep: "Open the folder" });
      expect(
        screen.getByText("First step: Open the folder"),
      ).toBeInTheDocument();
    });

    it("hides the first step once completed", () => {
      renderCard(
        { ...mockActivity, firstStep: "Open the folder" },
        { completed: true },
      );
      expect(screen.queryByText(/First step:/)).not.toBeInTheDocument();
    });

    it("offers no hint for an activity that is easy to start", () => {
      renderCard({
        ...mockActivity,
        factors: { ...mockActivity.factors, initiationDifficulty: 5 },
      });
      expect(screen.queryByText(/Hard to start\?/)).not.toBeInTheDocument();
    });

    it("asks for a first step on a hard-to-start activity, opening the editor", async () => {
      const user = userEvent.setup();
      const onEdit = renderCard(hardActivity);
      await user.click(
        screen.getByRole("button", {
          name: "Hard to start? Add a tiny first step",
        }),
      );
      expect(onEdit).toHaveBeenCalledWith(hardActivity);
    });

    it("asks for a start time once a first step exists", () => {
      renderCard({ ...hardActivity, firstStep: "Open the folder" });
      expect(
        screen.getByRole("button", {
          name: "Hard to start? Pick a time to begin",
        }),
      ).toBeInTheDocument();
    });

    it("stops hinting once it has a first step and a time", () => {
      renderCard({
        ...hardActivity,
        firstStep: "Open the folder",
        reminderTime: "10:00",
      });
      expect(screen.queryByText(/Hard to start\?/)).not.toBeInTheDocument();
    });

    it("doesn't hint on past days or once done", () => {
      renderCard(hardActivity, { dayContext: "past" });
      renderCard(hardActivity, { completed: true });
      expect(screen.queryByText(/Hard to start\?/)).not.toBeInTheDocument();
    });
  });

  it("shows move button on today, allowing return to unplanned", async () => {
    const user = userEvent.setup();
    const mockOnRemove = vi.fn();
    render(
      <PlannedActivityCard
        activity={mockActivity}
        dayContext="today"
        instance={mockInstance}
        onEdit={vi.fn()}
        onRemove={mockOnRemove}
      />,
      { wrapper },
    );

    const moveButton = screen.getByLabelText("Move activity");
    expect(moveButton).toBeInTheDocument();

    await user.click(moveButton);

    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
    expect(screen.getByText("Return to unplanned")).toBeInTheDocument();

    await user.click(screen.getByText("Return to unplanned"));
    expect(mockOnRemove).toHaveBeenCalledWith("instance-1");
  });

  it("shows completion toggle on today", async () => {
    const user = userEvent.setup();
    const mockOnToggleCompletion = vi.fn();
    render(
      <PlannedActivityCard
        activity={mockActivity}
        dayContext="today"
        instance={mockInstance}
        onEdit={vi.fn()}
        onToggleCompletion={mockOnToggleCompletion}
      />,
      { wrapper },
    );

    const toggleButton = screen.getByLabelText("Mark as done");
    expect(toggleButton).toBeInTheDocument();

    await user.click(toggleButton);
    expect(mockOnToggleCompletion).toHaveBeenCalledWith("instance-1");
  });

  it("shows 'Mark as not done' when activity is completed", () => {
    render(
      <PlannedActivityCard
        activity={mockActivity}
        completed
        dayContext="today"
        instance={mockInstance}
        onEdit={vi.fn()}
        onToggleCompletion={vi.fn()}
      />,
      { wrapper },
    );

    expect(screen.getByLabelText("Mark as not done")).toBeInTheDocument();
  });

  it("toggles completion when clicked on a completed activity", async () => {
    const user = userEvent.setup();
    const mockOnToggleCompletion = vi.fn();
    render(
      <PlannedActivityCard
        activity={mockActivity}
        completed
        dayContext="today"
        instance={mockInstance}
        onEdit={vi.fn()}
        onToggleCompletion={mockOnToggleCompletion}
      />,
      { wrapper },
    );

    await user.click(screen.getByLabelText("Mark as not done"));
    expect(mockOnToggleCompletion).toHaveBeenCalledWith("instance-1");
  });

  it("does not show completion toggle when dayContext is future", () => {
    render(
      <PlannedActivityCard
        activity={mockActivity}
        dayContext="future"
        instance={mockInstance}
        onEdit={vi.fn()}
        onToggleCompletion={vi.fn()}
      />,
      { wrapper },
    );

    expect(screen.queryByLabelText("Mark as done")).not.toBeInTheDocument();
  });

  it("does not show completion toggle when dayContext is past", () => {
    render(
      <PlannedActivityCard
        activity={mockActivity}
        dayContext="past"
        instance={mockInstance}
        onEdit={vi.fn()}
        onToggleCompletion={vi.fn()}
      />,
      { wrapper },
    );

    expect(screen.queryByLabelText("Mark as done")).not.toBeInTheDocument();
  });

  it("does not show move button when dayContext is past", () => {
    render(
      <PlannedActivityCard
        activity={mockActivity}
        dayContext="past"
        instance={mockInstance}
        onEdit={vi.fn()}
      />,
      { wrapper },
    );

    expect(screen.queryByLabelText("Move activity")).not.toBeInTheDocument();
  });

  it("shows move button on future day", () => {
    render(
      <PlannedActivityCard
        activity={mockActivity}
        dayContext="future"
        instance={mockInstance}
        onEdit={vi.fn()}
      />,
      { wrapper },
    );

    expect(screen.getByLabelText("Move activity")).toBeInTheDocument();
  });

  it("does not show completion toggle when onToggleCompletion is not provided", () => {
    render(
      <PlannedActivityCard
        activity={mockActivity}
        dayContext="today"
        instance={mockInstance}
        onEdit={vi.fn()}
      />,
      { wrapper },
    );

    expect(screen.queryByLabelText("Mark as done")).not.toBeInTheDocument();
  });

  it("shows move button for repeating activities, without return to unplanned option", async () => {
    const user = userEvent.setup();
    const repeatingActivity: Activity = {
      ...mockActivity,
      repeatConfig: { frequency: 1, unit: "days" },
    };

    render(
      <PlannedActivityCard
        activity={repeatingActivity}
        dayContext="today"
        instance={mockInstance}
        onEdit={vi.fn()}
        onMove={vi.fn()}
        onRemove={vi.fn()}
      />,
      { wrapper },
    );

    await user.click(screen.getByLabelText("Move activity"));

    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
    expect(screen.queryByText("Return to unplanned")).not.toBeInTheDocument();
  });

  it("calls onMove when Tomorrow is clicked", async () => {
    const user = userEvent.setup();
    const mockOnMove = vi.fn();
    render(
      <PlannedActivityCard
        activity={mockActivity}
        dayContext="today"
        instance={mockInstance}
        onEdit={vi.fn()}
        onMove={mockOnMove}
      />,
      { wrapper },
    );

    await user.click(screen.getByLabelText("Move activity"));
    await user.click(screen.getByText("Tomorrow"));

    expect(mockOnMove).toHaveBeenCalledWith("instance-1", expect.any(String));
  });

  it("renders drag handle when dragHandleProps are provided", () => {
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
      <PlannedActivityCard
        activity={mockActivity}
        dayContext="today"
        dragHandleProps={dragHandleProps}
        instance={mockInstance}
        onEdit={vi.fn()}
      />,
      { wrapper },
    );

    expect(
      screen.getByLabelText("Reorder activity: Test Activity"),
    ).toBeInTheDocument();
  });

  it("renders all three energy types with correct values", () => {
    const activityWithDifferentEnergy: Activity = {
      ...mockActivity,
      energyCost: { physical: 25, social: 50, executive: 75 },
    };
    render(
      <PlannedActivityCard
        activity={activityWithDifferentEnergy}
        dayContext="today"
        instance={mockInstance}
        onEdit={vi.fn()}
      />,
      { wrapper },
    );

    expect(screen.getByText("25 P")).toBeInTheDocument();
    expect(screen.getByText("50 S")).toBeInTheDocument();
    expect(screen.getByText("75 E")).toBeInTheDocument();
  });

  it("does not render energy badge if cost is 0", () => {
    const activityWithZeroCost: Activity = {
      ...mockActivity,
      energyCost: { physical: 0, social: 10, executive: 0 },
    };
    render(
      <PlannedActivityCard
        activity={activityWithZeroCost}
        dayContext="today"
        instance={mockInstance}
        onEdit={vi.fn()}
      />,
      { wrapper },
    );

    expect(screen.queryByText(/0 P/)).not.toBeInTheDocument();
    expect(screen.getByText(/10 S/)).toBeInTheDocument();
    expect(screen.queryByText(/0 E/)).not.toBeInTheDocument();
  });
});

// ─── AvailableActivityCard ────────────────────────────────────────────────────

describe("AvailableActivityCard", () => {
  it("renders activity title and energy costs", () => {
    render(<AvailableActivityCard activity={mockActivity} onEdit={vi.fn()} />, {
      wrapper,
    });

    expect(screen.getByText("Test Activity")).toBeInTheDocument();
    expect(screen.getByText("10 P")).toBeInTheDocument();
    expect(screen.getByText("20 S")).toBeInTheDocument();
    expect(screen.getByText("5 E")).toBeInTheDocument();
  });

  it("calls onEdit when title is clicked", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    render(
      <AvailableActivityCard activity={mockActivity} onEdit={mockOnEdit} />,
      {
        wrapper,
      },
    );

    await user.click(screen.getByText("Test Activity"));
    expect(mockOnEdit).toHaveBeenCalledWith(mockActivity);
  });

  it("shows add button for one-off activity", async () => {
    const user = userEvent.setup();
    const mockOnAdd = vi.fn();
    render(
      <AvailableActivityCard
        activity={mockActivity}
        onAdd={mockOnAdd}
        onEdit={vi.fn()}
      />,
      { wrapper },
    );

    const addButton = screen.getByLabelText("Add to day");
    expect(addButton).toBeInTheDocument();

    await user.click(addButton);
    expect(mockOnAdd).toHaveBeenCalledWith("activity-1");
  });

  it("does not show add button when onAdd is not provided", () => {
    render(<AvailableActivityCard activity={mockActivity} onEdit={vi.fn()} />, {
      wrapper,
    });

    expect(screen.queryByLabelText("Add to day")).not.toBeInTheDocument();
  });

  it("does not show add button for repeating activities", () => {
    const repeatingActivity: Activity = {
      ...mockActivity,
      repeatConfig: { frequency: 1, unit: "days" },
    };
    render(
      <AvailableActivityCard
        activity={repeatingActivity}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
      />,
      { wrapper },
    );

    expect(screen.queryByLabelText("Add to day")).not.toBeInTheDocument();
  });

  it("shows delete button and calls onDelete when clicked", async () => {
    const user = userEvent.setup();
    const mockOnDelete = vi.fn();
    render(
      <AvailableActivityCard
        activity={mockActivity}
        onDelete={mockOnDelete}
        onEdit={vi.fn()}
      />,
      { wrapper },
    );

    const deleteButton = screen.getByLabelText("Delete activity");
    expect(deleteButton).toBeInTheDocument();

    await user.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledWith(mockActivity.id);
  });

  it("does not show delete button when onDelete is not provided", () => {
    render(<AvailableActivityCard activity={mockActivity} onEdit={vi.fn()} />, {
      wrapper,
    });

    expect(screen.queryByLabelText("Delete activity")).not.toBeInTheDocument();
  });

  it("shows correct button title for accessibility", () => {
    render(
      <AvailableActivityCard
        activity={mockActivity}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
      />,
      { wrapper },
    );

    expect(screen.getByTitle("Add to day")).toBeInTheDocument();
  });

  it("renders drag handle when dragHandleProps are provided", () => {
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
      <AvailableActivityCard
        activity={mockActivity}
        dragHandleProps={dragHandleProps}
        onEdit={vi.fn()}
      />,
      { wrapper },
    );

    expect(
      screen.getByLabelText("Reorder activity: Test Activity"),
    ).toBeInTheDocument();
  });

  it("does not render energy badge if cost is 0", () => {
    const activityWithZeroCost: Activity = {
      ...mockActivity,
      energyCost: { physical: 0, social: 10, executive: 0 },
    };
    render(
      <AvailableActivityCard
        activity={activityWithZeroCost}
        onEdit={vi.fn()}
      />,
      { wrapper },
    );

    expect(screen.queryByText(/0 P/)).not.toBeInTheDocument();
    expect(screen.getByText(/10 S/)).toBeInTheDocument();
    expect(screen.queryByText(/0 E/)).not.toBeInTheDocument();
  });
});
