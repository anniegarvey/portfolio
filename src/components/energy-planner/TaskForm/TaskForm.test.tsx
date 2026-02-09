import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../../lib/energy-planner/context";
import type { Task } from "../../../lib/energy-planner/schema";
import {
  clearAll,
  fetchOneOffTasks,
  fetchRepeatingTasks,
  storeOneOffTasks,
  storeRepeatingTasks,
} from "../../../lib/energy-planner/storage";
import { TaskForm } from ".";

// Explicitly type the mock implementations to avoid 'any'
vi.mock("../../../lib/energy-planner/storage", () => {
  let mockOneOffTasks: Task[] = [];
  let mockRepeatingTasks: Task[] = [];

  return {
    clearAll: vi.fn().mockImplementation(async () => {
      mockOneOffTasks = [];
      mockRepeatingTasks = [];
    }),
    fetchOneOffTasks: vi.fn().mockImplementation(async () => {
      return mockOneOffTasks;
    }),
    storeOneOffTasks: vi.fn().mockImplementation(async (tasks) => {
      mockOneOffTasks = tasks;
    }),
    fetchRepeatingTasks: vi
      .fn()
      .mockImplementation(async () => mockRepeatingTasks),
    storeRepeatingTasks: vi.fn().mockImplementation(async (tasks) => {
      mockRepeatingTasks = tasks;
    }),
    fetchEnergyTypes: vi.fn().mockResolvedValue([
      { id: "physical", label: "Physical", color: "red" },
      { id: "social", label: "Social", color: "blue" },
      { id: "executive", label: "Executive", color: "green" },
    ]),
    storeEnergyTypes: vi.fn().mockResolvedValue(undefined),
    fetchZones: vi.fn().mockResolvedValue([]),
    storeZones: vi.fn().mockResolvedValue(undefined),
    fetchDayPlan: vi.fn().mockResolvedValue(null),
    storeDayPlan: vi.fn().mockResolvedValue(undefined),
    deleteDayPlan: vi.fn().mockResolvedValue(undefined),
    fetchAllDayPlanDates: vi.fn().mockResolvedValue([]),
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
);

// Helper to type mocks
import type { Mock } from "vitest";

const mockstoreOneOffTasks = storeOneOffTasks as unknown as Mock;
const mockstoreRepeatingTasks = storeRepeatingTasks as unknown as Mock;

describe("TaskForm", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    (fetchOneOffTasks as unknown as Mock).mockResolvedValue([]);
    (fetchRepeatingTasks as unknown as Mock).mockResolvedValue([]);
    (storeRepeatingTasks as unknown as Mock).mockResolvedValue(undefined);
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

    // Wait for button to be ready
    await waitFor(() => {
      const button = screen.getByRole("button", {
        name: /Add Task/i,
      }) as HTMLButtonElement;
      expect(button).toBeDefined();
      expect(button.disabled).toBe(false);
    });

    // Fill Title
    fireEvent.change(screen.getByPlaceholderText(/Do Laundry/i), {
      target: { value: "New Chore" },
    });

    // Fill Description
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "My detailed description" },
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
    fireEvent.click(screen.getByRole("button", { name: /Add Task/i }));

    // Verify onClose called
    expect(onClose).toHaveBeenCalled();

    // Verify storage
    await waitFor(() => {
      expect(mockstoreOneOffTasks).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: "New Chore",
            description: "My detailed description",
            energyCost: { physical: 50, social: 0, executive: 0 },
            factors: {
              initiationDifficulty: 8,
              terminationDifficulty: 3,
              isRestorative: true,
            },
          }),
        ]),
      );
    });
  });

  it("updates an existing task", async () => {
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
      completed: false,
    };

    // Initialize mock state
    (fetchOneOffTasks as unknown as Mock).mockImplementation(async () => [
      initialTask,
    ]);

    const onClose = vi.fn();
    render(<TaskForm initialData={initialTask} onClose={onClose} />, {
      wrapper,
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Existing Task")).toBeDefined();
    });

    // Wait for button to be ready (not loading)
    await waitFor(() => {
      const button = screen.getByRole("button", {
        name: /Update Task/i,
      }) as HTMLButtonElement;
      expect(button).toBeDefined();
      expect(button.disabled).toBe(false);
    });

    // Change title
    fireEvent.change(screen.getByDisplayValue("Existing Task"), {
      target: { value: "Updated Task" },
    });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /Update Task/i }));

    expect(onClose).toHaveBeenCalled();

    // Verify storage
    await waitFor(() => {
      // console.log("Calls:", mockstoreOneOffTasks.mock.calls);
      expect(mockstoreOneOffTasks).toHaveBeenCalled();
      const lastCall =
        mockstoreOneOffTasks.mock.calls[
          mockstoreOneOffTasks.mock.calls.length - 1
        ];
      expect(lastCall[0]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "123",
            title: "Updated Task",
          }),
        ]),
      );
    });
  }, 5000);

  it("resets form after submission if onClose is not provided", async () => {
    render(<TaskForm />, { wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Do Laundry/i)).toBeDefined();
    });

    // Wait for button ready
    await waitFor(() => {
      const button = screen.getByRole("button", {
        name: /Add Task/i,
      }) as HTMLButtonElement;
      expect(button).toBeDefined();
      expect(button.disabled).toBe(false);
    });

    const titleInput = screen.getByPlaceholderText(
      /Do Laundry/i,
    ) as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "Another Task" } });

    fireEvent.click(screen.getByRole("button", { name: /Add Task/i }));

    await waitFor(() => {
      expect(titleInput.value).toBe("");
    });

    await waitFor(() => {
      expect(mockstoreOneOffTasks).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: "Another Task",
          }),
        ]),
      );
    });
  });

  it("validates inputs", async () => {
    const onClose = vi.fn();
    render(<TaskForm onClose={onClose} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Add Task")).toBeDefined();
    });

    // Wait for button ready
    await waitFor(() => {
      const button = screen.getByRole("button", {
        name: /Add Task/i,
      }) as HTMLButtonElement;
      expect(button).toBeDefined();
      expect(button.disabled).toBe(false);
    });

    // Clear mocks to ignore initial load calls
    vi.clearAllMocks();

    // Submit without title
    fireEvent.click(screen.getByRole("button", { name: /Add Task/i }));

    expect(onClose).not.toHaveBeenCalled();
    expect(mockstoreOneOffTasks).not.toHaveBeenCalled();
  });

  it("toggles repeating task options", async () => {
    render(<TaskForm />, { wrapper });

    const checkbox = screen.getByLabelText(/Repeat this task/i);
    fireEvent.click(checkbox);

    expect(
      await screen.findByTestId("frequency-input", {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Days")[0]).toBeInTheDocument(); // Select value
    expect(screen.getByLabelText("Next Due Date")).toBeInTheDocument();

    // Change frequency
    const freqInput = screen.getByTestId("frequency-input");
    fireEvent.change(freqInput, { target: { value: "3" } });
    expect((freqInput as HTMLInputElement).value).toBe("3");

    // Change next due date
    const dateInput = screen.getByLabelText("Next Due Date");
    fireEvent.change(dateInput, { target: { value: "2024-03-01" } });

    // Change unit
    const unitTrigger = screen.getByLabelText("Repeat Unit");
    fireEvent.click(unitTrigger);
    fireEvent.click(screen.getByRole("option", { name: "Weeks" }));

    // Verify submission includes repeat config
    fireEvent.change(screen.getByPlaceholderText(/Do Laundry/i), {
      target: { value: "Repeater" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Add Task/i }));

    await waitFor(() => {
      expect(mockstoreRepeatingTasks).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: "Repeater",
            repeatConfig: expect.objectContaining({
              frequency: 3,
              unit: "weeks",
              nextDueDate: "2024-03-01",
            }),
          }),
        ]),
      );
    });
  });
});
