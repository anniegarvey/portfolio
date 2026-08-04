import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MAX_PLOTS } from "@/lib/meadowmere/catalog";
import type { FarmerPose } from "@/lib/meadowmere/movement";
import type { MeadowmereState } from "@/lib/meadowmere/schema";
import {
  makeMeadowmereState,
  makePlanting,
} from "@/lib/meadowmere/testFixtures";
import { ValeScene } from "./ValeScene";

const TODAY = "2026-06-20";

function stateWith(count: number, overrides: Partial<MeadowmereState> = {}) {
  return makeMeadowmereState({
    plots: Array.from({ length: count }, (_, i) => ({
      id: `plot-${i}`,
      planting: null,
    })),
    ...overrides,
  });
}

const POSE: FarmerPose = { x: 2, y: 2, facing: "down" };

function renderScene(
  state: MeadowmereState,
  props: Partial<React.ComponentProps<typeof ValeScene>> = {},
) {
  const onActivateFeature = vi.fn();
  const onFocusFeature = vi.fn();
  const result = render(
    <ValeScene
      onActivateFeature={onActivateFeature}
      onFocusFeature={onFocusFeature}
      pose={POSE}
      selectedCropId={null}
      state={state}
      today={TODAY}
      walking={false}
      {...props}
    />,
  );
  return { ...result, onActivateFeature, onFocusFeature };
}

describe("ValeScene", () => {
  it("gives every feature a button naming what it offers", () => {
    renderScene(stateWith(6));

    expect(screen.getAllByRole("button")).toHaveLength(6 + 3 + 3 + 1);
    expect(
      screen.getByRole("button", {
        name: "Plot 1 — bare soil, no seed chosen",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Call on Nessa" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Browse the seed stall" }),
    ).toBeInTheDocument();
  });

  it("adds buttons as quests hand over more land", () => {
    renderScene(stateWith(MAX_PLOTS));
    expect(screen.getAllByRole("button")).toHaveLength(MAX_PLOTS + 3 + 3 + 1);
  });

  it("hands the feature back when its button is used", async () => {
    const { onActivateFeature } = renderScene(stateWith(6));

    await userEvent.click(
      screen.getByRole("button", { name: "Call on Marigold" }),
    );

    expect(onActivateFeature).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "cottage", neighbourId: "marigold" }),
    );
  });

  it("reports the interaction the keyboard lands on, and when it leaves", () => {
    const { onFocusFeature } = renderScene(stateWith(6));
    const bram = screen.getByRole("button", { name: "Call on Bram" });

    // A hotspot's label is invisible, so focusing one has to say what it does.
    bram.focus();
    expect(onFocusFeature).toHaveBeenCalledWith(
      expect.objectContaining({
        action: { type: "visit", neighbourId: "bram" },
      }),
    );

    bram.blur();
    expect(onFocusFeature).toHaveBeenLastCalledWith(null);
  });

  it("names a plot by what can be done to it right now", () => {
    const state = stateWith(6);
    state.plots[0].planting = makePlanting({ plantedDate: TODAY });
    renderScene(state);

    expect(
      screen.getByRole("button", { name: "Water Parsnip in Plot 1" }),
    ).toBeInTheDocument();
  });

  it("offers to sow into a bare plot once a seed is in hand", () => {
    renderScene(stateWith(6, { seeds: { parsnip: 2 } }), {
      selectedCropId: "parsnip",
    });

    expect(
      screen.getByRole("button", { name: "Sow Parsnip in Plot 1" }),
    ).toBeInTheDocument();
  });

  it("shows a locked site as somewhere the way isn't known yet", () => {
    renderScene(stateWith(6, { unlockedSiteIds: ["hedgerow"] }));

    expect(
      screen.getByRole("button", {
        name: "The Riverbank — you don’t know the way yet",
      }),
    ).toBeInTheDocument();
  });

  it("hides the drawing from assistive tech, leaving the buttons to speak", () => {
    const { container } = renderScene(stateWith(6));
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden");
  });

  it("stands the farmer on their tile", () => {
    const { container } = renderScene(stateWith(6), {
      pose: { x: 4, y: 6, facing: "up" },
    });
    // 32 user units per tile, lifted 6 so the farmer stands in the tile.
    expect(container.innerHTML).toContain("translate(128px, 186px)");
  });
});
