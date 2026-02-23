import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";
import { useEnergyPlanner } from "@/lib/energy-planner/context";
import { EnergyCapacityModal } from "./EnergyCapacityModal";

// Mock dependencies
vi.mock("@/lib/energy-planner/context");

vi.mock("../EnergyTypeManager", () => ({
  EnergyTypeManagerModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="energy-type-manager">
      Manager UI
      <button data-testid="close-manager-btn" onClick={onClose} type="button">
        Close Manager
      </button>
    </div>
  ),
}));

describe("EnergyCapacityModal", () => {
  const mockSetDailyCapacity = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useEnergyPlanner as unknown as Mock).mockReturnValue({
      energyTypes: [
        { id: "physical", label: "Physical", color: "#6366f1" },
        { id: "social", label: "Social", color: "#10b981" },
        { id: "executive", label: "Executive", color: "#f59e0b" },
      ],
      dailyCapacity: { physical: 50, social: 50, executive: 50 },
      setDailyCapacity: mockSetDailyCapacity,
      currentDate: new Date(),
    });
  });

  test("renders correctly when open", () => {
    render(<EnergyCapacityModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText("Daily Energy Capacity")).toBeInTheDocument();
    expect(screen.getByText("Physical")).toBeInTheDocument();
    expect(screen.getByText("Social")).toBeInTheDocument();
    expect(screen.getByText("Executive")).toBeInTheDocument();
  });

  test("does not render when closed", () => {
    render(<EnergyCapacityModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText("Daily Energy Capacity")).not.toBeInTheDocument();
  });

  test("allows sliding inputs", () => {
    render(<EnergyCapacityModal isOpen={true} onClose={vi.fn()} />);
    const sliders = screen.getAllByRole("slider");
    expect(sliders).toHaveLength(3);

    fireEvent.change(sliders[0], { target: { value: "80" } });
    expect(mockSetDailyCapacity).toHaveBeenCalledWith({
      physical: 80,
      social: 50,
      executive: 50,
    });

    fireEvent.change(sliders[0], { target: { value: "0" } });
    expect(mockSetDailyCapacity).toHaveBeenCalledWith({
      physical: 0,
      social: 50,
      executive: 50,
    });
  });

  test("calls onClose when close button clicked", () => {
    const mockOnClose = vi.fn();
    render(<EnergyCapacityModal isOpen={true} onClose={mockOnClose} />);

    // Check for the modal close button, typically labeled "Save"
    fireEvent.click(screen.getByText("Save"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("opens and closes EnergyTypeManagerModal when Manage Energy Types button clicked", () => {
    render(<EnergyCapacityModal isOpen={true} onClose={vi.fn()} />);

    // Open it
    fireEvent.click(screen.getByText("Manage Energy Types"));
    expect(screen.getByTestId("energy-type-manager")).toBeInTheDocument();

    // Close it
    fireEvent.click(screen.getByTestId("close-manager-btn"));
    expect(screen.queryByTestId("energy-type-manager")).not.toBeInTheDocument();
  });

  test("handles missing capacity value gracefully", () => {
    (useEnergyPlanner as unknown as Mock).mockReturnValue({
      energyTypes: [{ id: "missing", label: "Missing", color: "#ccc" }],
      dailyCapacity: {}, // "missing" is undefined
      setDailyCapacity: mockSetDailyCapacity,
      currentDate: new Date(),
    });

    render(<EnergyCapacityModal isOpen={true} onClose={vi.fn()} />);
    const sliders = screen.getAllByRole("slider");
    // Since it's undefined in capacity, it should fallback to 0
    expect(sliders[0]).toHaveValue("0");

    // Changing value
    fireEvent.change(sliders[0], { target: { value: "30" } });
    expect(mockSetDailyCapacity).toHaveBeenCalledWith({
      missing: 30, // should merge successfully
    });
  });

  test("renders alternative description for future dates", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    (useEnergyPlanner as unknown as Mock).mockReturnValue({
      energyTypes: [],
      dailyCapacity: {},
      setDailyCapacity: mockSetDailyCapacity,
      currentDate: futureDate,
    });
    render(<EnergyCapacityModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Capacity for/)).toBeInTheDocument();
  });
});
