import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type MeadowmereContextType,
  useMeadowmere,
} from "@/lib/meadowmere/context";
import type { MeadowmereState } from "@/lib/meadowmere/schema";
import {
  makeMeadowmereContext,
  makeMeadowmereState,
  makePlanting,
} from "@/lib/meadowmere/testFixtures";
import { ValeWorld } from "./ValeWorld";

vi.mock("@/lib/meadowmere/context");
vi.mock("@/lib/points/context", () => ({
  usePoints: () => ({ points: 50, spendPoints: vi.fn() }),
}));

const plantSeed = vi.fn();
const waterPlot = vi.fn();
const harvestPlot = vi.fn();
const forage = vi.fn();

function farmState(overrides: Partial<MeadowmereState> = {}) {
  return makeMeadowmereState({
    plots: Array.from({ length: 6 }, (_, i) => ({
      id: `plot-${i}`,
      planting: null,
    })),
    seeds: { parsnip: 3 },
    ...overrides,
  });
}

function mock(overrides: Partial<MeadowmereContextType> = {}) {
  vi.mocked(useMeadowmere).mockReturnValue(
    makeMeadowmereContext({
      state: farmState(),
      plantSeed,
      waterPlot,
      harvestPlot,
      forage,
      ...overrides,
    }),
  );
}

/** The map, which is where key presses land. */
const stage = () => screen.getByRole("application");

/**
 * The line under the map saying what the farmer is facing. Every hotspot button
 * carries the same wording, so prompt assertions have to name the paragraph.
 */
const prompt = () => stage().parentElement?.querySelector("p:last-of-type");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("walking", () => {
  it("starts the farmer facing nothing in particular", () => {
    mock();
    render(<ValeWorld />);
    expect(screen.getByText("Walk up to something to use it.")).toBeVisible();
  });

  it("turns to face a plot and says what can be done with it", async () => {
    mock();
    render(<ValeWorld />);
    stage().focus();

    // From (2,2): down to (2,3), then right into Plot 1 at (3,3) — blocked, so
    // the farmer only turns to face it.
    await userEvent.keyboard("{ArrowDown}{ArrowRight}");

    expect(prompt()).toHaveTextContent("Plot 1 — bare soil, no seed chosen");
  });

  it("accepts W A S D as well as the arrow keys", async () => {
    mock();
    render(<ValeWorld />);
    stage().focus();

    await userEvent.keyboard("sd");

    expect(prompt()).toHaveTextContent("Plot 1 — bare soil, no seed chosen");
  });

  it("keeps the farmer in view when the map is too wide to fit", async () => {
    mock();
    render(<ValeWorld />);
    const view = stage();
    // jsdom does no layout, so stand in for a 640px map in a 320px window.
    Object.defineProperty(view, "scrollWidth", {
      configurable: true,
      value: 640,
    });
    Object.defineProperty(view, "clientWidth", {
      configurable: true,
      value: 320,
    });
    view.focus();

    // Down to the walkway, then east along it well past the halfway mark.
    await userEvent.keyboard(
      "{ArrowDown}{ArrowDown}{ArrowRight}".concat(
        "{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}",
      ),
    );

    expect(view.scrollLeft).toBeGreaterThan(0);
  });

  it("does not scroll the map while the farmer is near its west edge", () => {
    mock();
    render(<ValeWorld />);
    expect(stage().scrollLeft).toBe(0);
  });

  it("stops at the hedge instead of walking off the map", async () => {
    mock();
    render(<ValeWorld />);
    stage().focus();

    await userEvent.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}{ArrowLeft}");

    // Still on the map with nothing in front but open ground.
    expect(screen.getByText("Walk up to something to use it.")).toBeVisible();
  });
});

describe("acting on what the farmer faces", () => {
  it("sows the seed in hand into the bare plot ahead", async () => {
    mock();
    render(<ValeWorld />);

    await userEvent.click(
      screen.getByRole("button", { name: "Parsnip, 3 seeds" }),
    );
    stage().focus();
    await userEvent.keyboard("{ArrowDown}{ArrowRight}e");

    expect(plantSeed).toHaveBeenCalledWith("plot-0", "parsnip");
  });

  it("waters a growing plot", async () => {
    mock({
      state: farmState({
        plots: [
          {
            id: "plot-0",
            planting: makePlanting({ plantedDate: "2999-01-01" }),
          },
        ],
      }),
    });
    render(<ValeWorld />);
    stage().focus();

    await userEvent.keyboard("{ArrowDown}{ArrowRight}e");

    expect(waterPlot).toHaveBeenCalledWith("plot-0");
  });

  it("does nothing when there is nothing ahead", async () => {
    mock();
    render(<ValeWorld />);
    stage().focus();

    await userEvent.keyboard("e");

    expect(plantSeed).not.toHaveBeenCalled();
    expect(waterPlot).not.toHaveBeenCalled();
  });

  it("says why an action isn't available rather than failing silently", async () => {
    mock();
    render(<ValeWorld />);
    stage().focus();

    // No seed chosen, so the bare plot ahead has nothing to offer.
    await userEvent.keyboard("{ArrowDown}{ArrowRight}e");

    expect(plantSeed).not.toHaveBeenCalled();
    expect(prompt()).toHaveTextContent("Plot 1 — bare soil, no seed chosen");
  });
});

describe("clicking a place on the map", () => {
  it("acts immediately rather than waiting for the walk to finish", async () => {
    mock();
    render(<ValeWorld />);

    await userEvent.click(
      screen.getByRole("button", { name: /Forage The Hedgerow/ }),
    );

    // The hedgerow is right across the farm, but the trip is already taken —
    // an interrupted walk can never swallow what the player asked for.
    expect(forage).toHaveBeenCalledWith("hedgerow");
  });

  it("walks the farmer over and leaves them facing what they used", async () => {
    mock();
    render(<ValeWorld />);

    await userEvent.click(screen.getByRole("button", { name: "Call on Bram" }));

    await waitFor(
      () => {
        expect(screen.getByText("Call on Bram")).toBeVisible();
      },
      { timeout: 4000 },
    );
  });

  it("opens the neighbour's door when their cottage is used", async () => {
    mock();
    render(<ValeWorld />);

    await userEvent.click(
      screen.getByRole("button", { name: "Call on Nessa" }),
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Cook at the Hollow Inn")).toBeInTheDocument();
  });

  it("opens the stall when the stall is used", async () => {
    mock();
    render(<ValeWorld />);

    await userEvent.click(
      screen.getByRole("button", { name: "Browse the seed stall" }),
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("The seed stall")).toBeInTheDocument();
  });

  it("abandons the walk when the player takes the reins back", async () => {
    const user = userEvent.setup({ delay: null });
    mock();
    render(<ValeWorld />);

    // Plot 6 is right across the farm, so the walk is several tiles long.
    await user.click(
      screen.getByRole("button", {
        name: "Plot 6 — bare soil, no seed chosen",
      }),
    );
    stage().focus();
    await user.keyboard("{ArrowDown}{ArrowRight}");

    // Long enough that the abandoned walk would have arrived had it continued.
    await new Promise((resolve) => setTimeout(resolve, 800));

    expect(prompt()).not.toHaveTextContent("Plot 6");
  });
});

describe("announcements", () => {
  it("announces what a harvest turned up", () => {
    mock({ notice: { kind: "harvest", cropId: "parsnip", amount: 3 } });
    render(<ValeWorld />);

    expect(screen.getByText("Harvested 3 × Parsnip.")).toBeInTheDocument();
  });

  it("announces a forage haul with the site it came from", () => {
    mock({
      notice: {
        kind: "forage",
        siteId: "hedgerow",
        itemId: "acorn",
        amount: 2,
      },
    });
    render(<ValeWorld />);

    expect(
      screen.getByText("Foraged 2 × Acorn at The Hedgerow."),
    ).toBeInTheDocument();
  });

  it("announces a liked gift and the tier it crossed", () => {
    mock({
      notice: {
        kind: "gift",
        neighbourId: "marigold",
        itemId: "wild-honey",
        liked: true,
        friendshipGained: 12,
        newTierName: "Acquaintance",
      },
    });
    render(<ValeWorld />);

    expect(
      screen.getByText(
        "Marigold loved the Wild Honey. +12 friendship. Now Acquaintance.",
      ),
    ).toBeInTheDocument();
  });

  it("announces a neutral gift without a tier", () => {
    mock({
      notice: {
        kind: "gift",
        neighbourId: "bram",
        itemId: "strawberry",
        liked: false,
        friendshipGained: 4,
        newTierName: null,
      },
    });
    render(<ValeWorld />);

    expect(
      screen.getByText("Bram accepted the Strawberry. +4 friendship."),
    ).toBeInTheDocument();
  });

  it("announces a quest hand-in", () => {
    mock({ notice: { kind: "quest", questId: "a-bed-for-parsnips" } });
    render(<ValeWorld />);

    expect(
      screen.getByText("Handed in A Bed for Parsnips."),
    ).toBeInTheDocument();
  });
});

describe("controls", () => {
  it("explains both ways of playing", () => {
    mock();
    render(<ValeWorld />);

    expect(screen.getByText(/Walk with the arrow keys/)).toBeVisible();
    expect(stage()).toHaveAccessibleDescription(/Press E to use/);
  });

  it("names the map for assistive tech", () => {
    mock();
    render(<ValeWorld />);
    expect(stage()).toHaveAccessibleName("The Vale — Meadowmere's map");
  });
});
