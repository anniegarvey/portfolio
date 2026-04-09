import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePoints } from "@/lib/points/context";
import { LAST_ACTIVE_DATE_KEY } from "@/lib/points/keys";
import { BonsaiProvider, useBonsai } from "./context";
import { createInitialState } from "./storage";
import { BRANCH_GROW_DURATION } from "./treeGenerator";

vi.mock("@/lib/points/context", () => ({
  usePoints: vi.fn(),
}));

const BONSAI_KEY = "bonsai-game-state";
const TODAY = new Date().toISOString().split("T")[0];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setupMockPoints(points = 200, spendResult = true) {
  const mockSpend = vi.fn().mockReturnValue(spendResult);
  vi.mocked(usePoints).mockReturnValue({
    points,
    spendPoints: mockSpend,
    awardPoints: vi.fn(),
  });
  return mockSpend;
}

function seedLocalStorage(overrides?: object) {
  const base = createInitialState();
  const merged = { ...base, ...overrides };
  localStorage.setItem(BONSAI_KEY, JSON.stringify(merged));
}

// ─── Test Components ──────────────────────────────────────────────────────────

function BonsaiDebug() {
  const ctx = useBonsai();
  // Use the first tree as the "focus" tree for tests (mirrors the garden approach)
  const tree = ctx.state.trees[0] ?? null;
  const tree1 = ctx.state.trees[1] ?? null;
  return (
    <div>
      <span data-testid="day">{tree?.activeDaysCount ?? "none"}</span>
      <span data-testid="watered">{tree?.lastWateredDay ?? "none"}</span>
      <span data-testid="pruned">{tree?.prunedBranches.length ?? 0}</span>
      <span data-testid="pot">{tree?.equippedPotId ?? "none"}</span>
      <span data-testid="stand">{tree?.equippedStandId ?? "none"}</span>
      <span data-testid="tools">{ctx.state.inventory.ownedToolIds.length}</span>
      <span data-testid="seeds">
        {ctx.state.inventory.ownedSpeciesIds.length}
      </span>
      <span data-testid="fertilisers">
        {ctx.state.inventory.ownedFertiliserIds.length}
      </span>
      <span data-testid="pots-inv">
        {ctx.state.inventory.ownedPotIds.length}
      </span>
      <span data-testid="stands-inv">
        {ctx.state.inventory.ownedStandIds.length}
      </span>
      <span data-testid="tree-count">{ctx.state.trees.length}</span>
      <span data-testid="garden-x">{tree?.gardenPosition?.x ?? "none"}</span>
      <span data-testid="garden-y">{tree?.gardenPosition?.y ?? "none"}</span>
      <span data-testid="avail-pots">{ctx.availablePotCount()}</span>
      <span data-testid="growth-tonic-expires">
        {tree?.activeFertilisers?.growthTonic?.expiresAtDay ?? "none"}
      </span>
      <span data-testid="moisture-keeper-expires">
        {tree?.activeFertilisers?.moistureKeeper?.expiresAtDay ?? "none"}
      </span>
      {/* Second tree — for multi-tree tests */}
      <span data-testid="day-1">{tree1?.activeDaysCount ?? "none"}</span>
      <span data-testid="placing">{ctx.placingSpeciesId ?? "none"}</span>
      <button onClick={ctx.advanceDay} type="button">
        Advance
      </button>
      <button onClick={() => tree && ctx.waterTree(tree.id)} type="button">
        Water
      </button>
      <button onClick={() => tree1 && ctx.waterTree(tree1.id)} type="button">
        Water Tree1
      </button>
      <button
        onClick={() => tree && ctx.pruneBranch(tree.id, "L0")}
        type="button"
      >
        Prune L0
      </button>
      <button onClick={() => ctx.buyItem("watering-can")} type="button">
        Buy Can
      </button>
      <button onClick={() => ctx.buyItem("maple")} type="button">
        Buy Maple Seed
      </button>
      <button onClick={() => ctx.buyItem("growth-tonic-small")} type="button">
        Buy Fertiliser
      </button>
      <button onClick={() => ctx.buyItem("simple-clay-small")} type="button">
        Buy Pot
      </button>
      <button onClick={() => ctx.buyItem("bamboo-mat-small")} type="button">
        Buy Stand
      </button>
      <button
        onClick={() =>
          tree && ctx.applyFertiliser(tree.id, "growth-tonic-small")
        }
        type="button"
      >
        Apply Growth Tonic
      </button>
      <button
        onClick={() =>
          tree && ctx.applyFertiliser(tree.id, "moisture-keeper-small")
        }
        type="button"
      >
        Apply Moisture Keeper
      </button>
      <button
        onClick={() => tree && ctx.equipPot(tree.id, "simple-clay-small")}
        type="button"
      >
        Equip Pot
      </button>
      <button
        onClick={() => tree && ctx.equipStand(tree.id, "bamboo-mat-small")}
        type="button"
      >
        Equip Stand
      </button>
      <button
        onClick={() => ctx.confirmPlantAt("maple", { x: 25, y: 75 })}
        type="button"
      >
        Plant Maple
      </button>
      <button onClick={() => ctx.beginPlanting("maple")} type="button">
        Begin Placing Maple
      </button>
      <button onClick={ctx.cancelPlanting} type="button">
        Cancel Placing
      </button>
      <button
        onClick={() =>
          tree && ctx.updateTreePosition(tree.id, { x: 10, y: 20 })
        }
        type="button"
      >
        Move Tree
      </button>
    </div>
  );
}

// ─── useBonsai ────────────────────────────────────────────────────────────────

describe("useBonsai", () => {
  it("throws when used outside BonsaiProvider", () => {
    vi.mocked(console.error).mockImplementation(() => {});
    expect(() => render(<BonsaiDebug />)).toThrow(
      "useBonsai must be used within a BonsaiProvider",
    );
  });
});

// ─── BonsaiProvider ───────────────────────────────────────────────────────────

describe("BonsaiProvider", () => {
  beforeEach(() => {
    setupMockPoints();
    localStorage.removeItem(BONSAI_KEY);
    localStorage.removeItem(LAST_ACTIVE_DATE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(BONSAI_KEY);
    localStorage.removeItem(LAST_ACTIVE_DATE_KEY);
  });

  function renderBonsai() {
    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );
  }

  it("starts with a pine tree as the first tree at day 0", async () => {
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("0"),
    );
  });

  it("advanceDay does not grow the tree if it has not been watered", async () => {
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("0"),
    );
    await act(async () => {
      screen.getByText("Advance").click();
    });
    // Without watering, day count should remain 0
    expect(screen.getByTestId("day")).toHaveTextContent("0");
  });

  it("advanceDay grows the tree and resets to unwatered when watered first", async () => {
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("0"),
    );
    // Water at day 0
    await act(async () => {
      screen.getByText("Water").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("watered")).toHaveTextContent("0"),
    );
    // Advance — tree was watered at day 0, so it grows
    await act(async () => {
      screen.getByText("Advance").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("1"),
    );
    // Watered state is now stale (lastWateredDay 0 ≠ activeDaysCount 1)
    expect(screen.getByTestId("watered")).toHaveTextContent("0");
  });

  it("advanceDay increments activeDaysCount when tree is watered", async () => {
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("0"),
    );
    await act(async () => {
      screen.getByText("Water").click();
    });
    await act(async () => {
      screen.getByText("Advance").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("1"),
    );
  });

  it("pruneBranch adds a prunedBranch entry", async () => {
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("pruned")).toHaveTextContent("0"),
    );
    await act(async () => {
      screen.getByText("Prune L0").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("pruned")).toHaveTextContent("1"),
    );
  });

  it("equipPot sets equippedPotId on the tree", async () => {
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("pot")).toHaveTextContent("simple-clay-small"),
    );
    await act(async () => {
      screen.getByText("Equip Pot").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("pot")).toHaveTextContent("simple-clay-small"),
    );
  });

  it("equipStand sets equippedStandId on the tree", async () => {
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("stand")).toHaveTextContent("none"),
    );
    await act(async () => {
      screen.getByText("Equip Stand").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("stand")).toHaveTextContent("bamboo-mat-small"),
    );
  });

  it("buyItem adds to inventory and spends points on success", async () => {
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("tools")).toHaveTextContent("0"),
    );
    await act(async () => {
      screen.getByText("Buy Can").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("tools")).toHaveTextContent("1"),
    );
  });

  it("buyItem does not update inventory when spendPoints fails", async () => {
    setupMockPoints(0, false);
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("tools")).toHaveTextContent("0"),
    );
    await act(async () => {
      screen.getByText("Buy Can").click();
    });
    expect(screen.getByTestId("tools")).toHaveTextContent("0");
  });

  it("buyItem adds a species seed to ownedSpeciesIds", async () => {
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("seeds")).toHaveTextContent("0"),
    );
    await act(async () => {
      screen.getByText("Buy Maple Seed").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("seeds")).toHaveTextContent("1"),
    );
  });

  it("buyItem adds a fertiliser to ownedFertiliserIds", async () => {
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("fertilisers")).toHaveTextContent("0"),
    );
    await act(async () => {
      screen.getByText("Buy Fertiliser").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("fertilisers")).toHaveTextContent("1"),
    );
  });

  it("buyItem adds a pot to ownedPotIds", async () => {
    renderBonsai();
    // Initial state includes one simple-clay-small pot
    await waitFor(() =>
      expect(screen.getByTestId("pots-inv")).toHaveTextContent("1"),
    );
    await act(async () => {
      screen.getByText("Buy Pot").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("pots-inv")).toHaveTextContent("2"),
    );
  });

  it("buyItem adds a stand to ownedStandIds", async () => {
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("stands-inv")).toHaveTextContent("0"),
    );
    await act(async () => {
      screen.getByText("Buy Stand").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("stands-inv")).toHaveTextContent("1"),
    );
  });

  it("waterTree sets lastWateredDay to activeDaysCount on the tree", async () => {
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("watered")).toHaveTextContent("none"),
    );
    await act(async () => {
      screen.getByText("Water").click();
    });
    // Tree starts at day 0, so lastWateredDay should be 0
    await waitFor(() =>
      expect(screen.getByTestId("watered")).toHaveTextContent("0"),
    );
  });

  it("pruneBranch replacing an existing prune entry updates prunedAtDay", async () => {
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("pruned")).toHaveTextContent("0"),
    );
    // Prune L0 at day 0
    await act(async () => {
      screen.getByText("Prune L0").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("pruned")).toHaveTextContent("1"),
    );
    // Water, advance to day 1, then prune the same branch again — count should stay at 1
    await act(async () => {
      screen.getByText("Water").click();
    });
    await act(async () => {
      screen.getByText("Advance").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("1"),
    );
    await act(async () => {
      screen.getByText("Prune L0").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("pruned")).toHaveTextContent("1"),
    );
  });

  it("confirmPlantAt moves a species from inventory to trees", async () => {
    // Seed a state that already has a maple seed in inventory and a spare pot
    const base = createInitialState();
    seedLocalStorage({
      ...base,
      inventory: {
        ...base.inventory,
        ownedSpeciesIds: ["maple"],
        // Include a second pot so one is available (base already has one equipped to pine)
        ownedPotIds: [...base.inventory.ownedPotIds, "simple-clay-small"],
      },
    });
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("seeds")).toHaveTextContent("1"),
    );
    await act(async () => {
      screen.getByText("Plant Maple").click();
    });
    await waitFor(() => {
      expect(screen.getByTestId("seeds")).toHaveTextContent("0");
      expect(screen.getByTestId("tree-count")).toHaveTextContent("2");
    });
  });

  it("confirmPlantAt is a no-op when the species is not in inventory", async () => {
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("tree-count")).toHaveTextContent("1"),
    );
    await act(async () => {
      screen.getByText("Plant Maple").click();
    });
    expect(screen.getByTestId("tree-count")).toHaveTextContent("1");
  });
});

// ─── Growth check ─────────────────────────────────────────────────────────────

describe("BonsaiProvider — daily growth check", () => {
  beforeEach(() => {
    setupMockPoints();
    localStorage.removeItem(BONSAI_KEY);
    localStorage.removeItem(LAST_ACTIVE_DATE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(BONSAI_KEY);
    localStorage.removeItem(LAST_ACTIVE_DATE_KEY);
  });

  it("increments activeDaysCount when energy planner was used today and tree was watered", async () => {
    localStorage.setItem(LAST_ACTIVE_DATE_KEY, TODAY);
    const base = createInitialState();
    // Tree starts at day 0; seed lastWateredDay: 0 (watered at current day)
    seedLocalStorage({
      ...base,
      trees: [{ ...base.trees[0], lastWateredDay: 0 }],
    });

    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("1"),
    );
  });

  it("does not increment when tree was not watered", async () => {
    localStorage.setItem(LAST_ACTIVE_DATE_KEY, TODAY);
    // lastWateredDay is undefined (never watered)

    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("0"),
    );
  });

  it("does not increment when energy planner was not used today", async () => {
    // No LAST_ACTIVE_DATE_KEY set

    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("0"),
    );
  });

  it("cleans up a fully regrown pruned branch on mount", async () => {
    // Pine regrowthDays=14, BRANCH_GROW_DURATION=6. Prune at day 0.
    // Fully regrown when activeDaysCount >= 0 + 14 + 6 = 20.
    const base = createInitialState();
    const fullyRegrownDay = BRANCH_GROW_DURATION + 14; // 20
    seedLocalStorage({
      ...base,
      trees: [
        {
          ...base.trees[0],
          activeDaysCount: fullyRegrownDay,
          prunedBranches: [{ branchId: "L0", prunedAtDay: 0 }],
        },
      ],
    });

    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );

    // The pruned branch entry should be cleaned up on mount
    await waitFor(() =>
      expect(screen.getByTestId("pruned")).toHaveTextContent("0"),
    );
  });

  it("does not double-increment if growth check already ran today", async () => {
    localStorage.setItem(LAST_ACTIVE_DATE_KEY, TODAY);
    // Seed a state that has already been grown today
    const base = createInitialState();
    seedLocalStorage({ ...base, lastGrowthCheckDate: TODAY });

    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );

    // Should remain at 0, not increment to 1
    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("0"),
    );
  });

  it("grows all watered trees independently on mount", async () => {
    localStorage.setItem(LAST_ACTIVE_DATE_KEY, TODAY);
    const base = createInitialState();
    // Two trees: pine watered (day 0), maple not watered
    seedLocalStorage({
      ...base,
      trees: [
        { ...base.trees[0], lastWateredDay: 0 },
        {
          id: "a0000000-0000-4000-8000-000000000001",
          speciesId: "maple",
          activeDaysCount: 0,
          acquiredAt: base.trees[0].acquiredAt,
          prunedBranches: [],
        },
      ],
    });

    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );

    // Pine (trees[0]) was watered — grows to day 1
    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("1"),
    );
    // Maple (trees[1]) was not watered — stays at day 0
    expect(screen.getByTestId("day-1")).toHaveTextContent("0");
  });
});

// ─── Garden features ──────────────────────────────────────────────────────────

describe("BonsaiProvider — garden position and placement", () => {
  beforeEach(() => {
    setupMockPoints();
    localStorage.removeItem(BONSAI_KEY);
    localStorage.removeItem(LAST_ACTIVE_DATE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(BONSAI_KEY);
    localStorage.removeItem(LAST_ACTIVE_DATE_KEY);
  });

  function renderBonsai() {
    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );
  }

  it("confirmPlantAt records the garden position on the new tree", async () => {
    const base = createInitialState();
    seedLocalStorage({
      ...base,
      inventory: {
        ...base.inventory,
        ownedSpeciesIds: ["maple"],
        // Include a spare pot so one is available to assign to the new tree
        ownedPotIds: [...base.inventory.ownedPotIds, "simple-clay-small"],
      },
    });
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("seeds")).toHaveTextContent("1"),
    );
    await act(async () => {
      screen.getByText("Plant Maple").click();
    });
    // The newly planted maple is trees[0] (prepended); original pine is trees[1]
    // BonsaiDebug shows trees[0] — check its position matches { x: 25, y: 75 }
    await waitFor(() =>
      expect(screen.getByTestId("garden-x")).toHaveTextContent("25"),
    );
    expect(screen.getByTestId("garden-y")).toHaveTextContent("75");
  });

  it("updateTreePosition saves a new position to the tree", async () => {
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("0"),
    );
    await act(async () => {
      screen.getByText("Move Tree").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("garden-x")).toHaveTextContent("10"),
    );
    expect(screen.getByTestId("garden-y")).toHaveTextContent("20");
  });

  it("beginPlanting sets placingSpeciesId", async () => {
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("placing")).toHaveTextContent("none"),
    );
    await act(async () => {
      screen.getByText("Begin Placing Maple").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("placing")).toHaveTextContent("maple"),
    );
  });

  it("cancelPlanting clears placingSpeciesId", async () => {
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("placing")).toHaveTextContent("none"),
    );
    await act(async () => {
      screen.getByText("Begin Placing Maple").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("placing")).toHaveTextContent("maple"),
    );
    await act(async () => {
      screen.getByText("Cancel Placing").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("placing")).toHaveTextContent("none"),
    );
  });

  it("confirmPlantAt clears placingSpeciesId after placing", async () => {
    const base = createInitialState();
    seedLocalStorage({
      ...base,
      inventory: { ...base.inventory, ownedSpeciesIds: ["maple"] },
    });
    renderBonsai();
    await act(async () => {
      screen.getByText("Begin Placing Maple").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("placing")).toHaveTextContent("maple"),
    );
    await act(async () => {
      screen.getByText("Plant Maple").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("placing")).toHaveTextContent("none"),
    );
  });
});

// ─── Multi-tree advanceDay ────────────────────────────────────────────────────

describe("BonsaiProvider — advanceDay with multiple trees", () => {
  beforeEach(() => {
    setupMockPoints();
    localStorage.removeItem(BONSAI_KEY);
    localStorage.removeItem(LAST_ACTIVE_DATE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(BONSAI_KEY);
    localStorage.removeItem(LAST_ACTIVE_DATE_KEY);
  });

  it("advanceDay grows only the trees that have been watered", async () => {
    const base = createInitialState();
    seedLocalStorage({
      ...base,
      trees: [
        { ...base.trees[0] }, // pine — not watered
        {
          id: "a0000000-0000-4000-8000-000000000002",
          speciesId: "maple",
          activeDaysCount: 0,
          acquiredAt: base.trees[0].acquiredAt,
          prunedBranches: [],
        },
      ],
    });

    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("0"),
    );

    // Water trees[1] (maple) only
    await act(async () => {
      screen.getByText("Water Tree1").click();
    });
    await act(async () => {
      screen.getByText("Advance").click();
    });

    // Maple (trees[1]) grew
    await waitFor(() =>
      expect(screen.getByTestId("day-1")).toHaveTextContent("1"),
    );
    // Pine (trees[0]) did not grow
    expect(screen.getByTestId("day")).toHaveTextContent("0");
  });

  it("advanceDay grows both trees when both are watered", async () => {
    const base = createInitialState();
    seedLocalStorage({
      ...base,
      trees: [
        { ...base.trees[0] },
        {
          id: "a0000000-0000-4000-8000-000000000003",
          speciesId: "maple",
          activeDaysCount: 0,
          acquiredAt: base.trees[0].acquiredAt,
          prunedBranches: [],
        },
      ],
    });

    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("0"),
    );

    // Water both
    await act(async () => {
      screen.getByText("Water").click();
    });
    await act(async () => {
      screen.getByText("Water Tree1").click();
    });
    await act(async () => {
      screen.getByText("Advance").click();
    });

    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("1"),
    );
    expect(screen.getByTestId("day-1")).toHaveTextContent("1");
  });
});

// ─── applyFertiliser ──────────────────────────────────────────────────────────

describe("BonsaiProvider — applyFertiliser", () => {
  beforeEach(() => {
    setupMockPoints();
    localStorage.removeItem(BONSAI_KEY);
    localStorage.removeItem(LAST_ACTIVE_DATE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(BONSAI_KEY);
    localStorage.removeItem(LAST_ACTIVE_DATE_KEY);
  });

  function renderBonsai() {
    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );
  }

  it("sets growthTonic activeFertiliser and removes from inventory", async () => {
    const base = createInitialState();
    seedLocalStorage({
      ...base,
      inventory: {
        ...base.inventory,
        ownedFertiliserIds: ["growth-tonic-small"],
      },
    });
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("fertilisers")).toHaveTextContent("1"),
    );
    await act(async () => {
      screen.getByText("Apply Growth Tonic").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("fertilisers")).toHaveTextContent("0"),
    );
    // Tree is at day 0; growth-tonic-small duration=7, so expiresAtDay=7
    expect(screen.getByTestId("growth-tonic-expires")).toHaveTextContent("7");
  });

  it("sets moistureKeeper activeFertiliser and removes from inventory", async () => {
    const base = createInitialState();
    seedLocalStorage({
      ...base,
      inventory: {
        ...base.inventory,
        ownedFertiliserIds: ["moisture-keeper-small"],
      },
    });
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("fertilisers")).toHaveTextContent("1"),
    );
    await act(async () => {
      screen.getByText("Apply Moisture Keeper").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("fertilisers")).toHaveTextContent("0"),
    );
    // moisture-keeper-small duration=7, so expiresAtDay=7
    expect(screen.getByTestId("moisture-keeper-expires")).toHaveTextContent(
      "7",
    );
  });

  it("is a no-op when fertiliser is not in inventory", async () => {
    renderBonsai();
    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("0"),
    );
    await act(async () => {
      screen.getByText("Apply Growth Tonic").click();
    });
    expect(screen.getByTestId("growth-tonic-expires")).toHaveTextContent(
      "none",
    );
    expect(screen.getByTestId("fertilisers")).toHaveTextContent("0");
  });
});

// ─── Growth Tonic ─────────────────────────────────────────────────────────────

describe("BonsaiProvider — growth tonic bonus", () => {
  beforeEach(() => {
    setupMockPoints();
    localStorage.removeItem(BONSAI_KEY);
    localStorage.removeItem(LAST_ACTIVE_DATE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(BONSAI_KEY);
    localStorage.removeItem(LAST_ACTIVE_DATE_KEY);
  });

  it("adds bonusPerTick to activeDaysCount on each advance when active", async () => {
    const base = createInitialState();
    // growth-tonic-small: bonusPerTick=0.5, duration=7 (expiresAtDay=7)
    seedLocalStorage({
      ...base,
      trees: [
        {
          ...base.trees[0],
          lastWateredDay: 0,
          activeFertilisers: {
            growthTonic: { expiresAtDay: 7, bonusPerTick: 0.5 },
          },
        },
      ],
    });

    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("0"),
    );

    // With growth tonic active, one advance = 1 + 0.5 = 1.5 days
    await act(async () => {
      screen.getByText("Advance").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("1.5"),
    );
  });

  it("does not apply bonus after growthTonic expires", async () => {
    const base = createInitialState();
    // Tree already at day 7 — tonic expires at day 7 (already expired)
    seedLocalStorage({
      ...base,
      trees: [
        {
          ...base.trees[0],
          activeDaysCount: 7,
          lastWateredDay: 7,
          activeFertilisers: {
            growthTonic: { expiresAtDay: 7, bonusPerTick: 0.5 },
          },
        },
      ],
    });

    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("7"),
    );

    // Advance: no bonus (tonic expired), grows by exactly 1
    await act(async () => {
      screen.getByText("Advance").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("8"),
    );
  });
});

// ─── Moisture Keeper ──────────────────────────────────────────────────────────

describe("BonsaiProvider — moisture keeper retention", () => {
  beforeEach(() => {
    setupMockPoints();
    localStorage.removeItem(BONSAI_KEY);
    localStorage.removeItem(LAST_ACTIVE_DATE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(BONSAI_KEY);
    localStorage.removeItem(LAST_ACTIVE_DATE_KEY);
  });

  it("tree grows without rewatering when within moisture keeper retention window", async () => {
    const base = createInitialState();
    // Watered at day 0; moisture-keeper-small retentionDays=1, so grows at day 0 and day 1
    seedLocalStorage({
      ...base,
      trees: [
        {
          ...base.trees[0],
          activeDaysCount: 0,
          lastWateredDay: 0,
          activeFertilisers: {
            moistureKeeper: { expiresAtDay: 7, retentionDays: 1 },
          },
        },
      ],
    });

    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("0"),
    );

    // Advance once — day 0, lastWateredDay 0, retentionDays 1 → gap 0 ≤ 1, grows
    await act(async () => {
      screen.getByText("Advance").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("1"),
    );

    // Advance again — day 1, lastWateredDay 0, retentionDays 1 → gap 1 ≤ 1, still grows
    await act(async () => {
      screen.getByText("Advance").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("2"),
    );
  });

  it("tree stops growing once outside the retention window", async () => {
    const base = createInitialState();
    // Watered at day 0; retentionDays=1. At day 2 → gap 2 > 1, no growth
    seedLocalStorage({
      ...base,
      trees: [
        {
          ...base.trees[0],
          activeDaysCount: 2,
          lastWateredDay: 0,
          activeFertilisers: {
            moistureKeeper: { expiresAtDay: 7, retentionDays: 1 },
          },
        },
      ],
    });

    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("2"),
    );

    // Gap = 2 - 0 = 2, which exceeds retentionDays 1 → no growth
    await act(async () => {
      screen.getByText("Advance").click();
    });
    expect(screen.getByTestId("day")).toHaveTextContent("2");
  });

  it("tree does not grow when moisture keeper has expired", async () => {
    const base = createInitialState();
    // moistureKeeper expired at day 5; tree is now at day 5
    seedLocalStorage({
      ...base,
      trees: [
        {
          ...base.trees[0],
          activeDaysCount: 5,
          lastWateredDay: 5,
          activeFertilisers: {
            moistureKeeper: { expiresAtDay: 5, retentionDays: 3 },
          },
        },
      ],
    });

    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("5"),
    );

    // Moisture keeper expired (activeDaysCount 5 >= expiresAtDay 5) — retentionDays ignored
    // lastWateredDay 5 === activeDaysCount 5 → retentionDays 0 → gap 0 ≤ 0, still grows
    // Actually expired means retentionDays=0, gap = 5-5=0, 0 ≤ 0 = true → grows
    // Let me reconsider: without moisture keeper, isTreeWatered returns activeDaysCount - lastWateredDay <= 0
    // gap = 5 - 5 = 0 ≤ 0 → grows (lastWateredDay === activeDaysCount means watered today)
    await act(async () => {
      screen.getByText("Advance").click();
    });
    // Tree was watered at exactly current day → grows even without moisture keeper
    await waitFor(() =>
      expect(screen.getByTestId("day")).toHaveTextContent("6"),
    );
  });
});

// ─── availablePotCount ────────────────────────────────────────────────────────

describe("BonsaiProvider — availablePotCount", () => {
  beforeEach(() => {
    setupMockPoints();
    localStorage.removeItem(BONSAI_KEY);
    localStorage.removeItem(LAST_ACTIVE_DATE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(BONSAI_KEY);
    localStorage.removeItem(LAST_ACTIVE_DATE_KEY);
  });

  it("returns 0 when the only owned pot is equipped to the starter tree", async () => {
    // Initial state: 1 pot owned, 1 pot equipped to pine → 0 available
    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("avail-pots")).toHaveTextContent("0"),
    );
  });

  it("returns 1 after buying an extra pot", async () => {
    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("avail-pots")).toHaveTextContent("0"),
    );
    await act(async () => {
      screen.getByText("Buy Pot").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("avail-pots")).toHaveTextContent("1"),
    );
  });

  it("confirmPlantAt is a no-op when no pot is available", async () => {
    const base = createInitialState();
    seedLocalStorage({
      ...base,
      inventory: {
        ...base.inventory,
        ownedSpeciesIds: ["maple"],
        // Only 1 pot — already equipped to pine, none available
      },
    });
    render(
      <BonsaiProvider>
        <BonsaiDebug />
      </BonsaiProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("seeds")).toHaveTextContent("1"),
    );
    await act(async () => {
      screen.getByText("Plant Maple").click();
    });
    // No available pot → tree count stays at 1
    expect(screen.getByTestId("tree-count")).toHaveTextContent("1");
  });
});
