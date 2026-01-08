import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../lib/energy-planner/context";
import { TaskForm } from "./TaskForm";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
);

describe("TaskForm", () => {
  it("renders empty form for new task", () => {
    render(<TaskForm />, { wrapper });

    expect(screen.getByPlaceholderText(/Do Laundry/i)).toBeDefined();
    expect(screen.getByText("Add Task")).toBeDefined();
  });

  it("renders with initial data for editing", () => {
    const initialTask = {
      id: "123",
      createdAt: new Date(),
      title: "Existing Task",
      description: "",
      energyCost: { physical: 20, social: 0, executive: 0 },
      factors: {
        initiationDifficulty: 1,
        terminationDifficulty: 1,
        isRestorative: false,
      },
    };

    render(<TaskForm initialData={initialTask} />, { wrapper });

    expect(screen.getByDisplayValue("Existing Task")).toBeDefined();
    expect(screen.getByText("Update Task")).toBeDefined();
  });

  it("validates inputs", () => {
    const onClose = vi.fn();
    render(<TaskForm onClose={onClose} />, { wrapper });

    // Submit without title
    fireEvent.click(screen.getByText("Add Task"));

    // onClose should not be called if validation fails (logic in handleSubmit checks for title)
    expect(onClose).not.toHaveBeenCalled();
  });
});
