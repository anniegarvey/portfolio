import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "@/lib/drift/settings";
import { DriftPage } from "./DriftPage";

const KEY = "drift-settings";

let reduceListeners: (() => void)[];
let reduce: boolean;

beforeEach(() => {
  localStorage.clear();
  reduce = false;
  reduceListeners = [];
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return reduce && query.includes("prefers-reduced-motion");
    },
    media: query,
    addEventListener: (_: string, listener: () => void) =>
      reduceListeners.push(listener),
    removeEventListener: vi.fn(),
  }));
  // jsdom has no canvas; the water itself is covered by DriftCanvas's tests.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

describe("DriftPage", () => {
  it("shows the water and its settings", () => {
    render(<DriftPage />);
    expect(screen.getByRole("heading", { name: "Drift" })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /water to stir/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Settings" }),
    ).toBeInTheDocument();
  });

  it("restores saved settings", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, palette: "aurora", swirl: 0.9 }),
    );
    render(<DriftPage />);
    expect(screen.getByRole("radio", { name: "Aurora" })).toBeChecked();
    expect(screen.getByRole("slider", { name: "Swirl" })).toHaveValue("0.9");
  });

  it("saves each change", async () => {
    render(<DriftPage />);
    await userEvent.click(screen.getByRole("radio", { name: "Dusk" }));
    fireEvent.change(screen.getByRole("slider", { name: "Thickness" }), {
      target: { value: "0.7" },
    });
    expect(JSON.parse(localStorage.getItem(KEY) ?? "{}")).toMatchObject({
      palette: "dusk",
      viscosity: 0.7,
    });
  });

  it("resets settings to the defaults", async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, palette: "ember" }),
    );
    render(<DriftPage />);
    await userEvent.click(
      screen.getByRole("button", { name: "Reset settings" }),
    );
    expect(screen.getByRole("radio", { name: "Lagoon" })).toBeChecked();
    expect(JSON.parse(localStorage.getItem(KEY) ?? "{}")).toEqual(
      DEFAULT_SETTINGS,
    );
  });

  it("passes the colour and clear buttons through to the water", async () => {
    render(<DriftPage />);
    await userEvent.click(screen.getByRole("button", { name: "Add colour" }));
    await userEvent.click(screen.getByRole("button", { name: "Clear water" }));
    expect(
      screen.getByRole("img", { name: /water to stir/i }),
    ).toBeInTheDocument();
  });

  it("goes calm when the device asks for reduced motion", () => {
    render(<DriftPage />);
    const toggle = screen.getByRole("checkbox", { name: "Gentle currents" });
    expect(toggle).toBeEnabled();

    reduce = true;
    act(() => {
      for (const listener of reduceListeners) listener();
    });
    expect(toggle).toBeDisabled();
  });
});
