import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateSelector } from "./DateSelector";

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple test cases
describe("DateSelector", () => {
  const defaultProps = {
    currentDate: "2026-01-22",
    viewingToday: true,
    onPreviousDay: vi.fn(),
    onNextDay: vi.fn(),
    onGoToToday: vi.fn(),
  };

  it("renders the formatted date", () => {
    render(<DateSelector {...defaultProps} />);

    expect(screen.getByText(/January 22, 2026/)).toBeInTheDocument();
  });

  it("shows Today indicator when viewing today", () => {
    render(<DateSelector {...defaultProps} viewingToday={true} />);

    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Go to Today" }),
    ).not.toBeInTheDocument();
  });

  it("shows Go to Today button when not viewing today", () => {
    render(<DateSelector {...defaultProps} viewingToday={false} />);

    expect(screen.queryByText("Today")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go to Today" }),
    ).toBeInTheDocument();
  });

  it("calls onPreviousDay when previous button clicked", () => {
    const onPreviousDay = vi.fn();
    render(<DateSelector {...defaultProps} onPreviousDay={onPreviousDay} />);

    fireEvent.click(screen.getByRole("button", { name: "Previous day" }));

    expect(onPreviousDay).toHaveBeenCalledTimes(1);
  });

  it("calls onNextDay when next button clicked", () => {
    const onNextDay = vi.fn();
    render(<DateSelector {...defaultProps} onNextDay={onNextDay} />);

    fireEvent.click(screen.getByRole("button", { name: "Next day" }));

    expect(onNextDay).toHaveBeenCalledTimes(1);
  });

  it("calls onGoToToday when Go to Today button clicked", () => {
    const onGoToToday = vi.fn();
    render(
      <DateSelector
        {...defaultProps}
        onGoToToday={onGoToToday}
        viewingToday={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Go to Today" }));

    expect(onGoToToday).toHaveBeenCalledTimes(1);
  });

  it("renders navigation buttons with correct aria labels", () => {
    render(<DateSelector {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: "Previous day" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next day" }),
    ).toBeInTheDocument();
  });
});
