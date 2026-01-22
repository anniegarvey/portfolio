import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EnergyPlannerProvider } from "../../lib/energy-planner/context";
import { EnergyTypeManagerModal } from "./EnergyTypeManager";

function TestWrapper() {
  const [isOpen, setIsOpen] = React.useState(true);
  return (
    <EnergyPlannerProvider>
      <EnergyTypeManagerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </EnergyPlannerProvider>
  );
}

import React from "react";

describe("EnergyTypeManagerModal", () => {
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders energy types list when open", () => {
    render(<TestWrapper />);

    // Default types
    expect(screen.getByText("Physical")).toBeInTheDocument();
    expect(screen.getByText("Social")).toBeInTheDocument();
    expect(screen.getByText("Executive")).toBeInTheDocument();
  });

  it("opens add dialog when clicking add button", () => {
    render(<TestWrapper />);

    const addButton = screen.getByText("+ Add Energy Type");
    fireEvent.click(addButton);

    expect(
      screen.getByText("Add Energy Type", { selector: "h2" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Label")).toBeInTheDocument();
  });

  it("allows adding a new energy type", async () => {
    render(<TestWrapper />);

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
    render(<TestWrapper />);

    // Find edit button for Physical (first one)
    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);

    expect(
      screen.getByText("Edit Energy Type", { selector: "h2" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Label")).toHaveValue("Physical");
  });

  it("updates existing energy type", () => {
    render(<TestWrapper />);

    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);

    const labelInput = screen.getByLabelText("Label");
    fireEvent.change(labelInput, { target: { value: "Physical Update" } });

    const updateButton = screen.getByText("Update", { selector: "button" });
    fireEvent.click(updateButton);

    expect(screen.getByText("Physical Update")).toBeInTheDocument();
  });

  it("deletes energy type when confirmed", () => {
    render(<TestWrapper />);

    const deleteButtons = screen.getAllByText("Delete");

    fireEvent.click(deleteButtons[0]);

    // Modal should appear
    const modal = screen.getByText(
      "Are you sure you want to delete this energy type?",
    );
    expect(modal).toBeInTheDocument();

    const dialogs = screen.getAllByRole("dialog");
    const deleteDialog = dialogs.find((d) =>
      within(d).queryByText(
        "Are you sure you want to delete this energy type?",
      ),
    );
    // biome-ignore lint/style/noNonNullAssertion: Test assertion - dialog guaranteed to exist
    const confirmBtn = within(deleteDialog!).getByRole("button", {
      name: "Delete",
    });

    fireEvent.click(confirmBtn);

    // Should be gone
    expect(screen.queryByText("Physical")).not.toBeInTheDocument();
  });

  it("does not delete if not confirmed", () => {
    render(<TestWrapper />);

    const deleteButtons = screen.getAllByText("Delete");

    fireEvent.click(deleteButtons[0]);

    const dialogs = screen.getAllByRole("dialog");
    const deleteDialog = dialogs.find((d) =>
      within(d).queryByText(
        "Are you sure you want to delete this energy type?",
      ),
    );
    // biome-ignore lint/style/noNonNullAssertion: Test assertion - dialog guaranteed to exist
    const cancelBtn = within(deleteDialog!).getByRole("button", {
      name: "Cancel",
    });

    fireEvent.click(cancelBtn);

    // Item still there
    expect(screen.getByText("Physical")).toBeInTheDocument();
  });

  it("uses preset suggestions", () => {
    render(<TestWrapper />);
    fireEvent.click(screen.getByText("+ Add Energy Type"));

    const preset = screen.getByText("Executive Functioning");
    fireEvent.click(preset);

    expect(screen.getByLabelText("Label")).toHaveValue("Executive Functioning");
  });

  it("updates color when changed manually", () => {
    render(<TestWrapper />);

    // Open dialog
    fireEvent.click(screen.getByText("+ Add Energy Type"));

    // Find color input
    const colorInput = screen.getByLabelText("Color");

    fireEvent.change(colorInput, { target: { value: "#123456" } });

    expect(colorInput).toHaveValue("#123456");
    expect(screen.getByText("#123456")).toBeInTheDocument();
  });

  it("does not save when label is empty", () => {
    render(<TestWrapper />);

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
