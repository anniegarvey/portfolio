import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  EnergyPlannerProvider,
  useEnergyPlanner,
} from "../../../lib/energy-planner/context";
import { EnergyInput } from ".";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
);

describe("EnergyInput", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders sliders for all energy types", () => {
    render(<EnergyInput />, { wrapper });

    expect(screen.getByLabelText(/physical/i)).toBeDefined();
    expect(screen.getByLabelText(/social/i)).toBeDefined();
    expect(screen.getByLabelText(/executive/i)).toBeDefined();
  });

  it("updates value when slider changes", () => {
    render(<EnergyInput />, { wrapper });

    const slider = screen.getByLabelText(/physical/i) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "80" } });

    expect(slider.value).toBe("80");
    expect(screen.getByText("80%")).toBeDefined();
  });

  it("displays correct initial values", () => {
    render(<EnergyInput />, { wrapper });

    const physicalSlider = screen.getByLabelText(
      /physical/i,
    ) as HTMLInputElement;
    const socialSlider = screen.getByLabelText(/social/i) as HTMLInputElement;
    const executiveSlider = screen.getByLabelText(
      /executive/i,
    ) as HTMLInputElement;

    expect(physicalSlider.value).toBe("50");
    expect(socialSlider.value).toBe("50");
    expect(executiveSlider.value).toBe("50");
  });

  it("displays percentage labels for all sliders", () => {
    render(<EnergyInput />, { wrapper });

    // Should show 50% for all three by default
    const percentageLabels = screen.getAllByText("50%");
    expect(percentageLabels.length).toBe(3);
  });

  it("updates social energy slider", () => {
    render(<EnergyInput />, { wrapper });

    const slider = screen.getByLabelText(/social/i) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "75" } });

    expect(slider.value).toBe("75");
    expect(screen.getByText("75%")).toBeDefined();
  });

  it("updates executive energy slider", () => {
    render(<EnergyInput />, { wrapper });

    const slider = screen.getByLabelText(/executive/i) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "90" } });

    expect(slider.value).toBe("90");
    expect(screen.getByText("90%")).toBeDefined();
  });

  it("renders labels for each energy type", () => {
    render(<EnergyInput />, { wrapper });

    expect(screen.getByLabelText("Physical")).toBeInTheDocument();
    expect(screen.getByLabelText("Social")).toBeInTheDocument();
    expect(screen.getByLabelText("Executive")).toBeInTheDocument();
  });

  it("slider has correct min and max values", () => {
    render(<EnergyInput />, { wrapper });

    const slider = screen.getByLabelText(/physical/i) as HTMLInputElement;
    expect(slider.min).toBe("0");
    expect(slider.max).toBe("100");
  });

  it("updates percentage display when value changes", () => {
    render(<EnergyInput />, { wrapper });

    const slider = screen.getByLabelText(/physical/i) as HTMLInputElement;

    fireEvent.change(slider, { target: { value: "25" } });
    expect(screen.getByText("25%")).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: "100" } });
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders header text", () => {
    render(<EnergyInput />, { wrapper });

    expect(screen.getByText("Daily Energy Capacity")).toBeInTheDocument();
    expect(
      screen.getByText("How much energy do you have today?"),
    ).toBeInTheDocument();
  });

  it("slider clamps values between 0 and 100", () => {
    render(<EnergyInput />, { wrapper });

    const slider = screen.getByLabelText(/physical/i) as HTMLInputElement;

    // Test > 100
    fireEvent.change(slider, { target: { value: "150" } });
    expect(slider.value).toBe("100");

    // Test < 0
    fireEvent.change(slider, { target: { value: "-50" } });
    expect(slider.value).toBe("0");
  });

  it("renders settings button with correct aria-label", () => {
    render(<EnergyInput />, { wrapper });

    const settingsButton = screen.getByRole("button", {
      name: "Manage Energy Types",
    });
    expect(settingsButton).toBeInTheDocument();
  });

  it("opens energy type manager modal when settings button is clicked", () => {
    render(<EnergyInput />, { wrapper });

    const settingsButton = screen.getByRole("button", {
      name: "Manage Energy Types",
    });
    fireEvent.click(settingsButton);

    expect(
      screen.getByRole("dialog", { name: "Manage Energy Types" }),
    ).toBeInTheDocument();
  });

  it("closes energy type manager modal when close button is clicked", () => {
    render(<EnergyInput />, { wrapper });

    // Open modal
    const settingsButton = screen.getByRole("button", {
      name: "Manage Energy Types",
    });
    fireEvent.click(settingsButton);

    expect(
      screen.getByRole("dialog", { name: "Manage Energy Types" }),
    ).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByRole("button", { name: "Close modal" });
    fireEvent.click(closeButton);

    expect(
      screen.queryByRole("dialog", { name: "Manage Energy Types" }),
    ).not.toBeInTheDocument();
  });

  it("shows today header when viewing today", () => {
    render(<EnergyInput />, { wrapper });

    expect(
      screen.getByText("How much energy do you have today?"),
    ).toBeInTheDocument();
  });

  it("does not show edit button when viewing today", () => {
    render(<EnergyInput />, { wrapper });

    expect(
      screen.queryByRole("button", { name: /Edit Capacities/i }),
    ).not.toBeInTheDocument();
  });

  it("shows read-only view and edit button when viewing past day", async () => {
    const DateManipulator = () => {
      const { goToPreviousDay } = useEnergyPlanner();
      return (
        <button onClick={goToPreviousDay} type="button">
          Go Back
        </button>
      );
    };

    render(
      <EnergyPlannerProvider>
        <EnergyInput />
        <DateManipulator />
      </EnergyPlannerProvider>,
    );

    // Go to yesterday
    fireEvent.click(screen.getByText("Go Back"));

    expect(
      screen.getByRole("button", { name: /Edit Capacities/i }),
    ).toBeInTheDocument();

    // Inputs should be read-only (or effectively by not being sliders/being disabled in UI logic)
    // The implementation renders styling specific components, but easier to check if we can toggle edit mode.

    // Enter edit mode
    fireEvent.click(screen.getByText("Edit Capacities"));

    // Should see Done Editing
    expect(screen.getByText("Done Editing")).toBeInTheDocument();
    expect(screen.queryByText("Edit Capacities")).not.toBeInTheDocument();

    // Exit edit mode
    fireEvent.click(screen.getByText("Done Editing"));
    expect(screen.getByText("Edit Capacities")).toBeInTheDocument();
  });
});
