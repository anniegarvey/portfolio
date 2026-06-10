import { describe, expect, it } from "vitest";
import { MAX_VISITORS, SPECIES, tameThresholdFor } from "./catalog";
import { advanceGladeDay, pickVisitorSpecies } from "./gladeEngine";
import type { Resident, SpeciesId } from "./schema";
import { makeGladeState, makeVisitor } from "./testFixtures";

const TODAY = "2026-06-10";

let residentSeq = 0;
function makeResident(speciesId: SpeciesId): Resident {
  residentSeq += 1;
  return {
    id: `00000000-0000-4000-8000-0000000001${String(residentSeq).padStart(2, "0")}`,
    speciesId,
    tamedDate: "2026-06-01",
    position: { x: 50, y: 50 },
  };
}

describe("advanceGladeDay", () => {
  it("runs at most once per calendar day", () => {
    const state = makeGladeState({ lastAdvanceDate: TODAY });
    expect(advanceGladeDay(state, TODAY, () => 0.5)).toBe(state);
  });

  it("resets each visitor's daily actions", () => {
    const state = makeGladeState({
      visitors: [
        makeVisitor({
          actionsToday: { treat: true, approach: true, pet: true },
        }),
      ],
      lastAdvanceDate: "2026-06-09",
    });
    const next = advanceGladeDay(state, TODAY, () => 0.5);
    expect(next.visitors[0].actionsToday).toEqual({
      treat: false,
      approach: false,
      pet: false,
    });
    expect(next.lastAdvanceDate).toBe(TODAY);
  });

  it("soother residents build visitor trust, capped below the tame threshold", () => {
    const visitor = makeVisitor({
      speciesId: "robin",
      trust: tameThresholdFor("robin") - 2,
    });
    const state = makeGladeState({
      visitors: [visitor],
      residents: [makeResident("hedgehog"), makeResident("deer")], // 2 soothers
    });
    const next = advanceGladeDay(state, TODAY, () => 0.5);
    expect(next.visitors[0].trust).toBe(tameThresholdFor("robin") - 1);
  });

  it("forager residents each gather one ingredient", () => {
    const state = makeGladeState({
      visitors: [makeVisitor(), makeVisitor(), makeVisitor()], // full, no spawn
      residents: [makeResident("rabbit"), makeResident("squirrel")],
    });
    const next = advanceGladeDay(state, TODAY, () => 0);
    const total = Object.values(next.pantry.ingredients).reduce(
      (sum, n) => sum + n,
      0,
    );
    expect(total).toBe(2);
  });

  it("common foragers gather only everyday ingredients", () => {
    const state = makeGladeState({
      visitors: [makeVisitor(), makeVisitor(), makeVisitor()], // full, no spawn
      residents: [makeResident("rabbit")], // common forager
    });
    // The highest roll picks the last entry of the common pool — never a
    // premium ingredient.
    const next = advanceGladeDay(state, TODAY, () => 0.999);
    expect(next.pantry.ingredients.mint).toBe(1);
    expect(next.pantry.ingredients.honey).toBeUndefined();
    expect(next.pantry.ingredients.cream).toBeUndefined();
  });

  it("uncommon foragers can unearth premium ingredients", () => {
    const state = makeGladeState({
      visitors: [makeVisitor(), makeVisitor(), makeVisitor()], // full, no spawn
      residents: [makeResident("badger")], // uncommon forager
    });
    const next = advanceGladeDay(state, TODAY, () => 0.999);
    expect(next.pantry.ingredients.cream).toBe(1);
  });

  it("spawns one new visitor when there is room", () => {
    const state = makeGladeState();
    const next = advanceGladeDay(state, TODAY, () => 0);
    expect(next.visitors).toHaveLength(1);
    expect(next.visitors[0].trust).toBe(0);
    expect(next.visitors[0].arrivedDate).toBe(TODAY);
  });

  it("does not spawn beyond the visitor cap", () => {
    const visitors = Array.from({ length: MAX_VISITORS }, (_, i) =>
      makeVisitor({ id: `00000000-0000-4000-8000-00000000000${i}` }),
    );
    const state = makeGladeState({ visitors });
    const next = advanceGladeDay(state, TODAY, () => 0.5);
    expect(next.visitors).toHaveLength(MAX_VISITORS);
  });
});

describe("pickVisitorSpecies", () => {
  it("never picks a species already visiting or resident", () => {
    const state = makeGladeState({
      visitors: [makeVisitor({ speciesId: "robin" })],
      residents: [makeResident("rabbit")],
    });
    for (const roll of [0, 0.2, 0.4, 0.6, 0.8, 0.99]) {
      const picked = pickVisitorSpecies(state, () => roll);
      expect(picked).not.toBe("robin");
      expect(picked).not.toBe("rabbit");
    }
  });

  it("returns null when every species is already in the glade", () => {
    const allSpecies = Object.keys(SPECIES) as SpeciesId[];
    const state = makeGladeState({
      residents: allSpecies.map((id) => makeResident(id)),
    });
    expect(pickVisitorSpecies(state, () => 0.5)).toBe(null);
  });

  it("low rolls pick common species when no beacons are present", () => {
    const picked = pickVisitorSpecies(makeGladeState(), () => 0.1);
    expect(picked).not.toBe(null);
    expect(SPECIES[picked as SpeciesId].rarity).toBe("common");
  });

  it("the highest rolls pick rare species", () => {
    const picked = pickVisitorSpecies(makeGladeState(), () => 0.999);
    expect(picked).not.toBe(null);
    expect(SPECIES[picked as SpeciesId].rarity).toBe("rare");
  });

  it("beacon residents make rare species more likely", () => {
    // With 2 beacons, 20 weight moves from common (70→50) to rare (5→25).
    // A roll landing in (75%, 100%] of the weight range is now rare.
    const state = makeGladeState({
      residents: [makeResident("fox"), makeResident("glimmerwing")],
    });
    const picked = pickVisitorSpecies(state, () => 0.8);
    expect(SPECIES[picked as SpeciesId].rarity).toBe("rare");

    // Same roll without beacons stays uncommon.
    const without = pickVisitorSpecies(makeGladeState(), () => 0.8);
    expect(SPECIES[without as SpeciesId].rarity).toBe("uncommon");
  });

  it("falls back to remaining species when a drawn rarity is exhausted", () => {
    // All commons collected: weight should redistribute, never returning null
    // while species remain.
    const commons = (Object.keys(SPECIES) as SpeciesId[]).filter(
      (id) => SPECIES[id].rarity === "common",
    );
    const state = makeGladeState({
      residents: commons.map((id) => makeResident(id)),
    });
    const picked = pickVisitorSpecies(state, () => 0.01);
    expect(picked).not.toBe(null);
    expect(SPECIES[picked as SpeciesId].rarity).not.toBe("common");
  });
});
