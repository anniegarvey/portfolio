import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SingAlongGarden } from "./SingAlongGarden";

function singLine() {
  fireEvent.click(screen.getByRole("button"));
  act(() => {
    vi.advanceTimersByTime(5000);
  });
}

describe("SingAlongGarden", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("blooms one flower per line and celebrates after the fourth", () => {
    const onCelebrate = vi.fn();
    render(<SingAlongGarden onCelebrate={onCelebrate} />);

    expect(
      screen.getByRole("button", { name: "Sing the first line" }),
    ).toBeInTheDocument();

    singLine();
    expect(screen.getByText("1 of 4 flowers in bloom")).toBeInTheDocument();
    expect(screen.getByText("Hap-")).toBeInTheDocument();

    singLine();
    singLine();
    expect(screen.getByText("Mum")).toBeInTheDocument();
    expect(onCelebrate).not.toHaveBeenCalled();

    singLine();
    expect(onCelebrate).toHaveBeenCalledOnce();
    expect(
      screen.getByText("The whole garden is in bloom!"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sing it again" }),
    ).toBeInTheDocument();
  });

  it("starts a fresh verse after the garden has bloomed", () => {
    render(<SingAlongGarden />);
    for (let i = 0; i < 5; i++) singLine();

    expect(screen.getByText("1 of 4 flowers in bloom")).toBeInTheDocument();
  });

  it("ignores taps while a line is still being sung", () => {
    render(<SingAlongGarden />);
    const button = screen.getByRole("button");

    fireEvent.click(button);
    expect(button).toBeDisabled();
    fireEvent.click(button);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText("1 of 4 flowers in bloom")).toBeInTheDocument();
  });
});
