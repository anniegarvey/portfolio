import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

/**
 * The visually hidden region that speaks results. Named the same way, because
 * a refusal reads identically on the button, the prompt and here.
 */
const liveRegion = () => document.querySelector('span[aria-live="polite"]');

/**
 * jsdom has no matchMedia, so the world would play back every walk on a 90ms
 * timer — which fires after most of these tests have finished, outside act().
 * Reduced motion is the default here: the farmer is put where they are going
 * and no timer is involved. The two tests that are about the walk itself turn
 * it back off.
 */
function setReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

/** Waits inside act(), so walk timers land as React updates, not stray ones. */
async function settle(ms: number) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

/**
 * Plays an auto-walk out to its end. Effects flush once per act() block, so a
 * walk advances one tile per settle however long that settle waits — hence a
 * call per tile rather than a single wait long enough for all of them.
 */
async function playBackWalk(tiles: number) {
  for (let i = 0; i <= tiles; i += 1) await settle(120);
}

beforeEach(() => {
  vi.clearAllMocks();
  setReducedMotion(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
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

    expect(prompt()).toHaveTextContent(
      "Plot 1 — bare soil, needs a seed in hand",
    );
  });

  it("accepts W A S D as well as the arrow keys", async () => {
    mock();
    render(<ValeWorld />);
    stage().focus();

    await userEvent.keyboard("sd");

    expect(prompt()).toHaveTextContent(
      "Plot 1 — bare soil, needs a seed in hand",
    );
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

  it("acts on a space press when the map itself has focus", async () => {
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

    await userEvent.keyboard("{ArrowDown}{ArrowRight}{ }");

    expect(waterPlot).toHaveBeenCalledWith("plot-0");
  });

  it("leaves space alone when a hotspot has focus, so it presses the button", async () => {
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

    // Focusing a hotspot and pressing space is the button's own activation;
    // the world must not also act on whatever the farmer happens to face.
    // Wrapped because focus tells the world what the keyboard has landed on.
    act(() => {
      screen.getByRole("button", { name: "Call on Nessa" }).focus();
    });
    await userEvent.keyboard("{ }");

    expect(waterPlot).not.toHaveBeenCalled();
    // Space activated the hotspot, so let the door it opened settle.
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("ignores keys that are neither movement nor action", async () => {
    mock();
    render(<ValeWorld />);
    stage().focus();

    await userEvent.keyboard("qz7");

    expect(plantSeed).not.toHaveBeenCalled();
    expect(screen.getByText("Walk up to something to use it.")).toBeVisible();
  });

  it("harvests a ripe plot", async () => {
    mock({
      state: farmState({
        // Parsnip matures in two days; this one is long past.
        plots: [
          {
            id: "plot-0",
            planting: makePlanting({ plantedDate: "2020-01-01" }),
          },
        ],
      }),
    });
    render(<ValeWorld />);
    stage().focus();

    await userEvent.keyboard("{ArrowDown}{ArrowRight}e");

    expect(harvestPlot).toHaveBeenCalledWith("plot-0");
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
    expect(prompt()).toHaveTextContent(
      "Plot 1 — bare soil, needs a seed in hand",
    );
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
    setReducedMotion(false);
    mock();
    render(<ValeWorld />);

    fireEvent.click(
      screen.getByRole("button", { name: /Forage The Hedgerow/ }),
    );
    // (2,2) to (5,2), the tile below the hedgerow.
    await playBackWalk(3);
    stage().focus();
    await userEvent.keyboard("e");

    // A second trip can only land if the farmer really walked over and is now
    // stood in front of the hedgerow.
    expect(forage).toHaveBeenCalledTimes(2);
  });

  it("names where a walk is headed rather than every tile it crosses", async () => {
    setReducedMotion(false);
    mock();
    render(<ValeWorld />);

    // Dispatched without focus, so the prompt has only the walk to go on.
    fireEvent.click(
      screen.getByRole("button", { name: /Forage The Hedgerow/ }),
    );

    // One tile in, on open grass with nothing ahead — and still saying what the
    // player asked for rather than "Walk up to something to use it."
    await settle(120);
    expect(prompt()).toHaveTextContent("Forage The Hedgerow");
    // Let the walk wind itself up rather than leaving timers to fire loose.
    await playBackWalk(3);
  });

  it("puts the farmer straight there when they'd rather not watch a walk", async () => {
    mock();
    render(<ValeWorld />);

    fireEvent.click(
      screen.getByRole("button", { name: /Forage The Hedgerow/ }),
    );
    stage().focus();
    await userEvent.keyboard("e");

    // No timer and no intermediate tiles: the farmer is in front of it already,
    // so the action key lands a second trip straight away.
    expect(forage).toHaveBeenCalledTimes(2);
  });

  it("needs no walk when the farmer is already stood beside it", async () => {
    mock();
    render(<ValeWorld />);
    stage().focus();

    // Step to (2,3), which is beside Plot 1 — the route has no tiles in it.
    await userEvent.keyboard("{ArrowDown}");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Plot 1 — bare soil, needs a seed in hand",
      }),
    );

    expect(prompt()).toHaveTextContent(
      "Plot 1 — bare soil, needs a seed in hand",
    );
  });

  it("moves the prompt on once the tile it is focused on has changed", () => {
    mock();
    const { rerender } = render(<ValeWorld />);

    // Tapping a hotspot focuses it, and focus wins over what the farmer faces.
    // If the prompt froze on the label it was tapped under, a phone player who
    // just sowed a plot would be told to sow it again.
    act(() => {
      screen
        .getByRole("button", {
          name: "Plot 1 — bare soil, needs a seed in hand",
        })
        .focus();
    });
    expect(prompt()).toHaveTextContent(
      "Plot 1 — bare soil, needs a seed in hand",
    );

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
    rerender(<ValeWorld />);

    expect(prompt()).toHaveTextContent("Water Parsnip in Plot 1");
  });

  it("puts the prompt back on what is ahead when the player steers by hand", async () => {
    mock();
    render(<ValeWorld />);

    // A hotspot keeps focus while the farmer walks away from it, so without
    // letting go the prompt would describe a tile the action key can't reach.
    act(() => {
      screen.getByRole("button", { name: "Call on Nessa" }).focus();
    });
    expect(prompt()).toHaveTextContent("Call on Nessa");

    fireEvent.keyDown(stage(), { key: "ArrowDown" });

    expect(prompt()).toHaveTextContent("Walk up to something to use it.");
  });

  it("closes the neighbour's door again", async () => {
    mock();
    render(<ValeWorld />);

    await userEvent.click(
      screen.getByRole("button", { name: "Call on Nessa" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Close modal" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes the stall again", async () => {
    mock();
    render(<ValeWorld />);

    await userEvent.click(
      screen.getByRole("button", { name: "Browse the seed stall" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Close modal" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
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
    setReducedMotion(false);
    mock();
    render(<ValeWorld />);

    // Dispatched synchronously so the reins are taken back before the walk's
    // first 90ms step, with no await in between for a timer to slip through.
    // Plot 6 is right across the farm, so the walk is several tiles long.
    fireEvent.click(
      screen.getByRole("button", {
        name: "Plot 6 — bare soil, needs a seed in hand",
      }),
    );
    fireEvent.keyDown(stage(), { key: "ArrowDown" });
    fireEvent.keyDown(stage(), { key: "ArrowRight" });

    // Long enough that the abandoned walk would have arrived had it continued.
    await settle(800);

    expect(prompt()).not.toHaveTextContent("Plot 6");
  });
});

describe("announcements", () => {
  it("speaks a refusal, so a second try at the same plot is not silent", () => {
    mock();
    render(<ValeWorld />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Plot 1 — bare soil, needs a seed in hand",
      }),
    );

    // The prompt shows this as well, but a live region only speaks when its
    // text changes — and trying the same plot again is exactly what a player
    // does when the first try seemed to do nothing.
    expect(liveRegion()).toHaveTextContent(
      "Plot 1 — bare soil, needs a seed in hand",
    );
  });

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
  it("leads with tapping, which is the only way to play on a phone", () => {
    mock();
    render(<ValeWorld />);

    expect(
      screen.getByText(/^Tap or click any place on the map/),
    ).toBeVisible();
    expect(stage()).toHaveAccessibleDescription(/arrow keys or W, A, S and D/);
  });

  it("says the map runs on past the edge of a narrow screen", () => {
    mock();
    render(<ValeWorld />);

    expect(screen.getByText(/Swipe the map sideways/)).toBeVisible();
  });

  it("says how to sow, which is the one step the map cannot show", () => {
    mock();
    render(<ValeWorld />);

    expect(
      screen.getByText("Pick a seed, then tap or click a bare plot to sow it."),
    ).toBeVisible();
  });

  it("names the map for assistive tech", () => {
    mock();
    render(<ValeWorld />);
    expect(stage()).toHaveAccessibleName("The Vale — Meadowmere's map");
  });
});
