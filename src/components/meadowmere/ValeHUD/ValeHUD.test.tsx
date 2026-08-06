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
} from "@/lib/meadowmere/testFixtures";
import { ValeHUD } from "./ValeHUD";

vi.mock("@/lib/meadowmere/context");
vi.mock("@/lib/points/context", () => ({
  usePoints: () => ({ points: 42, spendPoints: vi.fn() }),
}));

const onSelectCrop = vi.fn();

function mock(overrides: Partial<MeadowmereContextType> = {}) {
  vi.mocked(useMeadowmere).mockReturnValue(makeMeadowmereContext(overrides));
}

function renderHUD(selectedCropId: "parsnip" | null = null) {
  return render(
    <ValeHUD onSelectCrop={onSelectCrop} selectedCropId={selectedCropId} />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("what the farmer is carrying", () => {
  it("shows points, which is the only thing seeds cost", () => {
    mock();
    renderHUD();
    expect(screen.getByText("42 points")).toBeInTheDocument();
  });

  it("counts down the day's forage trips", () => {
    mock({ state: makeMeadowmereState({ foragesToday: 2 }) });
    renderHUD();
    expect(screen.getByText("1 forage trips left")).toBeInTheDocument();
  });

  it("says the larder is empty rather than showing nothing", () => {
    mock();
    renderHUD();
    expect(screen.getByText("Empty.")).toBeInTheDocument();
  });

  it("lists what is in the larder", () => {
    mock({
      state: makeMeadowmereState({
        inventory: { acorn: 3, "parsnip-root": 1 },
      }),
    });
    renderHUD();

    expect(screen.getByText(/Acorn ×3/)).toBeInTheDocument();
    expect(screen.getByText(/Parsnip ×1/)).toBeInTheDocument();
  });

  it("leaves out items the player has run out of", () => {
    mock({ state: makeMeadowmereState({ inventory: { acorn: 0 } }) });
    renderHUD();
    expect(screen.getByText("Empty.")).toBeInTheDocument();
  });
});

describe("the seed pouch", () => {
  it("points the player at the stall when they have no seeds at all", () => {
    mock({ state: makeMeadowmereState({ unlockedCropIds: [] }) });
    renderHUD();
    expect(
      screen.getByText("No seeds yet — buy some at the stall."),
    ).toBeInTheDocument();
  });

  it("shows a chip per unlocked crop with its count", () => {
    mock({ state: makeMeadowmereState({ seeds: { parsnip: 4 } }) });
    renderHUD();
    expect(
      screen.getByRole("button", { name: "Parsnip, 4 seeds" }),
    ).toBeInTheDocument();
  });

  it("says 'seed' rather than 'seeds' for the last one", () => {
    mock({ state: makeMeadowmereState({ seeds: { parsnip: 1 } }) });
    renderHUD();
    expect(
      screen.getByRole("button", { name: "Parsnip, 1 seed" }),
    ).toBeInTheDocument();
  });

  it("takes a seed in hand when its chip is chosen", async () => {
    mock({ state: makeMeadowmereState({ seeds: { parsnip: 2 } }) });
    renderHUD();

    await userEvent.click(screen.getByRole("button", { name: /Parsnip/ }));
    expect(onSelectCrop).toHaveBeenCalledWith("parsnip");
  });

  it("puts the seed back when its chip is chosen again", async () => {
    mock({ state: makeMeadowmereState({ seeds: { parsnip: 2 } }) });
    renderHUD("parsnip");

    await userEvent.click(screen.getByRole("button", { name: /Parsnip/ }));
    expect(onSelectCrop).toHaveBeenCalledWith(null);
  });

  it("marks the seed in hand as pressed", () => {
    mock({ state: makeMeadowmereState({ seeds: { parsnip: 2 } }) });
    renderHUD("parsnip");
    expect(screen.getByRole("button", { name: /Parsnip/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("disables a crop the player has no packets of", () => {
    mock({ state: makeMeadowmereState({ seeds: { parsnip: 0 } }) });
    renderHUD();
    expect(screen.getByRole("button", { name: /Parsnip/ })).toBeDisabled();
  });

  // Sowing is two steps and only the second one happens on the map, so the
  // pouch has to say what taking a seed in hand is for.
  it("says what to do with a seed once one is in hand", () => {
    mock({ state: makeMeadowmereState({ seeds: { parsnip: 2 } }) });
    renderHUD("parsnip");
    expect(
      screen.getByText("Now tap or click a bare plot to sow Parsnip."),
    ).toBeInTheDocument();
  });

  it("says to take a seed in hand first when none is chosen", () => {
    mock({ state: makeMeadowmereState({ seeds: { parsnip: 2 } }) });
    renderHUD();
    expect(
      screen.getByText("Pick a seed, then tap or click a bare plot to sow it."),
    ).toBeInTheDocument();
  });

  // Sowing the last packet leaves that seed in hand with nothing behind it,
  // and its chip goes disabled — so the hint has to name the run-out rather
  // than keep telling the player to sow a seed they haven't got.
  it("names the run-out when the seed in hand is spent", () => {
    mock({ state: makeMeadowmereState({ seeds: { parsnip: 0 } }) });
    renderHUD("parsnip");
    expect(
      screen.getByText("No Parsnip seed left — buy more at the stall."),
    ).toBeInTheDocument();
  });
});

describe("the quest journal", () => {
  it("opens the journal", async () => {
    mock();
    renderHUD();

    await userEvent.click(
      screen.getByRole("button", { name: /Quest journal/ }),
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("A Bed for Parsnips")).toBeInTheDocument();
  });

  it("flags quests waiting to be handed in", () => {
    mock({
      state: makeMeadowmereState({ inventory: { "parsnip-root": 3 } }),
    });
    renderHUD();
    expect(screen.getByText("1 ready to hand in")).toBeInTheDocument();
  });

  it("stays quiet when nothing is ready", () => {
    mock();
    renderHUD();
    expect(screen.queryByText(/ready to hand in/)).not.toBeInTheDocument();
  });
});
