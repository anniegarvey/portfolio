import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskFactorFields } from ".";

describe("TaskFactorFields", () => {
  it("renders all factor fields", () => {
    const mockOnChange = vi.fn();
    const factors = {
      initiationDifficulty: 5,
      terminationDifficulty: 5,
      isRestorative: false,
    };

    render(<TaskFactorFields factors={factors} onChange={mockOnChange} />);

    expect(
      screen.getByLabelText("Start Difficulty (0-10)"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Stop Difficulty (0-10)")).toBeInTheDocument();
    expect(screen.getByLabelText("Restorative?")).toBeInTheDocument();
  });

  it("displays current factor values", () => {
    const mockOnChange = vi.fn();
    const factors = {
      initiationDifficulty: 7,
      terminationDifficulty: 3,
      isRestorative: true,
    };

    render(<TaskFactorFields factors={factors} onChange={mockOnChange} />);

    expect(screen.getByLabelText("Start Difficulty (0-10)")).toHaveValue(7);
    expect(screen.getByLabelText("Stop Difficulty (0-10)")).toHaveValue(3);
    expect(screen.getByLabelText("Restorative?")).toBeChecked();
  });

  it("displays empty inputs when values are 0", () => {
    const mockOnChange = vi.fn();
    const factors = {
      initiationDifficulty: 0,
      terminationDifficulty: 0,
      isRestorative: false,
    };

    render(<TaskFactorFields factors={factors} onChange={mockOnChange} />);

    expect(screen.getByLabelText("Start Difficulty (0-10)")).toHaveValue(null);
    expect(screen.getByLabelText("Stop Difficulty (0-10)")).toHaveValue(null);
  });

  it("calls onChange when initiation difficulty is updated", () => {
    const mockOnChange = vi.fn();
    const factors = {
      initiationDifficulty: 5,
      terminationDifficulty: 5,
      isRestorative: false,
    };

    render(<TaskFactorFields factors={factors} onChange={mockOnChange} />);

    const input = screen.getByLabelText("Start Difficulty (0-10)");
    fireEvent.change(input, { target: { value: "8" } });

    expect(mockOnChange).toHaveBeenCalledWith({
      initiationDifficulty: 8,
      terminationDifficulty: 5,
      isRestorative: false,
    });
  });

  it("calls onChange when termination difficulty is updated", () => {
    const mockOnChange = vi.fn();
    const factors = {
      initiationDifficulty: 5,
      terminationDifficulty: 5,
      isRestorative: false,
    };

    render(<TaskFactorFields factors={factors} onChange={mockOnChange} />);

    const input = screen.getByLabelText("Stop Difficulty (0-10)");
    fireEvent.change(input, { target: { value: "9" } });

    expect(mockOnChange).toHaveBeenCalledWith({
      initiationDifficulty: 5,
      terminationDifficulty: 9,
      isRestorative: false,
    });
  });

  it("calls onChange when isRestorative is toggled", () => {
    const mockOnChange = vi.fn();
    const factors = {
      initiationDifficulty: 5,
      terminationDifficulty: 5,
      isRestorative: false,
    };

    render(<TaskFactorFields factors={factors} onChange={mockOnChange} />);

    const checkbox = screen.getByLabelText("Restorative?");
    fireEvent.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledWith({
      initiationDifficulty: 5,
      terminationDifficulty: 5,
      isRestorative: true,
    });
  });

  it("displays section title", () => {
    const mockOnChange = vi.fn();
    const factors = {
      initiationDifficulty: 5,
      terminationDifficulty: 5,
      isRestorative: false,
    };

    render(<TaskFactorFields factors={factors} onChange={mockOnChange} />);

    expect(screen.getByText("Task Factors")).toBeInTheDocument();
  });
});
