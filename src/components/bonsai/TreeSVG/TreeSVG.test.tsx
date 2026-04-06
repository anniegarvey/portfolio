import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useBonsai } from "@/lib/bonsai/context";
import type { BonsaiTree } from "@/lib/bonsai/schema";
import { TreeSVG } from "./TreeSVG";

vi.mock("@/lib/bonsai/context", () => ({
  useBonsai: vi.fn(),
}));

const mockPruneBranch = vi.fn();

vi.mocked(useBonsai).mockReturnValue({
  pruneBranch: mockPruneBranch,
} as unknown as ReturnType<typeof useBonsai>);

const mapleAt50: BonsaiTree = {
  id: "test-maple",
  speciesId: "maple",
  activeDaysCount: 50,
  acquiredAt: "2024-01-01",
  prunedBranches: [],
};

describe("TreeSVG", () => {
  it("renders an SVG element", () => {
    render(<TreeSVG tree={mapleAt50} />);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders with the correct aria-label", () => {
    render(<TreeSVG tree={mapleAt50} />);
    expect(
      screen.getByLabelText(/maple bonsai tree, day 50/i),
    ).toBeInTheDocument();
  });

  it("renders no interactive paths when activeTool is undefined", () => {
    render(<TreeSVG tree={mapleAt50} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders interactive branch buttons when activeTool is pruning-shears", () => {
    render(<TreeSVG activeTool="pruning-shears" tree={mapleAt50} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("clicking a branch calls pruneBranch with the correct ids", () => {
    render(<TreeSVG activeTool="pruning-shears" tree={mapleAt50} />);
    const firstButton = screen.getAllByRole("button")[0];
    fireEvent.click(firstButton);
    expect(mockPruneBranch).toHaveBeenCalledWith(
      mapleAt50.id,
      expect.any(String),
    );
  });

  it("pressing Enter on a branch calls pruneBranch", () => {
    render(<TreeSVG activeTool="pruning-shears" tree={mapleAt50} />);
    const firstButton = screen.getAllByRole("button")[0];
    fireEvent.keyDown(firstButton, { key: "Enter" });
    expect(mockPruneBranch).toHaveBeenCalled();
  });

  it("does not call pruneBranch when Enter is not pressed", () => {
    mockPruneBranch.mockClear();
    render(<TreeSVG activeTool="pruning-shears" tree={mapleAt50} />);
    const firstButton = screen.getAllByRole("button")[0];
    fireEvent.keyDown(firstButton, { key: "Space" });
    expect(mockPruneBranch).not.toHaveBeenCalled();
  });

  it("renders with cropTop without throwing", () => {
    expect(() => render(<TreeSVG cropTop tree={mapleAt50} />)).not.toThrow();
  });

  it("clicking the line hit-target also calls pruneBranch", () => {
    mockPruneBranch.mockClear();
    render(<TreeSVG activeTool="pruning-shears" tree={mapleAt50} />);
    // The <line> hit-target has tabIndex={-1} — still accessible but not tab-reachable.
    // getAllByRole picks it up alongside the <path> buttons.
    const allButtons = screen.getAllByRole("button");
    // Click the second role="button" element (the <line> hit-target for first branch)
    if (allButtons.length > 1) {
      fireEvent.click(allButtons[1]);
      expect(mockPruneBranch).toHaveBeenCalled();
    }
  });

  it("pressing Enter on the line hit-target also calls pruneBranch", () => {
    mockPruneBranch.mockClear();
    render(<TreeSVG activeTool="pruning-shears" tree={mapleAt50} />);
    const allButtons = screen.getAllByRole("button");
    if (allButtons.length > 1) {
      fireEvent.keyDown(allButtons[1], { key: "Enter" });
      expect(mockPruneBranch).toHaveBeenCalled();
    }
  });

  it("shows pruned branch title when a branch is pruned", () => {
    // Branch IDs are generated as L0, R0, L1, R1... by treeGenerator.
    // Maple regrowthDays=12: pruned at day 40, current day 50 → still pruned (50 < 52).
    const treeWithPruned: BonsaiTree = {
      ...mapleAt50,
      activeDaysCount: 50,
      prunedBranches: [{ branchId: "L0", prunedAtDay: 40 }],
    };
    render(<TreeSVG activeTool="pruning-shears" tree={treeWithPruned} />);
    expect(screen.getByText("Pruned (regrowing\u2026)")).toBeInTheDocument();
  });
});
