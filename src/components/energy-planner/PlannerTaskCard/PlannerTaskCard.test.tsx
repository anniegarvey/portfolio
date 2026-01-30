import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../../lib/energy-planner/context";
import type { Task } from "../../../lib/energy-planner/schema";
import { PlannerTaskCard } from ".";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
);

const mockTask: Task = {
  id: "task-1",
  title: "Test Task",
  createdAt: new Date(),
  energyCost: { physical: 10, social: 20, executive: 5 },
  factors: {
    initiationDifficulty: 1,
    terminationDifficulty: 1,
    isRestorative: false,
  },
  completed: false,
};

describe("PlannerTaskCard", () => {
  it("renders task title and energy costs", () => {
    const mockOnEdit = vi.fn();
    render(<PlannerTaskCard onEdit={mockOnEdit} task={mockTask} />, {
      wrapper,
    });

    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.getByText("10 P")).toBeInTheDocument();
    expect(screen.getByText("20 S")).toBeInTheDocument();
    expect(screen.getByText("5 E")).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    render(<PlannerTaskCard onEdit={mockOnEdit} task={mockTask} />, {
      wrapper,
    });

    await user.click(screen.getByLabelText("Edit task"));
    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  it("shows add button when not selected", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    const mockOnAdd = vi.fn();
    render(
      <PlannerTaskCard onAdd={mockOnAdd} onEdit={mockOnEdit} task={mockTask} />,
      { wrapper },
    );

    const addButton = screen.getByLabelText("Add to day");
    expect(addButton).toBeInTheDocument();

    await user.click(addButton);
    expect(mockOnAdd).toHaveBeenCalledWith("task-1");
  });

  it("shows remove button when selected", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    const mockOnRemove = vi.fn();
    render(
      <PlannerTaskCard
        onEdit={mockOnEdit}
        onRemove={mockOnRemove}
        selected
        task={mockTask}
      />,
      { wrapper },
    );

    const removeButton = screen.getByLabelText("Remove from day");
    expect(removeButton).toBeInTheDocument();

    await user.click(removeButton);
    expect(mockOnRemove).toHaveBeenCalledWith("task-1");
  });

  it("shows completion toggle when selected", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    const mockOnToggleCompletion = vi.fn();
    render(
      <PlannerTaskCard
        onEdit={mockOnEdit}
        onToggleCompletion={mockOnToggleCompletion}
        selected
        task={mockTask}
      />,
      { wrapper },
    );

    const toggleButton = screen.getByLabelText("Mark as done");
    expect(toggleButton).toBeInTheDocument();

    await user.click(toggleButton);
    expect(mockOnToggleCompletion).toHaveBeenCalledWith("task-1");
  });

  it("shows 'Mark as not done' when task is completed", () => {
    const mockOnEdit = vi.fn();
    const mockOnToggleCompletion = vi.fn();
    render(
      <PlannerTaskCard
        completed
        onEdit={mockOnEdit}
        onToggleCompletion={mockOnToggleCompletion}
        selected
        task={mockTask}
      />,
      { wrapper },
    );

    expect(screen.getByLabelText("Mark as not done")).toBeInTheDocument();
  });

  it("does not show add button when selected", () => {
    const mockOnEdit = vi.fn();
    render(<PlannerTaskCard onEdit={mockOnEdit} selected task={mockTask} />, {
      wrapper,
    });

    expect(screen.queryByLabelText("Add to day")).not.toBeInTheDocument();
  });

  it("does not show remove button when not selected", () => {
    const mockOnEdit = vi.fn();
    render(<PlannerTaskCard onEdit={mockOnEdit} task={mockTask} />, {
      wrapper,
    });

    expect(screen.queryByLabelText("Remove from day")).not.toBeInTheDocument();
  });

  it("does not show completion toggle when not selected", () => {
    const mockOnEdit = vi.fn();
    render(<PlannerTaskCard onEdit={mockOnEdit} task={mockTask} />, {
      wrapper,
    });

    expect(screen.queryByLabelText("Mark as done")).not.toBeInTheDocument();
  });

  it("displays correct energy badge labels with P, S, E suffixes", () => {
    const mockOnEdit = vi.fn();
    render(<PlannerTaskCard onEdit={mockOnEdit} task={mockTask} />, {
      wrapper,
    });

    // Verify the exact text including the suffix
    expect(screen.getByText(/10 P/)).toBeInTheDocument();
    expect(screen.getByText(/20 S/)).toBeInTheDocument();
    expect(screen.getByText(/5 E/)).toBeInTheDocument();
  });

  it("displays correct button titles for accessibility", () => {
    const mockOnEdit = vi.fn();
    const mockOnAdd = vi.fn();
    render(
      <PlannerTaskCard onAdd={mockOnAdd} onEdit={mockOnEdit} task={mockTask} />,
      { wrapper },
    );

    expect(screen.getByTitle("Edit task")).toBeInTheDocument();
    expect(screen.getByTitle("Add to day")).toBeInTheDocument();
  });

  it("displays correct button titles when selected", () => {
    const mockOnEdit = vi.fn();
    const mockOnRemove = vi.fn();
    const mockOnToggleCompletion = vi.fn();
    render(
      <PlannerTaskCard
        onEdit={mockOnEdit}
        onRemove={mockOnRemove}
        onToggleCompletion={mockOnToggleCompletion}
        selected
        task={mockTask}
      />,
      { wrapper },
    );

    expect(screen.getByTitle("Mark as done")).toBeInTheDocument();
    expect(screen.getByTitle("Remove from day")).toBeInTheDocument();
  });

  it("toggles completion button when clicked on completed task", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    const mockOnToggleCompletion = vi.fn();
    render(
      <PlannerTaskCard
        completed
        onEdit={mockOnEdit}
        onToggleCompletion={mockOnToggleCompletion}
        selected
        task={mockTask}
      />,
      { wrapper },
    );

    const toggleButton = screen.getByLabelText("Mark as not done");
    await user.click(toggleButton);
    expect(mockOnToggleCompletion).toHaveBeenCalledWith("task-1");
  });

  it("renders all three energy types with correct values", () => {
    const mockOnEdit = vi.fn();
    const taskWithDifferentEnergy: Task = {
      ...mockTask,
      energyCost: { physical: 25, social: 50, executive: 75 },
    };
    render(
      <PlannerTaskCard onEdit={mockOnEdit} task={taskWithDifferentEnergy} />,
      { wrapper },
    );

    expect(screen.getByText("25 P")).toBeInTheDocument();
    expect(screen.getByText("50 S")).toBeInTheDocument();
    expect(screen.getByText("75 E")).toBeInTheDocument();
  });

  it("does not render energy badge if cost is 0", () => {
    const mockOnEdit = vi.fn();
    const taskWithZeroCost: Task = {
      ...mockTask,
      energyCost: { physical: 0, social: 10, executive: 0 },
    };
    render(<PlannerTaskCard onEdit={mockOnEdit} task={taskWithZeroCost} />, {
      wrapper,
    });

    expect(screen.queryByText(/0 P/)).not.toBeInTheDocument();
    expect(screen.getByText(/10 S/)).toBeInTheDocument();
    expect(screen.queryByText(/0 E/)).not.toBeInTheDocument();
  });

  it("does not render actions if optional callbacks are not provided", () => {
    const mockOnEdit = vi.fn();
    render(<PlannerTaskCard onEdit={mockOnEdit} selected task={mockTask} />, {
      wrapper,
    });

    expect(screen.queryByLabelText("Remove from day")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Mark as done")).not.toBeInTheDocument();
  });

  it("does not show add button when not selected but onAdd is missing", () => {
    const mockOnEdit = vi.fn();
    render(<PlannerTaskCard onEdit={mockOnEdit} task={mockTask} />, {
      wrapper,
    });

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
      <PlannerTaskCard
        dragHandleProps={dragHandleProps}
        onEdit={mockOnEdit}
        task={mockTask}
      />,
      { wrapper },
    );

    const handle = screen.getByLabelText("Reorder task: Test Task");
    expect(handle).toBeInTheDocument();
  });

  it("shows delete button and calls onDelete when clicked", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    render(
      <PlannerTaskCard
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        task={mockTask}
      />,
      { wrapper },
    );

    const deleteButton = screen.getByLabelText("Delete task");
    expect(deleteButton).toBeInTheDocument();

    await user.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledWith(mockTask.id);
  });
});
