import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const oldPine: BonsaiTree = {
  ...pine,
  activeDaysCount: 10,
};

interface MockInventory {
  ownedToolIds?: string[];
  ownedPotIds?: string[];
  ownedStandIds?: string[];
  ownedFertiliserIds?: string[];
}

function mockBonsai(inventory: MockInventory = {}) {
  vi.mocked(useBonsai).mockReturnValue({
    state: {
      trees: [pine],
      inventory: {
        ownedToolIds: inventory.ownedToolIds ?? [],
        ownedPotIds: inventory.ownedPotIds ?? ["simple-clay-small"],
        ownedStandIds: inventory.ownedStandIds ?? [],
        ownedFertiliserIds: inventory.ownedFertiliserIds ?? [],
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
    mockBonsai();
    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    expect(screen.queryByLabelText("Water the tree")).not.toBeInTheDocument();
  });

  it("activates watering by default when watering can is owned", () => {
    mockBonsai({ ownedToolIds: ["watering-can"] });
    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    expect(screen.getByLabelText("Water the tree")).toBeInTheDocument();
  });
});

describe("TreeView — tree label", () => {
  it("shows species label when tree has no custom name", () => {
    mockBonsai();
    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Pine");
  });

  it("shows custom name when tree has one", () => {
    mockBonsai();
    render(
      <TreeView
        onNavigateToShop={vi.fn()}
        tree={{ ...pine, name: "My Bonsai" }}
      />,
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "My Bonsai",
    );
  });
});

describe("TreeView — water status", () => {
  it("shows not-watered status by default", () => {
    mockBonsai({ ownedToolIds: ["watering-can"] });
    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    expect(screen.getByText("Not watered today")).toBeInTheDocument();
  });

  it("shows watered status when tree was watered today", () => {
    mockBonsai({ ownedToolIds: ["watering-can"] });
    render(
      <TreeView
        onNavigateToShop={vi.fn()}
        tree={{ ...pine, lastWateredDay: pine.activeDaysCount }}
      />,
    );
    expect(screen.getByText(/Watered today/)).toBeInTheDocument();
  });

  it("shows watering hint when watering-can active and tree not watered", () => {
    mockBonsai({ ownedToolIds: ["watering-can"] });
    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    expect(screen.getByText("Click the tree to water it")).toBeInTheDocument();
  });
});

describe("TreeView — toolbar", () => {
  it("shows locked watering can button when not owned", () => {
    mockBonsai();
    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    expect(screen.getByTitle("Watering Can (locked)")).toBeInTheDocument();
  });

  it("shows watering can tool button when owned", () => {
    mockBonsai({ ownedToolIds: ["watering-can"] });
    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    expect(screen.getByTitle("Watering Can")).toBeInTheDocument();
  });

  it("shows locked pruning shears button when not owned", () => {
    mockBonsai();
    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    expect(screen.getByTitle("Pruning Shears (locked)")).toBeInTheDocument();
  });

  it("shows pruning shears tool button when owned", () => {
    mockBonsai({ ownedToolIds: ["pruning-shears"] });
    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    expect(screen.getByTitle("Pruning Shears")).toBeInTheDocument();
  });

  it("navigates to shop when locked watering can is clicked", async () => {
    const user = userEvent.setup();
    const onNavigateToShop = vi.fn();
    mockBonsai();
    render(<TreeView onNavigateToShop={onNavigateToShop} tree={pine} />);
    await user.click(screen.getByTitle("Watering Can (locked)"));
    expect(onNavigateToShop).toHaveBeenCalledWith("watering-can");
  });

  it("navigates to shop when locked pruning shears is clicked", async () => {
    const user = userEvent.setup();
    const onNavigateToShop = vi.fn();
    mockBonsai();
    render(<TreeView onNavigateToShop={onNavigateToShop} tree={pine} />);
    await user.click(screen.getByTitle("Pruning Shears (locked)"));
    expect(onNavigateToShop).toHaveBeenCalledWith("pruning-shears");
  });

  it("switches to pruning shears when clicked", async () => {
    const user = userEvent.setup();
    mockBonsai({ ownedToolIds: ["watering-can", "pruning-shears"] });
    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    await user.click(screen.getByTitle("Pruning Shears"));
    // Watering container should no longer have the watering label
    expect(screen.queryByLabelText("Water the tree")).not.toBeInTheDocument();
  });

  it("switches back to watering can when clicked after switching to pruning", async () => {
    const user = userEvent.setup();
    mockBonsai({ ownedToolIds: ["watering-can", "pruning-shears"] });
    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    await user.click(screen.getByTitle("Pruning Shears"));
    await user.click(screen.getByTitle("Watering Can"));
    expect(screen.getByLabelText("Water the tree")).toBeInTheDocument();
  });
});

describe("TreeView — keyboard watering", () => {
  it("calls waterTree on Enter key press", async () => {
    const user = userEvent.setup();
    const waterTree = vi.fn();
    vi.mocked(useBonsai).mockReturnValue({
      state: {
        trees: [pine],
        inventory: {
          ownedToolIds: ["watering-can"],
          ownedPotIds: ["simple-clay-small"],
          ownedStandIds: [],
          ownedFertiliserIds: [],
        },
      },
      waterTree,
      pruneBranch: vi.fn(),
      equipPot: vi.fn(),
      equipStand: vi.fn(),
      unequipStand: vi.fn(),
      applyFertiliser: vi.fn(),
    } as unknown as ReturnType<typeof useBonsai>);

    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    const container = screen.getByLabelText("Water the tree");
    await user.type(container, "{Enter}");
    expect(waterTree).toHaveBeenCalledWith(pine.id);
  });

  it("calls waterTree on Space key press", async () => {
    const user = userEvent.setup();
    const waterTree = vi.fn();
    vi.mocked(useBonsai).mockReturnValue({
      state: {
        trees: [pine],
        inventory: {
          ownedToolIds: ["watering-can"],
          ownedPotIds: ["simple-clay-small"],
          ownedStandIds: [],
          ownedFertiliserIds: [],
        },
      },
      waterTree,
      pruneBranch: vi.fn(),
      equipPot: vi.fn(),
      equipStand: vi.fn(),
      unequipStand: vi.fn(),
      applyFertiliser: vi.fn(),
    } as unknown as ReturnType<typeof useBonsai>);

    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    const container = screen.getByLabelText("Water the tree");
    await user.type(container, " ");
    expect(waterTree).toHaveBeenCalledWith(pine.id);
  });
});

describe("TreeView — pruning hints", () => {
  it("shows pruned branches hint when pruning-shears active and branches pruned", async () => {
    const user = userEvent.setup();
    mockBonsai({ ownedToolIds: ["watering-can", "pruning-shears"] });
    const treeWithBranches: BonsaiTree = {
      ...pine,
      prunedBranches: [
        { branchId: "branch-1", prunedAtDay: 1 },
        { branchId: "branch-2", prunedAtDay: 2 },
      ],
    };
    render(<TreeView onNavigateToShop={vi.fn()} tree={treeWithBranches} />);
    await user.click(screen.getByTitle("Pruning Shears"));
    expect(screen.getByText(/2 branches regrowing/)).toBeInTheDocument();
  });

  it("shows click-to-prune hint for old trees with pruning-shears active and no pruned branches", async () => {
    const user = userEvent.setup();
    mockBonsai({ ownedToolIds: ["watering-can", "pruning-shears"] });
    render(<TreeView onNavigateToShop={vi.fn()} tree={oldPine} />);
    await user.click(screen.getByTitle("Pruning Shears"));
    expect(
      screen.getByText("Click any branch to prune it"),
    ).toBeInTheDocument();
  });
});

describe("TreeView — accessory bar", () => {
  it("shows 'Change Pot' dropdown when pots are owned", () => {
    mockBonsai({ ownedPotIds: ["simple-clay-small"] });
    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    expect(screen.getByTitle("Change Pot")).toBeInTheDocument();
  });

  it("shows locked 'Buy a Stand' button when no stands owned", () => {
    mockBonsai({ ownedStandIds: [] });
    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    expect(screen.getByTitle("Buy a Stand")).toBeInTheDocument();
  });

  it("shows 'Change Stand' dropdown when stands are owned", () => {
    mockBonsai({ ownedStandIds: ["bamboo-mat-small"] });
    render(
      <TreeView
        onNavigateToShop={vi.fn()}
        tree={{ ...pine, equippedStandId: "bamboo-mat-small" as never }}
      />,
    );
    expect(screen.getByTitle("Change Stand")).toBeInTheDocument();
  });

  it("shows locked fertiliser button when no fertiliser owned", () => {
    mockBonsai({ ownedFertiliserIds: [] });
    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    expect(screen.getByTitle("Buy Fertiliser")).toBeInTheDocument();
  });

  it("navigates to shop when locked fertiliser is clicked", async () => {
    const user = userEvent.setup();
    const onNavigateToShop = vi.fn();
    mockBonsai({ ownedFertiliserIds: [] });
    render(<TreeView onNavigateToShop={onNavigateToShop} tree={pine} />);
    await user.click(screen.getByTitle("Buy Fertiliser"));
    expect(onNavigateToShop).toHaveBeenCalledWith("moisture-keeper-small");
  });

  it("shows 'Apply Fertiliser' dropdown when fertiliser is owned", () => {
    mockBonsai({ ownedFertiliserIds: ["growth-tonic-small"] });
    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    expect(screen.getByTitle("Apply Fertiliser")).toBeInTheDocument();
  });

  it("calls applyFertiliser when fertiliser dropdown item is selected", async () => {
    const user = userEvent.setup();
    const applyFertiliser = vi.fn();
    vi.mocked(useBonsai).mockReturnValue({
      state: {
        trees: [pine],
        inventory: {
          ownedToolIds: [],
          ownedPotIds: ["simple-clay-small"],
          ownedStandIds: [],
          ownedFertiliserIds: ["growth-tonic-small"],
        },
      },
      waterTree: vi.fn(),
      pruneBranch: vi.fn(),
      equipPot: vi.fn(),
      equipStand: vi.fn(),
      unequipStand: vi.fn(),
      applyFertiliser,
    } as unknown as ReturnType<typeof useBonsai>);

    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    await user.click(screen.getByTitle("Apply Fertiliser"));
    const item = await screen.findByText(/Growth Tonic/);
    await user.click(item);
    expect(applyFertiliser).toHaveBeenCalledWith(pine.id, "growth-tonic-small");
  });

  it("navigates to shop via fertiliser dropdown 'Buy more' item", async () => {
    const user = userEvent.setup();
    const onNavigateToShop = vi.fn();
    mockBonsai({ ownedFertiliserIds: ["growth-tonic-small"] });
    render(<TreeView onNavigateToShop={onNavigateToShop} tree={pine} />);
    await user.click(screen.getByTitle("Apply Fertiliser"));
    const buyMore = await screen.findByText("Buy more in shop");
    await user.click(buyMore);
    expect(onNavigateToShop).toHaveBeenCalledWith("moisture-keeper-small");
  });
});

describe("TreeView — active fertiliser status", () => {
  it("shows nothing when no active fertilisers", () => {
    mockBonsai();
    render(<TreeView onNavigateToShop={vi.fn()} tree={pine} />);
    expect(screen.queryByText(/Growth Tonic/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Moisture Keeper/)).not.toBeInTheDocument();
  });

  it("shows growth tonic status when active", () => {
    mockBonsai();
    const treeWithTonic: BonsaiTree = {
      ...pine,
      activeDaysCount: 5,
      activeFertilisers: { growthTonic: { expiresAtDay: 10, bonusPerTick: 1 } },
    };
    render(<TreeView onNavigateToShop={vi.fn()} tree={treeWithTonic} />);
    expect(screen.getByText(/Growth Tonic/)).toBeInTheDocument();
    expect(screen.getByText(/5 days left/)).toBeInTheDocument();
  });

  it("shows moisture keeper status when active", () => {
    mockBonsai();
    const treeWithMoisture: BonsaiTree = {
      ...pine,
      activeDaysCount: 2,
      activeFertilisers: {
        moistureKeeper: { expiresAtDay: 8, retentionDays: 2 },
      },
    };
    render(<TreeView onNavigateToShop={vi.fn()} tree={treeWithMoisture} />);
    expect(screen.getByText(/Moisture Keeper/)).toBeInTheDocument();
    expect(screen.getByText(/6 days left/)).toBeInTheDocument();
  });
});
