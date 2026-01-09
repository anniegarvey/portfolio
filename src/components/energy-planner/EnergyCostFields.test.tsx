import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EnergyCostFields } from "./EnergyCostFields";

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple test cases
describe("EnergyCostFields", () => {
  it("renders all three energy type fields", () => {
    const mockOnChange = vi.fn();
    const energyCost = { physical: 10, social: 20, executive: 30 };

    render(
      <EnergyCostFields energyCost={energyCost} onChange={mockOnChange} />,
    );

    expect(screen.getByLabelText("physical")).toBeInTheDocument();
    expect(screen.getByLabelText("social")).toBeInTheDocument();
    expect(screen.getByLabelText("executive")).toBeInTheDocument();
  });

  it("displays current energy cost values", () => {
    const mockOnChange = vi.fn();
    const energyCost = { physical: 15, social: 25, executive: 35 };

    render(
      <EnergyCostFields energyCost={energyCost} onChange={mockOnChange} />,
    );

    expect(screen.getByLabelText("physical")).toHaveValue(15);
    expect(screen.getByLabelText("social")).toHaveValue(25);
    expect(screen.getByLabelText("executive")).toHaveValue(35);
  });

  it("calls onChange when physical energy is updated", () => {
    const mockOnChange = vi.fn();
    const energyCost = { physical: 10, social: 20, executive: 30 };

    render(
      <EnergyCostFields energyCost={energyCost} onChange={mockOnChange} />,
    );

    const physicalInput = screen.getByLabelText("physical");
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
    );

    const socialInput = screen.getByLabelText("social");
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
    );

    const executiveInput = screen.getByLabelText("executive");
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
    );

    expect(screen.getByText("Energy Cost (0-100)")).toBeInTheDocument();
  });
});
