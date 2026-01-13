import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../lib/energy-planner/context";
import { EnergyTypeManager } from "./EnergyTypeManager";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
);

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple cases
describe("EnergyTypeManager", () => {
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders energy types list", () => {
    render(<EnergyTypeManager />, { wrapper });

    expect(screen.getByText("Energy Types")).toBeInTheDocument();
    // Default types
    expect(screen.getByText("Physical")).toBeInTheDocument();
    expect(screen.getByText("Social")).toBeInTheDocument();
    expect(screen.getByText("Executive")).toBeInTheDocument();
  });

  it("opens add dialog when clicking add button", () => {
    render(<EnergyTypeManager />, { wrapper });

    const addButton = screen.getByText("+ Add Energy Type");
    fireEvent.click(addButton);

    expect(
      screen.getByText("Add Energy Type", { selector: "h2" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Label")).toBeInTheDocument();
  });

  it("allows adding a new energy type", async () => {
    // We can't easily verify the context update without a spy in the provider,
    // but we can check if it appears in the list if the provider is working properly.
    // Since context is real, it should update.

    render(<EnergyTypeManager />, { wrapper });

    fireEvent.click(screen.getByText("+ Add Energy Type"));

    const labelInput = screen.getByLabelText("Label");
    fireEvent.change(labelInput, { target: { value: "Creative" } });

    const saveButton = screen.getByText("Add", { selector: "button" });
    fireEvent.click(saveButton);

    // Dialog should close
    expect(
      screen.queryByText("Add Energy Type", { selector: "h2" }),
    ).not.toBeInTheDocument();

    // New type should appear
    expect(screen.getByText("Creative")).toBeInTheDocument();
  });

  it("opens edit dialog with existing values", () => {
    render(<EnergyTypeManager />, { wrapper });

    // Find edit button for Physical (first one)
    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);

    expect(
      screen.getByText("Edit Energy Type", { selector: "h2" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Label")).toHaveValue("Physical");
  });

  it("updates existing energy type", () => {
    render(<EnergyTypeManager />, { wrapper });

    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);

    const labelInput = screen.getByLabelText("Label");
    fireEvent.change(labelInput, { target: { value: "Physical Update" } });

    const updateButton = screen.getByText("Update", { selector: "button" });
    fireEvent.click(updateButton);

    expect(screen.getByText("Physical Update")).toBeInTheDocument();
  });

  it("deletes energy type when confirmed", () => {
    render(<EnergyTypeManager />, { wrapper });

    const deleteButtons = screen.getAllByText("Delete");

    fireEvent.click(deleteButtons[0]);

    // Modal should appear
    const modal = screen.getByText(
      "Are you sure you want to delete this energy type?",
    );
    expect(modal).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");
    const confirmBtn = within(dialog).getByRole("button", { name: "Delete" });

    fireEvent.click(confirmBtn);

    // Should be gone
    expect(screen.queryByText("Physical")).not.toBeInTheDocument();
  });

  it("does not delete if not confirmed", () => {
    render(<EnergyTypeManager />, { wrapper });

    const deleteButtons = screen.getAllByText("Delete");

    fireEvent.click(deleteButtons[0]);

    const dialog = screen.getByRole("dialog");
    const cancelBtn = within(dialog).getByRole("button", { name: "Cancel" });

    fireEvent.click(cancelBtn);

    // Modal closed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Item still there
    expect(screen.getByText("Physical")).toBeInTheDocument();
  });

  it("uses preset suggestions", () => {
    render(<EnergyTypeManager />, { wrapper });
    fireEvent.click(screen.getByText("+ Add Energy Type"));

    const preset = screen.getByText("Executive Functioning");
    fireEvent.click(preset);

    expect(screen.getByLabelText("Label")).toHaveValue("Executive Functioning");
    // Color value check might be tricky depending on browser format (hex vs rgb), skipping strict color check
  });

  it("updates color when changed manually", () => {
    render(<EnergyTypeManager />, { wrapper });

    // Open dialog
    fireEvent.click(screen.getByText("+ Add Energy Type"));

    // Find color input
    // It has type="color", usually label is "Color"
    const colorInput = screen.getByLabelText("Color");

    fireEvent.change(colorInput, { target: { value: "#123456" } });

    expect(colorInput).toHaveValue("#123456");
    expect(screen.getByText("#123456")).toBeInTheDocument(); // The hex code is displayed next to it
    expect(colorInput).toHaveValue("#123456");
    expect(screen.getByText("#123456")).toBeInTheDocument(); // The hex code is displayed next to it
  });

  it("does not save when label is empty", () => {
    render(<EnergyTypeManager />, { wrapper });

    // Open add dialog
    fireEvent.click(screen.getByText("+ Add Energy Type"));

    // Click save without entering label
    const saveButton = screen.getByText("Add", { selector: "button" });
    fireEvent.click(saveButton);

    // Dialog should remain open
    expect(
      screen.getByText("Add Energy Type", { selector: "h2" }),
    ).toBeInTheDocument();
  });
});
