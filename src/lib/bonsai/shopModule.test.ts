import { describe, expect, it } from "vitest";
import type { BonsaiGameState } from "./schema";
import { buyItem } from "./shopModule";

function makeState(): BonsaiGameState {
  return {
    trees: [],
    inventory: {
      ownedSpeciesIds: [],
      ownedToolIds: [],
      ownedFertiliserIds: [],
      ownedPotIds: [],
      ownedStandIds: [],
      ownedBackgroundIds: [],
    },
  };
}

describe("buyItem", () => {
  it("returns unchanged state for unknown item", () => {
    const state = makeState();
    // biome-ignore lint/suspicious/noExplicitAny: testing invalid input path
    const next = buyItem(state, "not-a-real-item" as any);
    expect(next).toBe(state);
  });

  it("adds a species to ownedSpeciesIds", () => {
    const next = buyItem(makeState(), "pine");
    expect(next.inventory.ownedSpeciesIds).toContain("pine");
  });

  it("adds a tool to ownedToolIds", () => {
    const next = buyItem(makeState(), "watering-can");
    expect(next.inventory.ownedToolIds).toContain("watering-can");
  });

  it("adds a fertiliser to ownedFertiliserIds", () => {
    const next = buyItem(makeState(), "growth-tonic-small");
    expect(next.inventory.ownedFertiliserIds).toContain("growth-tonic-small");
  });

  it("adds a pot to ownedPotIds", () => {
    const next = buyItem(makeState(), "simple-clay-small");
    expect(next.inventory.ownedPotIds).toContain("simple-clay-small");
  });

  it("adds a stand to ownedStandIds", () => {
    const next = buyItem(makeState(), "bamboo-mat-small");
    expect(next.inventory.ownedStandIds).toContain("bamboo-mat-small");
  });

  it("adds a background to ownedBackgroundIds", () => {
    const next = buyItem(makeState(), "zen-garden");
    expect(next.inventory.ownedBackgroundIds).toContain("zen-garden");
  });

  it("stacks duplicate items", () => {
    const state = buyItem(makeState(), "growth-tonic-small");
    const next = buyItem(state, "growth-tonic-small");
    expect(next.inventory.ownedFertiliserIds).toHaveLength(2);
  });
});
