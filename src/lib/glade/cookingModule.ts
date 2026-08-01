import { INGREDIENTS, RECIPES } from "./catalog";
import type { GladeState, IngredientId, TreatId } from "./schema";
import { gainXp } from "./skillsModule";

/**
 * Adds one ingredient to the pantry. Caller is responsible for spending
 * points first when the ingredient is bought (foraged ingredients are free).
 */
export function addIngredient(
  state: GladeState,
  ingredientId: IngredientId,
): GladeState {
  return {
    ...state,
    pantry: {
      ...state.pantry,
      ingredients: {
        ...state.pantry.ingredients,
        [ingredientId]: (state.pantry.ingredients[ingredientId] ?? 0) + 1,
      },
    },
  };
}

/** Ingredients still short of a recipe's requirements, keyed by the amount needed. */
export function missingIngredients(
  state: GladeState,
  treatId: TreatId,
): Partial<Record<IngredientId, number>> {
  const recipe = RECIPES[treatId];
  const missing: Partial<Record<IngredientId, number>> = {};
  for (const [ingredientId, needed] of Object.entries(recipe.ingredients)) {
    const id = ingredientId as IngredientId;
    const have = state.pantry.ingredients[id] ?? 0;
    if (have < needed) missing[id] = needed - have;
  }
  return missing;
}

/** Points cost to buy every ingredient in a shortfall map (e.g. from missingIngredients). */
export function missingIngredientsCost(
  missing: Partial<Record<IngredientId, number>>,
): number {
  return Object.entries(missing).reduce(
    (total, [ingredientId, count]) =>
      total + INGREDIENTS[ingredientId as IngredientId].cost * count,
    0,
  );
}

/** Adds ingredients to the pantry in the given amounts. */
export function addIngredients(
  state: GladeState,
  amounts: Partial<Record<IngredientId, number>>,
): GladeState {
  const ingredients = { ...state.pantry.ingredients };
  for (const [ingredientId, count] of Object.entries(amounts)) {
    const id = ingredientId as IngredientId;
    ingredients[id] = (ingredients[id] ?? 0) + count;
  }
  return {
    ...state,
    pantry: { ...state.pantry, ingredients },
  };
}

/** True when the recipe's tier is unlocked and all ingredients are in stock. */
export function canCook(state: GladeState, treatId: TreatId): boolean {
  const recipe = RECIPES[treatId];
  if (state.skills["treat-cooking"].tier < recipe.requiredTier) return false;
  return Object.entries(recipe.ingredients).every(
    ([ingredientId, needed]) =>
      (state.pantry.ingredients[ingredientId as IngredientId] ?? 0) >= needed,
  );
}

/**
 * Cooks one treat, consuming its ingredients and granting Treat Cooking XP.
 * Returns the unchanged state if the recipe can't be cooked.
 */
export function cookTreat(state: GladeState, treatId: TreatId): GladeState {
  if (!canCook(state, treatId)) return state;
  const recipe = RECIPES[treatId];

  const ingredients = { ...state.pantry.ingredients };
  for (const [ingredientId, needed] of Object.entries(recipe.ingredients)) {
    const id = ingredientId as IngredientId;
    ingredients[id] = (ingredients[id] ?? 0) - needed;
  }

  const cooked: GladeState = {
    ...state,
    pantry: {
      ingredients,
      treats: {
        ...state.pantry.treats,
        [treatId]: (state.pantry.treats[treatId] ?? 0) + 1,
      },
    },
  };
  return gainXp(cooked, "treat-cooking");
}
