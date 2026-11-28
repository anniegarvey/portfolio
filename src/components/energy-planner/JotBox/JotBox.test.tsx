import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JotBox } from "./JotBox";

vi.mock("@/lib/energy-planner/context", () => ({
  useEnergyPlanner: vi.fn(),
}));

import { useEnergyPlanner } from "@/lib/energy-planner/context";

const addActivity = vi.fn();

function mockInstalledApp(installed: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: installed && query === "(display-mode: standalone)",
  }));
}

describe("JotBox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    vi.mocked(useEnergyPlanner).mockReturnValue({ addActivity } as any);
    mockInstalledApp(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("saves the idea as a one-off with only a name, then clears", async () => {
    render(<JotBox />);
    const input = screen.getByRole("textbox", { name: "Jot down an idea" });

    await userEvent.type(input, "  Book the boiler service {Enter}");

    expect(addActivity).toHaveBeenCalledWith({
      title: "Book the boiler service",
      energyCost: {},
      factors: {
        initiationDifficulty: 0,
        terminationDifficulty: 0,
        isRestorative: false,
      },
    });
    expect(input).toHaveValue("");
    expect(
      screen.getByText("Saved “Book the boiler service” to your ideas"),
    ).toBeInTheDocument();
  });

  it("ignores an empty idea", async () => {
    render(<JotBox />);
    await userEvent.type(screen.getByRole("textbox"), "   {Enter}");
    expect(addActivity).not.toHaveBeenCalled();
  });

  it("clears the saved message after a few seconds", () => {
    vi.useFakeTimers();
    render(<JotBox />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Repot the monstera" } });
    fireEvent.submit(input);
    expect(screen.getByText(/Saved/)).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3000));

    expect(screen.queryByText(/Saved/)).not.toBeInTheDocument();
  });

  it("doesn't take focus in a browser tab", () => {
    render(<JotBox />);
    expect(screen.getByRole("textbox")).not.toHaveFocus();
  });

  it("takes focus when the installed app opens or comes back", () => {
    mockInstalledApp(true);
    render(<JotBox />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveFocus();

    input.blur();
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(input).toHaveFocus();
  });

  it("restarts the saved message when the same idea is saved again", () => {
    vi.useFakeTimers();
    render(<JotBox />);
    const input = screen.getByRole("textbox");
    const save = () => {
      fireEvent.change(input, { target: { value: "Water plants" } });
      fireEvent.submit(input);
    };
    save();
    act(() => vi.advanceTimersByTime(2000));
    save();
    act(() => vi.advanceTimersByTime(2000));

    expect(screen.getByText(/Saved/)).toBeInTheDocument();
  });

  it("doesn't pull focus from another field or a dialog when coming back", () => {
    mockInstalledApp(true);
    render(
      <>
        <JotBox />
        <input aria-label="Other field" />
        <div role="dialog">
          <button type="button">In dialog</button>
        </div>
      </>,
    );
    const jot = screen.getByRole("textbox", { name: "Jot down an idea" });

    screen.getByRole("textbox", { name: "Other field" }).focus();
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(jot).not.toHaveFocus();

    screen.getByRole("button", { name: "In dialog" }).focus();
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(jot).not.toHaveFocus();
  });
});
