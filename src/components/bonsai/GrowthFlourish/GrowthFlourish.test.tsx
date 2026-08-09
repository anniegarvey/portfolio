import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { GrowthEvent } from "@/lib/bonsai/growthEvents";
import { GrowthFlourish } from "./GrowthFlourish";

const grew = (over: Partial<GrowthEvent> = {}): GrowthEvent => ({
  treeId: "t1",
  daysGained: 1,
  newStage: null,
  ...over,
});

describe("GrowthFlourish", () => {
  it("renders the tree and nothing else when there is no growth", () => {
    const { container } = render(
      <GrowthFlourish event={null} variant="mini">
        <span>tree</span>
      </GrowthFlourish>,
    );
    expect(screen.getByText("tree")).toBeInTheDocument();
    expect(container.textContent).toBe("tree");
  });

  it("counts the days gained", () => {
    render(
      <GrowthFlourish event={grew({ daysGained: 3 })} variant="mini">
        <span>tree</span>
      </GrowthFlourish>,
    );
    expect(screen.getByText("+3 days")).toBeInTheDocument();
  });

  it("says day, singular, for a single day", () => {
    render(
      <GrowthFlourish event={grew()} variant="mini">
        <span>tree</span>
      </GrowthFlourish>,
    );
    expect(screen.getByText("+1 day")).toBeInTheDocument();
  });

  // The garden's trees are 90px wide; a full sentence would cover them.
  it("shows the stage name alone on a garden tree", () => {
    render(
      <GrowthFlourish event={grew({ newStage: "Sapling" })} variant="mini">
        <span>tree</span>
      </GrowthFlourish>,
    );
    expect(screen.getByText("Sapling")).toBeInTheDocument();
  });

  it("spells the milestone out in the roomier tending view", () => {
    render(
      <GrowthFlourish event={grew({ newStage: "Sapling" })} variant="full">
        <span>tree</span>
      </GrowthFlourish>,
    );
    expect(screen.getByText("Now a Sapling")).toBeInTheDocument();
  });

  // The page announces the growth once for the whole garden, so five trees
  // growing overnight must not read out five times.
  it("hides every signal from assistive tech", () => {
    const { container } = render(
      <GrowthFlourish event={grew({ newStage: "Sapling" })} variant="mini">
        <span>tree</span>
      </GrowthFlourish>,
    );
    const signals = container.querySelector('[aria-hidden="true"]');
    expect(signals).not.toBeNull();
    expect(signals?.textContent).toBe("Sapling");
  });
});
