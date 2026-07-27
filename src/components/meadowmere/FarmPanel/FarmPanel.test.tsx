import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type MeadowmereContextType,
  useMeadowmere,
} from "@/lib/meadowmere/context";
import {
  makeMeadowmereContext,
  makeMeadowmereState,
  makePlot,
  PLOT_ID_A,
  PLOT_ID_B,
} from "@/lib/meadowmere/testFixtures";
import { usePoints } from "@/lib/points/context";
import { FarmPanel } from "./FarmPanel";

vi.mock("@/lib/meadowmere/context");
vi.mock("@/lib/points/context");

const buySeed = vi.fn();
const plantSeed = vi.fn();

function mock(
  overrides: Partial<MeadowmereContextType> = {},
  points = 0,
): void {
  vi.mocked(useMeadowmere).mockReturnValue(
    makeMeadowmereContext({ buySeed, plantSeed, ...overrides }),
  );
  vi.mocked(usePoints).mockReturnValue({
    points,
    awardPoints: vi.fn(),
    spendPoints: vi.fn(),
  } as unknown as ReturnType<typeof usePoints>);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("seed tray", () => {
  it("lists unlocked seeds with their counts", () => {
    mock({ state: makeMeadowmereState({ seeds: { parsnip: 4 } }) });
    render(<FarmPanel />);

    expect(
      screen.getByRole("button", { name: "Parsnip, 4 seeds" }),
    ).toBeInTheDocument();
    // Cornflower is locked on a fresh farm.
    expect(
      screen.queryByRole("button", { name: /Cornflower, / }),
    ).not.toBeInTheDocument();
  });

  it("disables a seed with an empty packet", () => {
    mock({ state: makeMeadowmereState({ seeds: { parsnip: 0 } }) });
    render(<FarmPanel />);

    expect(
      screen.getByRole("button", { name: "Parsnip, 0 seeds" }),
    ).toBeDisabled();
  });

  it("selects a seed, then plants it and can deselect", async () => {
    mock({
      state: makeMeadowmereState({
        seeds: { parsnip: 2 },
        plots: [makePlot()],
      }),
    });
    render(<FarmPanel />);

    const chip = screen.getByRole("button", { name: "Parsnip, 2 seeds" });
    expect(chip).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(
      screen.getByRole("button", { name: "Plant Parsnip" }),
    );
    expect(plantSeed).toHaveBeenCalledWith(PLOT_ID_A, "parsnip");

    await userEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");
  });

  it("says when there are no unlocked seeds at all", () => {
    mock({ state: makeMeadowmereState({ unlockedCropIds: [] }) });
    render(<FarmPanel />);

    expect(screen.getByText("No seeds yet.")).toBeInTheDocument();
  });
});

describe("plots", () => {
  it("renders every plot", () => {
    mock({
      state: makeMeadowmereState({
        plots: [makePlot(), makePlot({ id: PLOT_ID_B })],
      }),
    });
    render(<FarmPanel />);

    expect(screen.getByText("Plot 1")).toBeInTheDocument();
    expect(screen.getByText("Plot 2")).toBeInTheDocument();
  });
});

describe("seed shop", () => {
  it("disables buying without enough points", () => {
    mock({}, 0);
    render(<FarmPanel />);

    expect(screen.getByRole("button", { name: /Buy seed/ })).toBeDisabled();
  });

  it("buys a seed when the points are there", async () => {
    mock({}, 50);
    render(<FarmPanel />);

    await userEvent.click(screen.getByRole("button", { name: /Buy seed/ }));
    expect(buySeed).toHaveBeenCalledWith("parsnip");
  });

  it("marks crops that a quest has not yet unlocked", () => {
    mock({}, 50);
    render(<FarmPanel />);

    // Four of the five crops start locked.
    expect(
      screen.getAllByText("Locked — earned through a quest."),
    ).toHaveLength(4);
  });
});
