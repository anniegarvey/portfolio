import { describe, expect, it } from "vitest";
import { RECIPES, SPECIES, tameThresholdFor } from "./catalog";
import {
  approachTrustGain,
  approachVisitor,
  offerTreat,
  petTrustGain,
  petVisitor,
  treatTrustGain,
} from "./tamingModule";
import { makeGladeState, makeSkill, makeVisitor } from "./testFixtures";

const TODAY = "2026-06-10";
const fixedRng = () => 0.5;

describe("trust math", () => {
  it("approach gain scales with tier and preference match", () => {
    expect(approachTrustGain(1, true)).toBe(9); // (4+2)*1.5
    expect(approachTrustGain(1, false)).toBe(3); // (4+2)*0.5
    expect(approachTrustGain(5, true)).toBe(21); // (4+10)*1.5
  });

  it("pet gain scales with tier and preference match", () => {
    expect(petTrustGain(1, true)).toBe(11); // (5+2)*1.5 rounded
    expect(petTrustGain(1, false)).toBe(4); // (5+2)*0.5 rounded
    expect(petTrustGain(5, false)).toBe(8); // (5+10)*0.5 rounded
  });

  it("favourite treats earn double trust", () => {
    expect(treatTrustGain("berry-bites", false)).toBe(
      RECIPES["berry-bites"].potency,
    );
    expect(treatTrustGain("berry-bites", true)).toBe(
      RECIPES["berry-bites"].potency * 2,
    );
  });
});

describe("offerTreat", () => {
  it("consumes a treat and raises trust by its potency", () => {
    const visitor = makeVisitor({ speciesId: "rabbit" });
    const state = makeGladeState({
      visitors: [visitor],
      pantry: { ingredients: {}, treats: { "berry-bites": 2 } },
    });
    const result = offerTreat(
      state,
      visitor.id,
      "berry-bites",
      TODAY,
      fixedRng,
    );
    expect(result.trustGained).toBe(RECIPES["berry-bites"].potency);
    expect(result.matched).toBe(false);
    expect(result.state.pantry.treats["berry-bites"]).toBe(1);
    expect(result.state.visitors[0].trust).toBe(RECIPES["berry-bites"].potency);
    expect(result.state.visitors[0].actionsToday.treat).toBe(true);
  });

  it("doubles trust for the species' favourite treat", () => {
    const visitor = makeVisitor({ speciesId: "rabbit" });
    expect(SPECIES.rabbit.favouriteTreat).toBe("oat-cakes");
    const state = makeGladeState({
      visitors: [visitor],
      pantry: { ingredients: {}, treats: { "oat-cakes": 1 } },
    });
    const result = offerTreat(state, visitor.id, "oat-cakes", TODAY, fixedRng);
    expect(result.matched).toBe(true);
    expect(result.trustGained).toBe(RECIPES["oat-cakes"].potency * 2);
  });

  it("refuses a second treat the same day", () => {
    const visitor = makeVisitor({
      actionsToday: { treat: true, approach: false, pet: false },
    });
    const state = makeGladeState({
      visitors: [visitor],
      pantry: { ingredients: {}, treats: { "berry-bites": 1 } },
    });
    const result = offerTreat(
      state,
      visitor.id,
      "berry-bites",
      TODAY,
      fixedRng,
    );
    expect(result.trustGained).toBe(null);
    expect(result.state).toBe(state);
  });

  it("does nothing when the pantry has no such treat", () => {
    const visitor = makeVisitor();
    const state = makeGladeState({ visitors: [visitor] });
    const result = offerTreat(
      state,
      visitor.id,
      "berry-bites",
      TODAY,
      fixedRng,
    );
    expect(result.trustGained).toBe(null);
  });

  it("does nothing for an unknown visitor", () => {
    const state = makeGladeState({
      pantry: { ingredients: {}, treats: { "berry-bites": 1 } },
    });
    const result = offerTreat(state, "nope", "berry-bites", TODAY, fixedRng);
    expect(result.trustGained).toBe(null);
  });
});

describe("approachVisitor", () => {
  it("raises trust and grants body-language XP", () => {
    const visitor = makeVisitor({ speciesId: "rabbit" });
    const state = makeGladeState({ visitors: [visitor] });
    const result = approachVisitor(
      state,
      visitor.id,
      "crouch-low", // rabbit's preference
      TODAY,
      fixedRng,
    );
    expect(result.matched).toBe(true);
    expect(result.trustGained).toBe(9);
    expect(result.state.skills["body-language"].xp).toBe(1);
    expect(result.state.visitors[0].actionsToday.approach).toBe(true);
  });

  it("gives reduced (never negative) trust on a mismatch", () => {
    const visitor = makeVisitor({ speciesId: "rabbit" });
    const state = makeGladeState({ visitors: [visitor] });
    const result = approachVisitor(
      state,
      visitor.id,
      "slow-blink",
      TODAY,
      fixedRng,
    );
    expect(result.matched).toBe(false);
    expect(result.trustGained).toBe(3);
    expect(result.state.visitors[0].trust).toBe(3);
  });

  it("refuses a second approach the same day", () => {
    const visitor = makeVisitor({
      actionsToday: { treat: false, approach: true, pet: false },
    });
    const state = makeGladeState({ visitors: [visitor] });
    const result = approachVisitor(
      state,
      visitor.id,
      "crouch-low",
      TODAY,
      fixedRng,
    );
    expect(result.trustGained).toBe(null);
  });

  it("herald residents add bonus trust on matched approaches", () => {
    const visitor = makeVisitor({ speciesId: "rabbit" });
    const baseline = makeGladeState({ visitors: [visitor] });
    const withHerald = makeGladeState({
      visitors: [visitor],
      residents: [
        {
          id: "00000000-0000-4000-8000-000000000099",
          speciesId: "emberveil",
          tamedDate: TODAY,
          position: { x: 50, y: 50 },
        },
      ],
    });
    const baseGain = approachVisitor(
      baseline,
      visitor.id,
      "crouch-low",
      TODAY,
      fixedRng,
    ).trustGained;
    const heraldGain = approachVisitor(
      withHerald,
      visitor.id,
      "crouch-low",
      TODAY,
      fixedRng,
    ).trustGained;
    expect(heraldGain).toBeGreaterThan(baseGain ?? 0);
  });

  it("herald bonus does not apply on mismatched approaches", () => {
    const visitor = makeVisitor({ speciesId: "rabbit" });
    const baseline = makeGladeState({ visitors: [visitor] });
    const withHerald = makeGladeState({
      visitors: [visitor],
      residents: [
        {
          id: "00000000-0000-4000-8000-000000000099",
          speciesId: "emberveil",
          tamedDate: TODAY,
          position: { x: 50, y: 50 },
        },
      ],
    });
    const baseGain = approachVisitor(
      baseline,
      visitor.id,
      "slow-blink", // mismatch
      TODAY,
      fixedRng,
    ).trustGained;
    const heraldGain = approachVisitor(
      withHerald,
      visitor.id,
      "slow-blink", // mismatch
      TODAY,
      fixedRng,
    ).trustGained;
    expect(heraldGain).toBe(baseGain);
  });
});

describe("petVisitor", () => {
  it("raises trust and grants petting-technique XP", () => {
    const visitor = makeVisitor({ speciesId: "rabbit" });
    const state = makeGladeState({ visitors: [visitor] });
    const result = petVisitor(
      state,
      visitor.id,
      "behind-ears", // rabbit's preference
      TODAY,
      fixedRng,
    );
    expect(result.matched).toBe(true);
    expect(result.trustGained).toBe(11);
    expect(result.state.skills["petting-technique"].xp).toBe(1);
  });

  it("refuses a second petting the same day", () => {
    const visitor = makeVisitor({
      actionsToday: { treat: false, approach: false, pet: true },
    });
    const state = makeGladeState({ visitors: [visitor] });
    const result = petVisitor(state, visitor.id, "chin", TODAY, fixedRng);
    expect(result.trustGained).toBe(null);
  });
});

describe("taming", () => {
  it("converts a visitor to a resident at the tame threshold", () => {
    const threshold = tameThresholdFor("robin");
    const visitor = makeVisitor({ speciesId: "robin", trust: threshold - 1 });
    const state = makeGladeState({ visitors: [visitor] });
    const result = petVisitor(state, visitor.id, "back", TODAY, fixedRng);

    expect(result.tamed).toBe(true);
    expect(result.state.visitors).toHaveLength(0);
    expect(result.state.residents).toHaveLength(1);
    const resident = result.state.residents[0];
    expect(resident.speciesId).toBe("robin");
    expect(resident.tamedDate).toBe(TODAY);
    expect(resident.position.x).toBeGreaterThanOrEqual(10);
    expect(resident.position.x).toBeLessThanOrEqual(90);
    expect(resident.position.y).toBeGreaterThanOrEqual(30);
    expect(resident.position.y).toBeLessThanOrEqual(85);
  });

  it("rare species need more trust than common ones", () => {
    expect(tameThresholdFor("dewsprite")).toBeGreaterThan(
      tameThresholdFor("robin"),
    );
  });

  it("legendary and mythic thresholds exceed rare", () => {
    expect(tameThresholdFor("emberveil")).toBeGreaterThan(
      tameThresholdFor("dewsprite"),
    );
    expect(tameThresholdFor("mirewing")).toBeGreaterThan(
      tameThresholdFor("emberveil"),
    );
  });

  it("higher skill tiers tame faster", () => {
    const visitor = makeVisitor({ speciesId: "rabbit" });
    const novice = makeGladeState({ visitors: [visitor] });
    const expert = makeGladeState({
      visitors: [visitor],
      skills: {
        "treat-cooking": makeSkill(),
        "body-language": makeSkill({ tier: 5 }),
        "petting-technique": makeSkill(),
      },
    });
    const noviceGain = approachVisitor(
      novice,
      visitor.id,
      "crouch-low",
      TODAY,
      fixedRng,
    ).trustGained;
    const expertGain = approachVisitor(
      expert,
      visitor.id,
      "crouch-low",
      TODAY,
      fixedRng,
    ).trustGained;
    expect(expertGain).toBeGreaterThan(noviceGain ?? 0);
  });
});
