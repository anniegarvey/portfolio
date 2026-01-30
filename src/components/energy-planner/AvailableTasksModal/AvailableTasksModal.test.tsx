import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "@/lib/energy-planner/schema";
import { AvailableTasksModal } from ".";

vi.mock("../PlannerTaskCard", () => ({
  PlannerTaskCard: ({
    task,
    onDelete,
  }: {
    task: Task;
    onDelete: (id: string) => void;
  }) => (
    <div data-testid="task-card">
      {task.title}
      {onDelete && (
        <button onClick={() => onDelete(task.id)} type="button">
          Delete Task
        </button>
      )}
    </div>
  ),
}));

describe("AvailableTasksModal", () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    availableTasks: [],
    repeatingTasks: [],
    onOpenCreateTask: vi.fn(),
    onEditTask: vi.fn(),
    onAddTask: vi.fn(),
    onReorderTasks: vi.fn(),
    onDeleteTask: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when open", () => {
    // No context needed if mocked
    render(<AvailableTasksModal {...mockProps} />);
    expect(screen.getByText("Available Tasks")).toBeDefined();
    expect(screen.getByText("One-Off Tasks")).toBeDefined();
    expect(screen.getByText("Repeating Tasks")).toBeDefined();
  });

  it("switches tabs", () => {
    render(
      <AvailableTasksModal
        {...mockProps}
        availableTasks={[{ id: "1", title: "One Off" } as Task]}
        repeatingTasks={[{ id: "2", title: "Repeating" } as Task]}
      />,
    );

    // Default is one-off
    expect(screen.getByText("One Off")).toBeDefined();
    expect(screen.queryByText("Repeating")).toBeNull();

    // Switch to repeating
    fireEvent.click(screen.getByText("Repeating Tasks"));
    expect(screen.getByText("Repeating")).toBeDefined();
    expect(screen.queryByText("One Off")).toBeNull();

    // Switch back
    fireEvent.click(screen.getByText("One-Off Tasks"));
    expect(screen.getByText("One Off")).toBeDefined();
  });

  it("shows empty states", () => {
    render(<AvailableTasksModal {...mockProps} />);

    // One-off empty
    expect(screen.getByText(/No one-off tasks available/i)).toBeDefined();

    fireEvent.click(screen.getByText("Repeating Tasks"));
    expect(screen.getByText(/No repeating tasks configured/i)).toBeDefined();
  });

  it("opens confirmation modal and deletes task", async () => {
    const taskToDelete = { id: "1", title: "Task to Delete" } as Task;
    render(
      <AvailableTasksModal
        {...mockProps}
        availableTasks={[taskToDelete]}
        repeatingTasks={[]}
      />,
    );

    const deleteButton = screen.getByText("Delete Task");
    fireEvent.click(deleteButton);

    // Check confirmation modal content - wait for it
    expect(await screen.findByText("Delete Task?")).toBeDefined();
    expect(
      await screen.findByText(/Are you sure you want to delete/),
    ).toBeDefined();

    // Click confirm delete button
    // "Delete" is the text of the confirm button.
    const confirmButton = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(confirmButton);

    // Verify onDeleteTask was called
    expect(mockProps.onDeleteTask).toHaveBeenCalledWith("1");
  });

  it("cancels deletion", async () => {
    const task = { id: "1", title: "Task 1" } as Task;
    render(
      <AvailableTasksModal
        {...mockProps}
        availableTasks={[task]}
        repeatingTasks={[]}
      />,
    );

    // Open delete modal
    fireEvent.click(screen.getByText("Delete Task"));
    expect(await screen.findByText("Delete Task?")).toBeDefined();

    // Click cancel
    fireEvent.click(screen.getByText("Cancel"));

    expect(mockProps.onDeleteTask).not.toHaveBeenCalled();
  });

  it("deletes repeating task", async () => {
    const task = { id: "2", title: "Repeating Task" } as Task;
    render(
      <AvailableTasksModal
        {...mockProps}
        availableTasks={[]}
        repeatingTasks={[task]}
      />,
    );

    // Switch to repeating tab
    fireEvent.click(screen.getByText("Repeating Tasks"));

    // Find delete button
    fireEvent.click(screen.getByText("Delete Task"));

    // Confirm
    expect(await screen.findByText("Delete Task?")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(mockProps.onDeleteTask).toHaveBeenCalledWith("2");
  });
});
