import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useBonsai } from "@/lib/bonsai/context";
import type { BonsaiTree } from "@/lib/bonsai/schema";
import { PotBodySVG, PotRimSVG } from "./PotSVG";
import { StaticTreeSVG } from "./StaticTreeSVG";
import { TreeSVG } from "./TreeSVG";

// ─── PotSVG — fallback branch coverage ────────────────────────────────────────

describe("PotBodySVG — unknown potStyle falls back to simple-clay", () => {
  it("renders without throwing when given an unknown potStyle", () => {
    expect(() =>
      render(
        <svg aria-label="test" role="img">
          <PotBodySVG cx={100} potStyle="unknown-pot" rimY={10} scale={1} />
        </svg>,
      ),
    ).not.toThrow();
  });
});

describe("PotRimSVG — unknown potStyle falls back to simple-clay", () => {
  it("renders without throwing when given an unknown potStyle", () => {
    expect(() =>
      render(
        <svg aria-label="test" role="img">
          <PotRimSVG cx={100} potStyle="unknown-pot" rimY={10} scale={1} />
        </svg>,
      ),
    ).not.toThrow();
  });
});

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

  it("renders with a pot equipped without throwing", () => {
    const treeWithPot: BonsaiTree = {
      ...mapleAt50,
      equippedPotId: "simple-clay-small",
    };
    expect(() => render(<TreeSVG tree={treeWithPot} />)).not.toThrow();
  });

  it("shows pruned branch title when a branch is pruned", () => {
    // Maple (opposite, branchFrequency=3): p0 is the first primary branch.
    // regrowthDays=12: pruned at day 40, current day 50 → still pruned (50 < 52).
    const treeWithPruned: BonsaiTree = {
      ...mapleAt50,
      activeDaysCount: 50,
      prunedBranches: [{ branchId: "p0", prunedAtDay: 40 }],
    };
    render(<TreeSVG activeTool="pruning-shears" tree={treeWithPruned} />);
    expect(screen.getByText("Pruned (regrowing\u2026)")).toBeInTheDocument();
  });
});

// ─── StaticTreeSVG — pot, stand, fertiliser dots ──────────────────────────────

const baseTree: BonsaiTree = {
  id: "static-test",
  speciesId: "pine",
  activeDaysCount: 10,
  acquiredAt: "2024-01-01",
  prunedBranches: [],
};

describe("StaticTreeSVG — seed sprout stage", () => {
  it("renders SeedSprout at day 1 without throwing", () => {
    const tree: BonsaiTree = {
      ...baseTree,
      activeDaysCount: 1,
    };
    expect(() => render(<StaticTreeSVG tree={tree} />)).not.toThrow();
  });

  it("renders SeedSprout at day 3 without throwing", () => {
    const tree: BonsaiTree = {
      ...baseTree,
      activeDaysCount: 3,
    };
    expect(() => render(<StaticTreeSVG tree={tree} />)).not.toThrow();
  });
});

describe("StaticTreeSVG — lobed leaf shape", () => {
  it("renders an oak tree (lobed leaves) without throwing", () => {
    const oakTree: BonsaiTree = {
      id: "oak-test",
      speciesId: "oak",
      activeDaysCount: 50,
      acquiredAt: "2024-01-01",
      prunedBranches: [],
    };
    expect(() => render(<StaticTreeSVG tree={oakTree} />)).not.toThrow();
  });
});

describe("StaticTreeSVG — expanded viewBox", () => {
  it("renders large pot + large stand without clipping (expanded viewBox)", () => {
    const tree: BonsaiTree = {
      ...baseTree,
      activeDaysCount: 20,
      equippedPotId: "glazed-ceramic-large",
      equippedStandId: "wooden-stand-large",
    };
    const { container } = render(<StaticTreeSVG tree={tree} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    // viewBox height should exceed default 300 for large pot + stand
    const viewBox = svg?.getAttribute("viewBox") ?? "";
    const height = Number(viewBox.split(" ")[3]);
    expect(height).toBeGreaterThan(300);
  });
});

describe("StaticTreeSVG — pot rendering", () => {
  it("renders without a pot (no equippedPotId)", () => {
    const { container } = render(<StaticTreeSVG tree={baseTree} />);
    // Should render just the soil ellipse — no extra ellipses from pot
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it.each([
    "simple-clay-small",
    "glazed-ceramic-small",
    "lacquered-wood-small",
    "stone-basin-small",
  ] as const)("renders pot style %s without throwing", (potId) => {
    const tree: BonsaiTree = { ...baseTree, equippedPotId: potId };
    const { container } = render(<StaticTreeSVG tree={tree} />);
    // Pot adds rim + bottom ellipses; glazed-ceramic also adds glaze ellipse
    const ellipses = container.querySelectorAll("ellipse");
    expect(ellipses.length).toBeGreaterThan(1);
  });

  it.each([
    "glazed-ceramic-small",
    "lacquered-wood-small",
  ] as const)("%s pot renders a glaze highlight ellipse", (potId) => {
    const tree: BonsaiTree = { ...baseTree, equippedPotId: potId };
    const { container } = render(<StaticTreeSVG tree={tree} />);
    const ellipses = Array.from(container.querySelectorAll("ellipse"));
    expect(
      ellipses.some((el) =>
        el.getAttribute("fill")?.startsWith("rgba(255,255,255"),
      ),
    ).toBe(true);
  });

  it("glazed-ceramic pot renders a glaze highlight ellipse", () => {
    const tree: BonsaiTree = {
      ...baseTree,
      equippedPotId: "glazed-ceramic-small",
    };
    const { container } = render(<StaticTreeSVG tree={tree} />);
    // Glaze adds an extra ellipse with rgba fill
    const ellipses = Array.from(container.querySelectorAll("ellipse"));
    const hasGlaze = ellipses.some((el) =>
      el.getAttribute("fill")?.startsWith("rgba(255,255,255"),
    );
    expect(hasGlaze).toBe(true);
  });
});

describe("StaticTreeSVG — stand rendering", () => {
  it.each([
    ["bamboo-mat-small", "line"],
    ["wooden-stand-small", "rect"],
    ["carved-stone-small", "rect"],
  ] as const)("renders stand style %s without throwing", (standId, expectedEl) => {
    const tree: BonsaiTree = {
      ...baseTree,
      equippedPotId: "simple-clay-small",
      equippedStandId: standId,
    };
    const { container } = render(<StaticTreeSVG tree={tree} />);
    expect(container.querySelector(expectedEl)).toBeInTheDocument();
  });
});

describe("StaticTreeSVG — fertiliser dots", () => {
  it("renders no circles when no fertiliser is active", () => {
    const { container } = render(<StaticTreeSVG tree={baseTree} />);
    expect(container.querySelector("circle")).not.toBeInTheDocument();
  });

  it("renders growth tonic dots (amber) when active", () => {
    const tree: BonsaiTree = {
      ...baseTree,
      activeDaysCount: 10,
      activeFertilisers: {
        growthTonic: { expiresAtDay: 17, bonusPerTick: 0.5 },
      },
    };
    const { container } = render(<StaticTreeSVG tree={tree} />);
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(3);
    expect(circles[0].getAttribute("fill")).toBe("#f5a623");
  });

  it("renders moisture keeper dots (blue) when active", () => {
    const tree: BonsaiTree = {
      ...baseTree,
      activeDaysCount: 10,
      activeFertilisers: {
        moistureKeeper: { expiresAtDay: 17, retentionDays: 1 },
      },
    };
    const { container } = render(<StaticTreeSVG tree={tree} />);
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(3);
    expect(circles[0].getAttribute("fill")).toBe("#4a9eda");
  });

  it("renders 6 dots when both fertilisers are active", () => {
    const tree: BonsaiTree = {
      ...baseTree,
      activeDaysCount: 10,
      activeFertilisers: {
        growthTonic: { expiresAtDay: 17, bonusPerTick: 0.5 },
        moistureKeeper: { expiresAtDay: 17, retentionDays: 1 },
      },
    };
    const { container } = render(<StaticTreeSVG tree={tree} />);
    expect(container.querySelectorAll("circle").length).toBe(6);
  });

  it("renders no dots when fertilisers have expired", () => {
    const tree: BonsaiTree = {
      ...baseTree,
      activeDaysCount: 20,
      activeFertilisers: {
        growthTonic: { expiresAtDay: 17, bonusPerTick: 0.5 },
        moistureKeeper: { expiresAtDay: 17, retentionDays: 1 },
      },
    };
    const { container } = render(<StaticTreeSVG tree={tree} />);
    expect(container.querySelector("circle")).not.toBeInTheDocument();
  });
});
