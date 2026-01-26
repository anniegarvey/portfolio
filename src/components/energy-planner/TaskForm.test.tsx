import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../lib/energy-planner/context";
import type { RepeatingTask, Task } from "../../lib/energy-planner/schema";
import {
  clearAll,
  getOneOffTasks,
  getRepeatingTasks,
  setOneOffTasks,
  setRepeatingTasks,
} from "../../lib/energy-planner/storage";
import { TaskForm } from "./TaskForm";

// Explicitly type the mock implementations to avoid 'any'
vi.mock("../../lib/energy-planner/storage", () => {
  let mockOneOffTasks: any[] = [];
  let mockRepeatingTasks: any[] = [];

  return {
    clearAll: vi.fn().mockImplementation(async () => {
      mockOneOffTasks = [];
      mockRepeatingTasks = [];
    }),
    getOneOffTasks: vi.fn().mockImplementation(async () => {
      return mockOneOffTasks;
    }),
    setOneOffTasks: vi.fn().mockImplementation(async (tasks) => {
      mockOneOffTasks = tasks;
    }),
    getRepeatingTasks: vi
      .fn()
      .mockImplementation(async () => mockRepeatingTasks),
    setRepeatingTasks: vi.fn().mockImplementation(async (tasks) => {
      mockRepeatingTasks = tasks;
    }),
    getEnergyTypes: vi.fn().mockResolvedValue([
      { id: "physical", label: "Physical", color: "red" },
      { id: "social", label: "Social", color: "blue" },
      { id: "executive", label: "Executive", color: "green" },
    ]),
    setEnergyTypes: vi.fn().mockResolvedValue(undefined),
    getZones: vi.fn().mockResolvedValue([]),
    setZones: vi.fn().mockResolvedValue(undefined),
    getDayPlan: vi.fn().mockResolvedValue(null),
    setDayPlan: vi.fn().mockResolvedValue(undefined),
    deleteDayPlan: vi.fn().mockResolvedValue(undefined),
    getAllDayPlanDates: vi.fn().mockResolvedValue([]),
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
);

// Helper to type mocks
import type { Mock } from "vitest";

const mockGetOneOffTasks = getOneOffTasks as unknown as Mock;
const mockGetRepeatingTasks = getRepeatingTasks as unknown as Mock;
const mockSetOneOffTasks = setOneOffTasks as unknown as Mock;
const mockSetRepeatingTasks = setRepeatingTasks as unknown as Mock;

describe("TaskForm", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    (getOneOffTasks as any).mockResolvedValue([]);
    (getRepeatingTasks as any).mockResolvedValue([]);
    (setRepeatingTasks as any).mockResolvedValue(undefined);
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
      expect(mockSetOneOffTasks).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: "New Chore",
            energyCost: { physical: 50, social: 10, executive: 10 },
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

  it.skip("updates an existing task", async () => {
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
    (getOneOffTasks as any).mockImplementation(async () => [initialTask]);

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
      // console.log("Calls:", mockSetOneOffTasks.mock.calls);
      expect(mockSetOneOffTasks).toHaveBeenCalled();
      const lastCall =
        mockSetOneOffTasks.mock.calls[mockSetOneOffTasks.mock.calls.length - 1];
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
      expect(mockSetOneOffTasks).toHaveBeenCalledWith(
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
    expect(mockSetOneOffTasks).not.toHaveBeenCalled();
  });

  it("toggles repeating task options", async () => {
    render(<TaskForm />, { wrapper });

    const checkbox = screen.getByLabelText(/Repeat this task/i);
    fireEvent.click(checkbox);

    expect(
      await screen.findByTestId("frequency-input", {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Days")[0]).toBeInTheDocument(); // Select value

    // Change frequency
    const freqInput = screen.getByTestId("frequency-input");
    fireEvent.change(freqInput, { target: { value: "3" } });
    expect((freqInput as HTMLInputElement).value).toBe("3");

    // Verify submission includes repeat config
    fireEvent.change(screen.getByPlaceholderText(/Do Laundry/i), {
      target: { value: "Repeater" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Add Task/i }));

    await waitFor(() => {
      expect(mockSetRepeatingTasks).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: "Repeater",
            repeatConfig: expect.objectContaining({
              frequency: 3,
              unit: "days",
            }),
          }),
        ]),
      );
    });
  });
});
