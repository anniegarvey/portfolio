import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZoneManagerModal } from ".";

vi.mock("@dnd-kit/core", async () => {
  const actual =
    await vi.importActual<typeof import("@dnd-kit/core")>("@dnd-kit/core");
  return {
    ...actual,
    DndContext: ({
      children,
      onDragEnd,
    }: {
      children: React.ReactNode;
      onDragEnd: (event: {
        active: { id: string };
        over: { id: string };
      }) => void;
    }) => (
      <div>
        <button
          data-testid="dnd-trigger"
          onClick={() =>
            onDragEnd({ active: { id: "z1" }, over: { id: "z2" } })
          }
          type="button"
        >
          Trigger Drag
        </button>
        {children}
      </div>
    ),
  };
});

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
    const input = screen.getByPlaceholderText("e.g., Morning Focus");
    await user.type(input, "Evening");

    // Submit
    await user.click(screen.getByRole("button", { name: "Create Zone" }));

    expect(mockOnAddZone).toHaveBeenCalledWith({
      name: "Evening",
      description: "",
      order: 0,
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
    expect(
      screen.getByPlaceholderText("e.g., Morning Focus"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.queryByPlaceholderText("e.g., Morning Focus"),
    ).not.toBeInTheDocument();
    expect(mockOnAddZone).not.toHaveBeenCalled();
  });

  it("removes a zone with confirmation", async () => {
    const user = userEvent.setup();
    // Mock confirm - logic changed to modal but we keep existing structure if needed
    // Actually the component doesn't use window.confirm anymore, so this spy is useless but harmless
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
    const deleteButton = screen.getByTitle("Remove Morning");
    await user.click(deleteButton);

    // The modal confirmation logic in ZoneManagerModal uses a custom Modal
    const confirmDeleteBtn = screen.getByRole("button", { name: "Delete" });
    await user.click(confirmDeleteBtn);

    expect(mockOnRemoveZone).toHaveBeenCalledWith("z1");
  });

  it("cancels removing a zone", async () => {
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

    // Click delete
    const deleteButton = screen.getByTitle("Remove Morning");
    await user.click(deleteButton);

    // Check modal exists
    expect(screen.getByText("Delete Zone?")).toBeInTheDocument();

    // Click cancel
    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelBtn);

    expect(screen.queryByText("Delete Zone?")).not.toBeInTheDocument();
    expect(mockOnRemoveZone).not.toHaveBeenCalled();
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

    const saveBtn = screen.getByRole("button", { name: "Save Changes" });
    await user.click(saveBtn);

    expect(mockOnUpdateZone).toHaveBeenCalledWith({
      ...defaultZones[0],
      name: "Breakfast",
      description: "",
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
    await user.click(screen.getByRole("button", { name: "Create Zone" }));

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

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
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

    const saveBtn = screen.getByRole("button", { name: "Save Changes" });
    await user.click(saveBtn);

    expect(mockOnUpdateZone).not.toHaveBeenCalled();
  });

  it("reorders zones", async () => {
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

    // Trigger drag event via our mock
    await user.click(screen.getByTestId("dnd-trigger"));

    expect(mockOnReorderZones).toHaveBeenCalled();
    // arrayMove(zones, 0, 1) should swap them
    // zones: Morning(0), Afternoon(1)
    // swap 0 and 1 -> Afternoon, Morning
    const expectedOrder = [defaultZones[1], defaultZones[0]];
    expect(mockOnReorderZones).toHaveBeenCalledWith(expectedOrder);
  });
});
