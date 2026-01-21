import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../lib/energy-planner/context";
import { clearAll, getTasks } from "../../lib/energy-planner/storage";
import { TaskForm } from "./TaskForm";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
);

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple test cases
describe("TaskForm", () => {
  beforeEach(async () => {
    await clearAll();
  });

  it("renders empty form for new task", async () => {
    render(<TaskForm />, { wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Do Laundry/i)).toBeDefined();
    });
    expect(screen.getByText("Add Task")).toBeDefined();
  });

  it("adds a new task with factors and energy costs", async () => {
    const onClose = vi.fn();
    render(<TaskForm onClose={onClose} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Do Laundry/i)).toBeDefined();
    });

    // Fill Title
    fireEvent.change(screen.getByPlaceholderText(/Do Laundry/i), {
      target: { value: "New Chore" },
    });

    const physInput = screen.getByLabelText(/Physical/i);
    fireEvent.change(physInput, { target: { value: "50" } });

    // Fill Factors
    fireEvent.change(screen.getByLabelText(/Start Difficulty/i), {
      target: { value: "8" },
    });
    fireEvent.change(screen.getByLabelText(/Stop Difficulty/i), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByLabelText(/Restorative/i)); // Toggle checkbox

    // Submit
    fireEvent.click(screen.getByText("Add Task"));

    // Verify onClose called
    expect(onClose).toHaveBeenCalled();

    // Verify storage
    await waitFor(async () => {
      const tasks = await getTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toMatchObject({
        title: "New Chore",
        energyCost: { physical: 50, social: 10, executive: 10 }, // Default 10
        factors: {
          initiationDifficulty: 8,
          terminationDifficulty: 3,
          isRestorative: true,
        },
      });
    });
  });

  it("updates an existing task", async () => {
    const { setTasks } = await import("../../lib/energy-planner/storage");

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

    await setTasks([initialTask]);

    const onClose = vi.fn();
    render(<TaskForm initialData={initialTask} onClose={onClose} />, {
      wrapper,
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Existing Task")).toBeDefined();
    });
    expect(screen.getByText("Update Task")).toBeDefined();

    // Change title
    fireEvent.change(screen.getByDisplayValue("Existing Task"), {
      target: { value: "Updated Task" },
    });

    // Submit
    fireEvent.click(screen.getByText("Update Task"));

    expect(onClose).toHaveBeenCalled();

    // Verify storage
    await waitFor(async () => {
      const tasks = await getTasks();
      expect(tasks[0].title).toBe("Updated Task");
    });
  });

  it("resets form after submission if onClose is not provided", async () => {
    render(<TaskForm />, { wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Do Laundry/i)).toBeDefined();
    });

    const titleInput = screen.getByPlaceholderText(
      /Do Laundry/i,
    ) as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "Another Task" } });

    fireEvent.click(screen.getByText("Add Task"));

    await waitFor(() => {
      expect(titleInput.value).toBe("");
    });

    const tasks = await getTasks();
    expect(tasks).toHaveLength(1);
  });

  it("validates inputs", async () => {
    const onClose = vi.fn();
    render(<TaskForm onClose={onClose} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Add Task")).toBeDefined();
    });

    // Submit without title
    fireEvent.click(screen.getByText("Add Task"));

    expect(onClose).not.toHaveBeenCalled();
    const tasks = await getTasks();
    expect(tasks).toHaveLength(0);
  });
});
