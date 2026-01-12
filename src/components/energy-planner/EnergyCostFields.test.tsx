import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../lib/energy-planner/context";
import { EnergyCostFields } from "./EnergyCostFields";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
);

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple test cases
describe("EnergyCostFields", () => {
  it("renders all three energy type fields", () => {
    const mockOnChange = vi.fn();
    const energyCost = { physical: 10, social: 20, executive: 30 };

    render(
      <EnergyCostFields energyCost={energyCost} onChange={mockOnChange} />,
      { wrapper },
    );

    expect(screen.getByLabelText("Physical")).toBeInTheDocument();
    expect(screen.getByLabelText("Social")).toBeInTheDocument();
    expect(screen.getByLabelText("Executive")).toBeInTheDocument();
  });

  it("displays current energy cost values", () => {
    const mockOnChange = vi.fn();
    const energyCost = { physical: 15, social: 25, executive: 35 };

    render(
      <EnergyCostFields energyCost={energyCost} onChange={mockOnChange} />,
      { wrapper },
    );

    expect(screen.getByLabelText("Physical")).toHaveValue(15);
    expect(screen.getByLabelText("Social")).toHaveValue(25);
    expect(screen.getByLabelText("Executive")).toHaveValue(35);
  });

  it("calls onChange when physical energy is updated", () => {
    const mockOnChange = vi.fn();
    const energyCost = { physical: 10, social: 20, executive: 30 };

    render(
      <EnergyCostFields energyCost={energyCost} onChange={mockOnChange} />,
      { wrapper },
    );

    const physicalInput = screen.getByLabelText("Physical");
    fireEvent.change(physicalInput, { target: { value: "50" } });

    expect(mockOnChange).toHaveBeenCalledWith({
      physical: 50,
      social: 20,
      executive: 30,
    });
  });

  it("calls onChange when social energy is updated", () => {
    const mockOnChange = vi.fn();
    const energyCost = { physical: 10, social: 20, executive: 30 };

    render(
      <EnergyCostFields energyCost={energyCost} onChange={mockOnChange} />,
      { wrapper },
    );

    const socialInput = screen.getByLabelText("Social");
    fireEvent.change(socialInput, { target: { value: "60" } });

    expect(mockOnChange).toHaveBeenCalledWith({
      physical: 10,
      social: 60,
      executive: 30,
    });
  });

  it("calls onChange when executive energy is updated", () => {
    const mockOnChange = vi.fn();
    const energyCost = { physical: 10, social: 20, executive: 30 };

    render(
      <EnergyCostFields energyCost={energyCost} onChange={mockOnChange} />,
      { wrapper },
    );

    const executiveInput = screen.getByLabelText("Executive");
    fireEvent.change(executiveInput, { target: { value: "70" } });

    expect(mockOnChange).toHaveBeenCalledWith({
      physical: 10,
      social: 20,
      executive: 70,
    });
  });

  it("displays section title", () => {
    const mockOnChange = vi.fn();
    const energyCost = { physical: 10, social: 20, executive: 30 };

    render(
      <EnergyCostFields energyCost={energyCost} onChange={mockOnChange} />,
      { wrapper },
    );

    expect(screen.getByText("Energy Cost (0-100)")).toBeInTheDocument();
  });
});
