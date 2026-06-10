import { RECIPES } from "./catalog";
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
