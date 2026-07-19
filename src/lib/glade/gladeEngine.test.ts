import { describe, expect, it } from "vitest";
import { MAX_VISITORS, SPECIES, tameThresholdFor } from "./catalog";
import { advanceGladeDay, pickDailyVisitors } from "./gladeEngine";
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

/** rng returning the given values in order (the last value repeats). */
function rngFrom(values: number[]): () => number {
  let i = 0;
  return () => {
    const value = values[Math.min(i, values.length - 1)];
    i += 1;
    return value;
  };
}

describe("advanceGladeDay", () => {
  it("runs at most once per calendar day", () => {
    const state = makeGladeState({ lastAdvanceDate: TODAY });
    const result = advanceGladeDay(state, TODAY, () => 0.5);
    expect(result.state).toBe(state);
    expect(result.report).toBe(null);
  });

  it("replaces yesterday's visitors with a fresh set arriving today", () => {
    const state = makeGladeState({
      visitors: [
        makeVisitor({
          arrivedDate: "2026-06-09",
          actionsToday: { treat: true, approach: true, pet: true },
        }),
      ],
      lastAdvanceDate: "2026-06-09",
    });
    const next = advanceGladeDay(state, TODAY, () => 0).state;
    expect(next.visitors).toHaveLength(1);
    expect(next.visitors[0].arrivedDate).toBe(TODAY);
    expect(next.visitors[0].actionsToday).toEqual({
      treat: false,
      approach: false,
      pet: false,
    });
    expect(next.lastAdvanceDate).toBe(TODAY);
  });

  it("banks each departing visitor's trust in speciesTrust", () => {
    const state = makeGladeState({
      visitors: [makeVisitor({ speciesId: "robin", trust: 40 })],
    });
    const next = advanceGladeDay(state, TODAY, () => 0.5).state;
    expect(next.speciesTrust.robin).toBe(40);
  });

  it("arriving visitors resume from their species' banked trust", () => {
    const state = makeGladeState({ speciesTrust: { robin: 40 } });
    // rng 0 draws one visitor: robin, the first (and most trusted) candidate.
    const next = advanceGladeDay(state, TODAY, () => 0).state;
    expect(next.visitors[0].speciesId).toBe("robin");
    expect(next.visitors[0].trust).toBe(40);
  });

  it("soother residents calm arriving visitors, capped below the tame threshold", () => {
    const state = makeGladeState({
      speciesTrust: { robin: tameThresholdFor("robin") - 2 },
      residents: [makeResident("hedgehog"), makeResident("deer")], // 2 soothers
    });
    const next = advanceGladeDay(state, TODAY, () => 0).state;
    expect(next.visitors[0].speciesId).toBe("robin");
    expect(next.visitors[0].trust).toBe(tameThresholdFor("robin") - 1);
  });

  it("always draws at least one visitor", () => {
    const next = advanceGladeDay(makeGladeState(), TODAY, () => 0).state;
    expect(next.visitors).toHaveLength(1);
    expect(next.visitors[0].trust).toBe(0);
    expect(next.visitors[0].arrivedDate).toBe(TODAY);
  });

  it("draws at most MAX_VISITORS distinct visitors", () => {
    const next = advanceGladeDay(makeGladeState(), TODAY, () => 0.999).state;
    expect(next.visitors).toHaveLength(MAX_VISITORS);
    const species = next.visitors.map((v) => v.speciesId);
    expect(new Set(species).size).toBe(MAX_VISITORS);
  });

  it("never draws more visitors than untamed species remain", () => {
    const allButRobin = (Object.keys(SPECIES) as SpeciesId[]).filter(
      (id) => id !== "robin",
    );
    const state = makeGladeState({
      residents: allButRobin.map((id) => makeResident(id)),
    });
    const next = advanceGladeDay(state, TODAY, () => 0.999).state;
    expect(next.visitors.map((v) => v.speciesId)).toEqual(["robin"]);
  });

  it("forager residents each gather one ingredient", () => {
    const state = makeGladeState({
      residents: [makeResident("rabbit"), makeResident("squirrel")],
    });
    const next = advanceGladeDay(state, TODAY, () => 0).state;
    const total = Object.values(next.pantry.ingredients).reduce(
      (sum, n) => sum + n,
      0,
    );
    expect(total).toBe(2);
  });

  it("common foragers gather only everyday ingredients", () => {
    const state = makeGladeState({
      residents: [makeResident("rabbit")], // common forager
    });
    // The highest roll picks the last entry of the common pool — never a
    // premium ingredient.
    const next = advanceGladeDay(state, TODAY, () => 0.999).state;
    expect(next.pantry.ingredients.mint).toBe(1);
    expect(next.pantry.ingredients.honey).toBeUndefined();
    expect(next.pantry.ingredients.cream).toBeUndefined();
  });

  it("uncommon foragers can unearth premium ingredients", () => {
    const state = makeGladeState({
      residents: [makeResident("badger")], // uncommon forager
    });
    const next = advanceGladeDay(state, TODAY, () => 0.999).state;
    expect(next.pantry.ingredients.cream).toBe(1);
  });

  it("wellspring residents produce two ingredients per day", () => {
    const state = makeGladeState({
      residents: [makeResident("thornwhisper")], // legendary wellspring
    });
    const next = advanceGladeDay(state, TODAY, () => 0).state;
    const total = Object.values(next.pantry.ingredients).reduce(
      (sum, n) => sum + n,
      0,
    );
    expect(total).toBe(2);
  });

  it("reports forage events attributed to the gathering resident", () => {
    const rabbit = makeResident("rabbit");
    const wellspring = makeResident("thornwhisper");
    const state = makeGladeState({ residents: [rabbit, wellspring] });
    const report = advanceGladeDay(state, TODAY, () => 0).report;
    expect(report?.foraged).toEqual([
      { residentId: rabbit.id, ingredientId: "berries" },
      { residentId: wellspring.id, ingredientId: "berries" },
      { residentId: wellspring.id, ingredientId: "berries" },
    ]);
  });

  it("reports the soothe bonus and how many visitors received it", () => {
    const state = makeGladeState({
      residents: [makeResident("hedgehog")], // 1 soother
    });
    // rng 0.4 draws two visitors, both calmed on arrival.
    const report = advanceGladeDay(state, TODAY, () => 0.4).report;
    expect(report?.soothedTrust).toBe(3);
    expect(report?.soothedVisitors).toBe(2);
  });

  it("does not count visitors already capped below the threshold as soothed", () => {
    const state = makeGladeState({
      speciesTrust: { robin: tameThresholdFor("robin") - 1 },
      residents: [makeResident("hedgehog")], // 1 soother
    });
    // rng 0 draws only robin, which is already at the cap and gains nothing.
    const report = advanceGladeDay(state, TODAY, () => 0).report;
    expect(report?.soothedTrust).toBe(3);
    expect(report?.soothedVisitors).toBe(0);
  });

  it("reports no soothed visitors without soother residents", () => {
    const report = advanceGladeDay(makeGladeState(), TODAY, () => 0.5).report;
    expect(report?.soothedTrust).toBe(0);
    expect(report?.soothedVisitors).toBe(0);
  });

  it("reports today's visitor species in draw order", () => {
    const result = advanceGladeDay(makeGladeState(), TODAY, () => 0.999);
    expect(result.report?.visitorSpeciesIds).toEqual(
      result.state.visitors.map((v) => v.speciesId),
    );
  });

  it("draws no visitors once every species is a resident", () => {
    const allSpecies = Object.keys(SPECIES) as SpeciesId[];
    const state = makeGladeState({
      residents: allSpecies.map((id) => makeResident(id)),
    });
    const result = advanceGladeDay(state, TODAY, () => 0.5);
    expect(result.state.visitors).toEqual([]);
    expect(result.report?.visitorSpeciesIds).toEqual([]);
  });
});

describe("pickDailyVisitors", () => {
  it("never picks a resident species", () => {
    const state = makeGladeState({ residents: [makeResident("rabbit")] });
    for (const roll of [0, 0.2, 0.4, 0.6, 0.8, 0.99]) {
      const picked = pickDailyVisitors(state, rngFrom([0, roll]));
      expect(picked).not.toContain("rabbit");
    }
  });

  it("can pick a species that visited yesterday", () => {
    const state = makeGladeState({
      visitors: [makeVisitor({ speciesId: "robin" })],
    });
    expect(pickDailyVisitors(state, rngFrom([0, 0]))).toEqual(["robin"]);
  });

  it("returns an empty set when every species is a resident", () => {
    const allSpecies = Object.keys(SPECIES) as SpeciesId[];
    const state = makeGladeState({
      residents: allSpecies.map((id) => makeResident(id)),
    });
    expect(pickDailyVisitors(state, () => 0.5)).toEqual([]);
  });

  it("low rolls pick common species when no beacons are present", () => {
    const picked = pickDailyVisitors(makeGladeState(), rngFrom([0, 0.05]));
    expect(picked).toHaveLength(1);
    expect(SPECIES[picked[0]].rarity).toBe("common");
  });

  it("the highest rolls pick mythic species", () => {
    const picked = pickDailyVisitors(makeGladeState(), rngFrom([0, 0.999]));
    expect(SPECIES[picked[0]].rarity).toBe("mythic");
  });

  it("beacon residents make rare species more likely", () => {
    // With 2 beacons, 20 weight moves from common (70→50) to rare (5→25).
    const state = makeGladeState({
      residents: [makeResident("fox"), makeResident("glimmerwing")],
    });
    const picked = pickDailyVisitors(state, rngFrom([0, 0.8]));
    expect(SPECIES[picked[0]].rarity).toBe("rare");

    // Same roll without beacons stays uncommon.
    const without = pickDailyVisitors(makeGladeState(), rngFrom([0, 0.8]));
    expect(SPECIES[without[0]].rarity).toBe("uncommon");
  });

  it("banked trust makes a species more likely to visit", () => {
    // Only robin and rabbit remain untamed; equal weight without trust.
    const others = (Object.keys(SPECIES) as SpeciesId[]).filter(
      (id) => id !== "robin" && id !== "rabbit",
    );
    const residents = others.map((id) => makeResident(id));

    const untrusted = makeGladeState({ residents });
    expect(pickDailyVisitors(untrusted, rngFrom([0, 0.4]))).toEqual(["robin"]);

    // The same roll flips to rabbit once rabbit has banked trust.
    const trusted = makeGladeState({
      residents,
      speciesTrust: { rabbit: 45 },
    });
    expect(pickDailyVisitors(trusted, rngFrom([0, 0.4]))).toEqual(["rabbit"]);
  });

  it("redistributes weight when a rarity is exhausted", () => {
    // All commons collected: low rolls land on the next rarity instead.
    const commons = (Object.keys(SPECIES) as SpeciesId[]).filter(
      (id) => SPECIES[id].rarity === "common",
    );
    const state = makeGladeState({
      residents: commons.map((id) => makeResident(id)),
    });
    const picked = pickDailyVisitors(state, rngFrom([0, 0.01]));
    expect(picked).toHaveLength(1);
    expect(SPECIES[picked[0]].rarity).not.toBe("common");
  });
});
