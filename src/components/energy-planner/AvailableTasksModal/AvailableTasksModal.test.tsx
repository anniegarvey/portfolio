import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Task } from "@/lib/energy-planner/schema";
import { AvailableTasksModal } from ".";

vi.mock("../PlannerTaskCard", () => ({
  PlannerTaskCard: ({ task }: { task: Task }) => (
    <div data-testid="task-card">{task.title}</div>
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
  };

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

    // Switch to repeating empty
    fireEvent.click(screen.getByText("Repeating Tasks"));
    expect(screen.getByText(/No repeating tasks configured/i)).toBeDefined();
  });
});
