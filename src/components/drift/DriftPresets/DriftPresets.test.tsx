import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import type { Preset } from "@/lib/drift/presets";
import { DEFAULT_SETTINGS } from "@/lib/drift/settings";
import { DriftPresets } from "./DriftPresets";

const calm: Preset = {
  name: "Evening calm",
  settings: { ...DEFAULT_SETTINGS, palette: "dusk" },
};

function renderPresets(presets: Preset[] = []) {
  const handlers = { onSave: vi.fn(), onApply: vi.fn(), onDelete: vi.fn() };
  const view = render(<DriftPresets presets={presets} {...handlers} />);
  return { ...handlers, ...view };
}

const nameBox = () =>
  screen.getByRole("textbox", { name: "Name these settings" });

describe("DriftPresets", () => {
  it("has no accessibility violations", async () => {
    const { container } = renderPresets([calm]);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("can't save without a name", async () => {
    const { onSave } = renderPresets();
    const save = screen.getByRole("button", { name: "Save" });
    expect(save).toBeDisabled();
    await userEvent.type(nameBox(), "   ");
    expect(save).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves under a trimmed name, clears the box and says so", async () => {
    const { onSave } = renderPresets();
    await userEvent.type(nameBox(), "  Morning  {Enter}");
    expect(onSave).toHaveBeenCalledWith("Morning");
    expect(nameBox()).toHaveValue("");
    expect(screen.getByText("Saved “Morning”.")).toBeInTheDocument();
  });

  it("offers to update when the name is already taken", async () => {
    const { onSave } = renderPresets([calm]);
    await userEvent.type(nameBox(), "evening calm");
    await userEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(onSave).toHaveBeenCalledWith("evening calm");
    expect(screen.getByText("Updated “evening calm”.")).toBeInTheDocument();
  });

  it("lists saved settings and switches to one", async () => {
    const { onApply } = renderPresets([calm]);
    await userEvent.click(screen.getByRole("button", { name: "Evening calm" }));
    expect(onApply).toHaveBeenCalledWith(calm);
    expect(screen.getByText("Switched to “Evening calm”.")).toBeInTheDocument();
  });

  it("deletes saved settings", async () => {
    const { onDelete } = renderPresets([calm]);
    await userEvent.click(
      screen.getByRole("button", { name: "Delete “Evening calm”" }),
    );
    expect(onDelete).toHaveBeenCalledWith("Evening calm");
    expect(screen.getByText("Deleted “Evening calm”.")).toBeInTheDocument();
  });

  it("shows no list when nothing is saved", () => {
    renderPresets();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
