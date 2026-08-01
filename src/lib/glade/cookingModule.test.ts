import { describe, expect, it } from "vitest";
import {
  addIngredient,
  addIngredients,
  canCook,
  cookTreat,
  missingIngredients,
  missingIngredientsCost,
} from "./cookingModule";
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

describe("missingIngredients", () => {
  it("returns the shortfall for each under-stocked ingredient", () => {
    const state = makeGladeState({
      pantry: { ingredients: { honey: 1 }, treats: {} },
    });
    expect(missingIngredients(state, "honey-drops")).toEqual({ oats: 1 });
  });

  it("returns an empty object when the recipe is already fully stocked", () => {
    const state = makeGladeState({
      pantry: { ingredients: { honey: 1, oats: 1 }, treats: {} },
    });
    expect(missingIngredients(state, "honey-drops")).toEqual({});
  });
});

describe("missingIngredientsCost", () => {
  it("sums the cost of each missing ingredient by its shortfall amount", () => {
    // honey costs 5, oats costs 3
    expect(missingIngredientsCost({ honey: 1, oats: 2 })).toBe(11);
  });

  it("is zero for an empty shortfall", () => {
    expect(missingIngredientsCost({})).toBe(0);
  });
});

describe("addIngredients", () => {
  it("adds each ingredient by its given amount to existing stock", () => {
    const state = makeGladeState({
      pantry: { ingredients: { honey: 1 }, treats: {} },
    });
    const next = addIngredients(state, { honey: 2, oats: 1 });
    expect(next.pantry.ingredients).toEqual({ honey: 3, oats: 1 });
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
