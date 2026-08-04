import { describe, expect, it } from "vitest";
import { FORAGES_PER_DAY, SITES } from "./catalog";
import { canForage, forageSite, foragesLeft } from "./foragingModule";
import { makeMeadowmereState } from "./testFixtures";

/** Deterministic rng returning each value in turn, then repeating the last. */
function seededRng(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe("foragesLeft", () => {
  it("starts at the daily allowance", () => {
    expect(foragesLeft(makeMeadowmereState())).toBe(FORAGES_PER_DAY);
  });

  it("drops as trips are spent", () => {
    const state = makeMeadowmereState({ foragesToday: 2 });
    expect(foragesLeft(state)).toBe(FORAGES_PER_DAY - 2);
  });

  it("floors at zero if the count somehow overshoots", () => {
    const state = makeMeadowmereState({ foragesToday: FORAGES_PER_DAY + 5 });
    expect(foragesLeft(state)).toBe(0);
  });
});

describe("canForage", () => {
  it("allows an unlocked site with trips left", () => {
    expect(canForage(makeMeadowmereState(), "hedgerow")).toBe(true);
  });

  it("refuses a locked site", () => {
    expect(canForage(makeMeadowmereState(), "stonewood")).toBe(false);
  });

  it("refuses once the day's trips are spent", () => {
    const state = makeMeadowmereState({ foragesToday: FORAGES_PER_DAY });
    expect(canForage(state, "hedgerow")).toBe(false);
  });
});

describe("forageSite", () => {
  it("spends a trip and returns a material from that site", () => {
    const result = forageSite(
      makeMeadowmereState(),
      "hedgerow",
      seededRng([0, 0.9]),
    );

    expect(result).not.toBeNull();
    expect(SITES.hedgerow.materials).toContain(result?.itemId);
    expect(result?.amount).toBe(1);
    expect(result?.state.foragesToday).toBe(1);
    expect(result?.state.inventory[SITES.hedgerow.materials[0]]).toBe(1);
  });

  it("sometimes turns up two of a material", () => {
    const result = forageSite(
      makeMeadowmereState(),
      "hedgerow",
      seededRng([0, 0.1]),
    );
    expect(result?.amount).toBe(2);
  });

  it("draws across the whole material pool", () => {
    const result = forageSite(
      makeMeadowmereState(),
      "hedgerow",
      seededRng([0.99, 0.9]),
    );
    expect(result?.itemId).toBe(SITES.hedgerow.materials[2]);
  });

  it("returns null for a locked site", () => {
    expect(forageSite(makeMeadowmereState(), "riverbank")).toBeNull();
  });

  it("returns null once the day's trips are spent", () => {
    const state = makeMeadowmereState({ foragesToday: FORAGES_PER_DAY });
    expect(forageSite(state, "hedgerow")).toBeNull();
  });

  it("defaults to Math.random when no rng is supplied", () => {
    const result = forageSite(makeMeadowmereState(), "hedgerow");
    expect(SITES.hedgerow.materials).toContain(result?.itemId);
  });
});
