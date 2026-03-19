import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as storageMock from "@/lib/energy-planner/storage";
import { EnergyPlannerProvider } from "../../../lib/energy-planner/context";
import type { Activity } from "../../../lib/energy-planner/schema";
import { PointsProvider } from "../../../lib/points/context";
import { ActivityForm } from ".";

vi.mock("@/lib/energy-planner/storage");

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PointsProvider>
    <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
  </PointsProvider>
);

describe("ActivityForm", () => {
  beforeEach(async () => {
    (storageMock as unknown as { __reset: () => void }).__reset();
  });

  it("renders empty form for new activity", async () => {
    render(<ActivityForm />, { wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Do Laundry/i)).toBeDefined();
    });
    expect(screen.getByText("Add Activity")).toBeDefined();
  });

  it("adds a new activity with factors and energy costs", async () => {
    const onClose = vi.fn();
    render(<ActivityForm onClose={onClose} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Do Laundry/i)).toBeDefined();
    });

    // Wait for button to be ready
    await waitFor(() => {
      const button = screen.getByRole("button", {
        name: /Add Activity/i,
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
    fireEvent.click(screen.getByRole("button", { name: /Add Activity/i }));

    // Verify onClose called
    expect(onClose).toHaveBeenCalled();

    // Verify storage
    await waitFor(() => {
      expect(storageMock.storeActivities).toHaveBeenCalledWith(
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

  it("updates an existing activity", async () => {
    const initialActivity: Activity = {
      id: "123",
      createdAt: new Date(),
      title: "Existing Activity",
      description: "",
      energyCost: { physical: 20, social: 0, executive: 0 },
      factors: {
        initiationDifficulty: 1,
        terminationDifficulty: 1,
        isRestorative: false,
      },
    };

    // Initialize mock state
    (storageMock.fetchActivities as unknown as Mock).mockResolvedValue([
      initialActivity,
    ]);

    const onClose = vi.fn();
    render(<ActivityForm initialData={initialActivity} onClose={onClose} />, {
      wrapper,
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Existing Activity")).toBeDefined();
    });

    // Wait for button to be ready (not loading)
    await waitFor(() => {
      const button = screen.getByRole("button", {
        name: /Update Activity/i,
      }) as HTMLButtonElement;
      expect(button).toBeDefined();
      expect(button.disabled).toBe(false);
    });

    // Change title
    fireEvent.change(screen.getByDisplayValue("Existing Activity"), {
      target: { value: "Updated Activity" },
    });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /Update Activity/i }));

    expect(onClose).toHaveBeenCalled();

    // Verify storage
    await waitFor(() => {
      expect(storageMock.storeActivities).toHaveBeenCalled();
      const mockFn = storageMock.storeActivities as unknown as Mock;
      const lastCall = mockFn.mock.calls[mockFn.mock.calls.length - 1];
      expect(lastCall[0]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "123",
            title: "Updated Activity",
          }),
        ]),
      );
    });
  }, 5000);

  it("resets form after submission if onClose is not provided", async () => {
    render(<ActivityForm />, { wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Do Laundry/i)).toBeDefined();
    });

    // Wait for button ready
    await waitFor(() => {
      const button = screen.getByRole("button", {
        name: /Add Activity/i,
      }) as HTMLButtonElement;
      expect(button).toBeDefined();
      expect(button.disabled).toBe(false);
    });

    const titleInput = screen.getByPlaceholderText(
      /Do Laundry/i,
    ) as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "Another Activity" } });

    fireEvent.click(screen.getByRole("button", { name: /Add Activity/i }));

    await waitFor(() => {
      expect(titleInput.value).toBe("");
    });

    await waitFor(() => {
      expect(storageMock.storeActivities).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: "Another Activity",
          }),
        ]),
      );
    });
  });

  it("validates inputs", async () => {
    const onClose = vi.fn();
    render(<ActivityForm onClose={onClose} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Add Activity")).toBeDefined();
    });

    // Wait for button ready
    await waitFor(() => {
      const button = screen.getByRole("button", {
        name: /Add Activity/i,
      }) as HTMLButtonElement;
      expect(button).toBeDefined();
      expect(button.disabled).toBe(false);
    });

    // Clear mocks to ignore initial load calls
    vi.clearAllMocks();
    (storageMock as unknown as { __reset: () => void }).__reset();

    // Submit without title
    fireEvent.click(screen.getByRole("button", { name: /Add Activity/i }));

    expect(onClose).not.toHaveBeenCalled();
    expect(storageMock.storeActivities).not.toHaveBeenCalled();
  });

  it("toggles repeating activity options", async () => {
    render(<ActivityForm />, { wrapper });

    const checkbox = screen.getByLabelText(/Repeat this activity/i);
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
    fireEvent.click(screen.getByRole("button", { name: /Add Activity/i }));

    await waitFor(() => {
      expect(storageMock.storeActivities).toHaveBeenCalledWith(
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

  const seedActivity: Activity = {
    id: "seed-1",
    createdAt: new Date("2024-01-01"),
    title: "Do Laundry",
    energyCost: { physical: 10, social: 0, executive: 0 },
    factors: {
      initiationDifficulty: 1,
      terminationDifficulty: 1,
      isRestorative: false,
    },
  };

  it("shows suggestions dropdown when typing matching text", async () => {
    (storageMock.fetchActivities as unknown as Mock).mockResolvedValue([
      seedActivity,
    ]);

    render(<ActivityForm />, { wrapper });

    await waitFor(() => {
      expect(
        (
          screen.getByRole("button", {
            name: /Add Activity/i,
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false);
    });

    fireEvent.change(screen.getByPlaceholderText(/Do Laundry/i), {
      target: { value: "laundry" },
    });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeDefined();
      expect(screen.getByRole("option", { name: "Do Laundry" })).toBeDefined();
    });
  });

  it("selects a suggestion on mouse click and populates the form", async () => {
    (storageMock.fetchActivities as unknown as Mock).mockResolvedValue([
      seedActivity,
    ]);

    render(<ActivityForm />, { wrapper });

    await waitFor(() => {
      expect(
        (
          screen.getByRole("button", {
            name: /Add Activity/i,
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false);
    });

    const input = screen.getByPlaceholderText(
      /Do Laundry/i,
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "laundry" } });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeDefined();
    });

    fireEvent.mouseDown(screen.getByRole("option", { name: "Do Laundry" }));

    await waitFor(() => {
      expect(input.value).toBe("Do Laundry");
      expect(screen.queryByRole("listbox")).toBeNull();
    });
  });

  it("navigates and selects a suggestion with arrow keys and Enter", async () => {
    (storageMock.fetchActivities as unknown as Mock).mockResolvedValue([
      seedActivity,
    ]);

    render(<ActivityForm />, { wrapper });

    await waitFor(() => {
      expect(
        (
          screen.getByRole("button", {
            name: /Add Activity/i,
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false);
    });

    const input = screen.getByPlaceholderText(
      /Do Laundry/i,
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "laundry" } });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeDefined();
    });

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(
      screen
        .getByRole("option", { name: "Do Laundry" })
        .getAttribute("aria-selected"),
    ).toBe("true");

    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(input.value).toBe("Do Laundry");
      expect(screen.queryByRole("listbox")).toBeNull();
    });
  });

  it("closes suggestions on Escape without changing the input value", async () => {
    (storageMock.fetchActivities as unknown as Mock).mockResolvedValue([
      seedActivity,
    ]);

    render(<ActivityForm />, { wrapper });

    await waitFor(() => {
      expect(
        (
          screen.getByRole("button", {
            name: /Add Activity/i,
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false);
    });

    const input = screen.getByPlaceholderText(
      /Do Laundry/i,
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "laundry" } });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeDefined();
    });

    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeNull();
    });
    expect(input.value).toBe("laundry");
  });

  it("calls onSuggestionsChange when suggestions open and close", async () => {
    (storageMock.fetchActivities as unknown as Mock).mockResolvedValue([
      seedActivity,
    ]);

    const onSuggestionsChange = vi.fn();
    render(<ActivityForm onSuggestionsChange={onSuggestionsChange} />, {
      wrapper,
    });

    await waitFor(() => {
      expect(
        (
          screen.getByRole("button", {
            name: /Add Activity/i,
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false);
    });

    const input = screen.getByPlaceholderText(/Do Laundry/i);
    fireEvent.change(input, { target: { value: "laundry" } });

    await waitFor(() => {
      expect(onSuggestionsChange).toHaveBeenCalledWith(true);
    });

    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => {
      expect(onSuggestionsChange).toHaveBeenCalledWith(false);
    });
  });

  it("includes contextual default zone in submission", async () => {
    const onClose = vi.fn();
    render(
      <ActivityForm
        initialContext={{ date: "2024-01-01", zoneId: "morning" }}
        onClose={onClose}
      />,
      { wrapper },
    );

    // Wait for the activity name input to be present to ensure initial load is done
    await screen.findByPlaceholderText(/Do Laundry/i);

    fireEvent.change(screen.getByPlaceholderText(/Do Laundry/i), {
      target: { value: "Contextual Activity" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Add Activity/i }));

    // The activity is immediately planned when there is a zone context,
    // so it ends up in the day plan rather than the available activities pool.
    await waitFor(() => {
      expect(storageMock.storeDayPlan).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          plannedInstances: expect.arrayContaining([
            expect.objectContaining({
              zoneId: "morning",
            }),
          ]),
        }),
      );
    });
  });
});
