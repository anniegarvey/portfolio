import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useBonsai } from "@/lib/bonsai/context";
import type { BonsaiTree } from "@/lib/bonsai/schema";
import { TreeView } from "./TreeView";

vi.mock("@/lib/bonsai/context", () => ({
  useBonsai: vi.fn(),
}));

const pine: BonsaiTree = {
  id: "test-pine",
  speciesId: "pine",
  activeDaysCount: 1,
  acquiredAt: "2024-01-01",
  prunedBranches: [],
  equippedPotId: "simple-clay-small",
};

function mockBonsai(ownedToolIds: string[]) {
  vi.mocked(useBonsai).mockReturnValue({
    state: {
      trees: [pine],
      inventory: {
        ownedToolIds,
        ownedPotIds: ["simple-clay-small"],
        ownedStandIds: [],
        ownedFertiliserIds: [],
        ownedSpeciesIds: [],
      },
    },
    waterTree: vi.fn(),
    pruneBranch: vi.fn(),
    equipPot: vi.fn(),
    equipStand: vi.fn(),
    unequipStand: vi.fn(),
    applyFertiliser: vi.fn(),
  } as unknown as ReturnType<typeof useBonsai>);
}

describe("TreeView — initial tool selection", () => {
  it("does not activate watering when no tools are owned", () => {
    mockBonsai([]);
    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    // SVGContainer only gets aria-label "Water the tree" when activeTool === "watering-can"
    expect(screen.queryByLabelText("Water the tree")).not.toBeInTheDocument();
  });

  it("activates watering by default when watering can is owned", () => {
    mockBonsai(["watering-can"]);
    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    expect(screen.getByLabelText("Water the tree")).toBeInTheDocument();
  });
});
