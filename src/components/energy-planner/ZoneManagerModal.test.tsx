import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZoneManagerModal } from "./ZoneManagerModal";

describe("ZoneManagerModal", () => {
  const mockOnClose = vi.fn();
  const mockOnAddZone = vi.fn();
  const mockOnUpdateZone = vi.fn();
  const mockOnRemoveZone = vi.fn();
  const mockOnReorderZones = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const defaultZones = [
    { id: "z1", name: "Morning", order: 0 },
    { id: "z2", name: "Afternoon", order: 1 },
  ];

  it("renders when open", () => {
    render(
      <ZoneManagerModal
        isOpen={true}
        onAddZone={mockOnAddZone}
        onClose={mockOnClose}
        onRemoveZone={mockOnRemoveZone}
        onReorderZones={mockOnReorderZones}
        onUpdateZone={mockOnUpdateZone}
        zones={defaultZones}
      />,
    );
    expect(screen.getByText("Manage Zones")).toBeInTheDocument();
    expect(screen.getByText("Morning")).toBeInTheDocument();
    expect(screen.getByText("Afternoon")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <ZoneManagerModal
        isOpen={false}
        onAddZone={mockOnAddZone}
        onClose={mockOnClose}
        onRemoveZone={mockOnRemoveZone}
        onReorderZones={mockOnReorderZones}
        onUpdateZone={mockOnUpdateZone}
        zones={defaultZones}
      />,
    );
    expect(screen.queryByText("Manage Zones")).not.toBeInTheDocument();
  });

  it("adds a new zone", async () => {
    const user = userEvent.setup();
    render(
      <ZoneManagerModal
        isOpen={true}
        onAddZone={mockOnAddZone}
        onClose={mockOnClose}
        onRemoveZone={mockOnRemoveZone}
        onReorderZones={mockOnReorderZones}
        onUpdateZone={mockOnUpdateZone}
        zones={defaultZones}
      />,
    );

    // Click Add Zone button
    await user.click(screen.getByText("Add Zone"));

    // Type name
    const input = screen.getByPlaceholderText("New zone name...");
    await user.type(input, "Evening");

    // Submit
    await user.click(screen.getByText("Add"));

    expect(mockOnAddZone).toHaveBeenCalledWith({
      name: "Evening",
      order: 2,
    });
  });

  it("cancels adding a new zone", async () => {
    const user = userEvent.setup();
    render(
      <ZoneManagerModal
        isOpen={true}
        onAddZone={mockOnAddZone}
        onClose={mockOnClose}
        onRemoveZone={mockOnRemoveZone}
        onReorderZones={mockOnReorderZones}
        onUpdateZone={mockOnUpdateZone}
        zones={defaultZones}
      />,
    );

    await user.click(screen.getByText("Add Zone"));
    expect(screen.getByPlaceholderText("New zone name...")).toBeInTheDocument();

    await user.click(screen.getByText("Cancel"));
    expect(
      screen.queryByPlaceholderText("New zone name..."),
    ).not.toBeInTheDocument();
    expect(mockOnAddZone).not.toHaveBeenCalled();
  });

  it("removes a zone with confirmation", async () => {
    const user = userEvent.setup();
    // Mock confirm
    vi.spyOn(window, "confirm").mockImplementation(() => true);

    render(
      <ZoneManagerModal
        isOpen={true}
        onAddZone={mockOnAddZone}
        onClose={mockOnClose}
        onRemoveZone={mockOnRemoveZone}
        onReorderZones={mockOnReorderZones}
        onUpdateZone={mockOnUpdateZone}
        zones={defaultZones}
      />,
    );

    // Find delete button for Morning (first one)
    // The trash icon is inside a button.
    // We can rely on button role + structure or title "Remove zone"?
    // The component has title="Remove zone"
    const deleteButtons = screen.getAllByTitle("Remove zone");
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnRemoveZone).toHaveBeenCalledWith("z1");
  });

  it("disables remove button if only one zone remains", async () => {
    render(
      <ZoneManagerModal
        isOpen={true}
        onAddZone={mockOnAddZone}
        onClose={mockOnClose}
        onRemoveZone={mockOnRemoveZone}
        onReorderZones={mockOnReorderZones}
        onUpdateZone={mockOnUpdateZone}
        zones={[{ id: "z1", name: "Only One", order: 0 }]}
      />,
    );

    const deleteBtn = screen.getByTitle("Cannot remove last zone");
    expect(deleteBtn).toBeDisabled();
  });

  it("edits a zone name", async () => {
    const user = userEvent.setup();
    render(
      <ZoneManagerModal
        isOpen={true}
        onAddZone={mockOnAddZone}
        onClose={mockOnClose}
        onRemoveZone={mockOnRemoveZone}
        onReorderZones={mockOnReorderZones}
        onUpdateZone={mockOnUpdateZone}
        zones={defaultZones}
      />,
    );

    const editBtn = screen.getByLabelText("Edit Morning");
    await user.click(editBtn);

    const input = screen.getByDisplayValue("Morning");
    await user.clear(input);
    await user.type(input, "Breakfast");

    const saveBtn = screen.getByTitle("Save");
    await user.click(saveBtn);

    expect(mockOnUpdateZone).toHaveBeenCalledWith({
      ...defaultZones[0],
      name: "Breakfast",
    });
  });

  it("does not add a zone with empty name", async () => {
    const user = userEvent.setup();
    render(
      <ZoneManagerModal
        isOpen={true}
        onAddZone={mockOnAddZone}
        onClose={mockOnClose}
        onRemoveZone={mockOnRemoveZone}
        onReorderZones={mockOnReorderZones}
        onUpdateZone={mockOnUpdateZone}
        zones={defaultZones}
      />,
    );

    await user.click(screen.getByText("Add Zone"));
    await user.click(screen.getByText("Add"));

    expect(mockOnAddZone).not.toHaveBeenCalled();
  });

  it("cancels editing a zone", async () => {
    const user = userEvent.setup();
    render(
      <ZoneManagerModal
        isOpen={true}
        onAddZone={mockOnAddZone}
        onClose={mockOnClose}
        onRemoveZone={mockOnRemoveZone}
        onReorderZones={mockOnReorderZones}
        onUpdateZone={mockOnUpdateZone}
        zones={defaultZones}
      />,
    );

    const editBtn = screen.getByLabelText("Edit Morning");
    await user.click(editBtn);

    const input = screen.getByDisplayValue("Morning");
    await user.clear(input);
    await user.type(input, "Changed");

    const cancelBtn = screen.getByTitle("Cancel");
    await user.click(cancelBtn);

    expect(screen.getByText("Morning")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Changed")).not.toBeInTheDocument();
    expect(mockOnUpdateZone).not.toHaveBeenCalled();
  });

  it("does not save edit with empty name", async () => {
    const user = userEvent.setup();
    render(
      <ZoneManagerModal
        isOpen={true}
        onAddZone={mockOnAddZone}
        onClose={mockOnClose}
        onRemoveZone={mockOnRemoveZone}
        onReorderZones={mockOnReorderZones}
        onUpdateZone={mockOnUpdateZone}
        zones={defaultZones}
      />,
    );

    const editBtn = screen.getByLabelText("Edit Morning");
    await user.click(editBtn);

    const input = screen.getByDisplayValue("Morning");
    await user.clear(input);

    const saveBtn = screen.getByTitle("Save");
    await user.click(saveBtn);

    expect(mockOnUpdateZone).not.toHaveBeenCalled();
  });
});
