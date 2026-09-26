import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, type DriftSettings } from "@/lib/drift/settings";
import { DriftSettingsPanel } from "./DriftSettingsPanel";

function renderPanel(settings: Partial<DriftSettings> = {}, calm = false) {
  const handlers = {
    onChange: vi.fn(),
    onReset: vi.fn(),
    onClear: vi.fn(),
    onBloom: vi.fn(),
  };
  const view = render(
    <DriftSettingsPanel
      calm={calm}
      settings={{ ...DEFAULT_SETTINGS, ...settings }}
      {...handlers}
    />,
  );
  return { ...handlers, ...view };
}

describe("DriftSettingsPanel", () => {
  it("has no accessibility violations", async () => {
    const { container } = renderPanel();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows the current palette as chosen", () => {
    renderPanel({ palette: "meadow" });
    expect(screen.getByRole("radio", { name: "Meadow" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Lagoon" })).not.toBeChecked();
  });

  it("picks a palette", async () => {
    const { onChange } = renderPanel();
    await userEvent.click(screen.getByRole("radio", { name: "Ember" }));
    expect(onChange).toHaveBeenCalledWith({ palette: "ember" });
  });

  it("reflects and changes each slider", () => {
    const { onChange } = renderPanel({ speed: 1.5, trail: 0.2 });
    expect(screen.getByRole("slider", { name: "Flow speed" })).toHaveValue(
      "1.5",
    );
    expect(screen.getByRole("slider", { name: "Trail length" })).toHaveValue(
      "0.2",
    );

    for (const [name, key, value] of [
      ["Flow speed", "speed", "0.5"],
      ["Thickness", "viscosity", "0.8"],
      ["Trail length", "trail", "0.9"],
      ["Brush size", "brushSize", "0.1"],
      ["Swirl", "swirl", "1"],
    ] as const) {
      fireEvent.change(screen.getByRole("slider", { name }), {
        target: { value },
      });
      expect(onChange).toHaveBeenLastCalledWith({ [key]: Number(value) });
    }
  });

  it("turns the gentle currents off and on", async () => {
    const { onChange } = renderPanel({ drift: true });
    const toggle = screen.getByRole("checkbox", { name: "Gentle currents" });
    expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith({ drift: false });
  });

  it("explains and disables the currents under reduced motion", () => {
    renderPanel({ drift: true }, true);
    const toggle = screen.getByRole("checkbox", { name: "Gentle currents" });
    expect(toggle).toBeDisabled();
    expect(toggle).not.toBeChecked();
    expect(screen.getByText(/asks for reduced motion/)).toBeInTheDocument();
  });

  it("doesn't mention reduced motion otherwise", () => {
    renderPanel();
    expect(
      screen.queryByText(/asks for reduced motion/),
    ).not.toBeInTheDocument();
  });

  it("adds colour, clears the water and resets settings", async () => {
    const { onBloom, onClear, onReset } = renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Add colour" }));
    await userEvent.click(screen.getByRole("button", { name: "Clear water" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Reset settings" }),
    );
    expect(onBloom).toHaveBeenCalledOnce();
    expect(onClear).toHaveBeenCalledOnce();
    expect(onReset).toHaveBeenCalledOnce();
  });
});
