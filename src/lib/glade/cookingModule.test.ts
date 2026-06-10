import { describe, expect, it } from "vitest";
import { addIngredient, canCook, cookTreat } from "./cookingModule";
import { makeGladeState, makeSkill } from "./testFixtures";

describe("addIngredient", () => {
  it("adds one ingredient to the pantry", () => {
    const state = makeGladeState();
    const next = addIngredient(addIngredient(state, "berries"), "berries");
    expect(next.pantry.ingredients.berries).toBe(2);
  });
});

describe("canCook", () => {
  it("requires all ingredients in stock", () => {
    const state = makeGladeState({
      pantry: { ingredients: { berries: 1 }, treats: {} },
    });
    expect(canCook(state, "berry-bites")).toBe(false); // needs 2 berries
    expect(canCook(addIngredient(state, "berries"), "berry-bites")).toBe(true);
  });

  it("requires the recipe's cooking tier", () => {
    const state = makeGladeState({
      pantry: { ingredients: { honey: 1, oats: 1 }, treats: {} },
    });
    expect(canCook(state, "honey-drops")).toBe(false); // tier 2 recipe

    const skilled = {
      ...state,
      skills: { ...state.skills, "treat-cooking": makeSkill({ tier: 2 }) },
    };
    expect(canCook(skilled, "honey-drops")).toBe(true);
  });
});

describe("cookTreat", () => {
  it("consumes ingredients, adds the treat, and grants cooking XP", () => {
    const state = makeGladeState({
      pantry: { ingredients: { berries: 3 }, treats: {} },
    });
    const next = cookTreat(state, "berry-bites");
    expect(next.pantry.ingredients.berries).toBe(1);
    expect(next.pantry.treats["berry-bites"]).toBe(1);
    expect(next.skills["treat-cooking"].xp).toBe(1);
  });

  it("returns the state unchanged when the recipe can't be cooked", () => {
    const state = makeGladeState();
    expect(cookTreat(state, "berry-bites")).toBe(state);
  });
});
