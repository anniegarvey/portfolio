"use client";

import { Coins } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/Button";
import { ALL_TREAT_IDS, INGREDIENTS, RECIPES } from "@/lib/glade/catalog";
import { useGlade } from "@/lib/glade/context";
import {
  canCook,
  missingIngredients,
  missingIngredientsCost,
} from "@/lib/glade/cookingModule";
import { usePoints } from "@/lib/points/context";

export function KitchenPanel() {
  const { state, cookTreat, buyMissingIngredients } = useGlade();
  const { points } = usePoints();
  const cookingTier = state.skills["treat-cooking"].tier;

  return (
    <Panel>
      <Section>
        <SectionTitle>Recipes</SectionTitle>
        <Grid>
          {ALL_TREAT_IDS.map((treatId) => {
            const recipe = RECIPES[treatId];
            const locked = cookingTier < recipe.requiredTier;
            const ingredientList = Object.entries(recipe.ingredients)
              .map(
                ([ingredientId, count]) =>
                  `${count} ${INGREDIENTS[ingredientId as keyof typeof INGREDIENTS].name.toLowerCase()}`,
              )
              .join(", ");
            const missing = missingIngredients(state, treatId);
            const missingCost = missingIngredientsCost(missing);
            return (
              <Item key={treatId}>
                <ItemName>
                  {recipe.name} ×{state.pantry.treats[treatId] ?? 0}
                </ItemName>
                <ItemMeta>
                  {ingredientList} · +{recipe.potency} trust
                </ItemMeta>
                {locked ? (
                  <ItemMeta>
                    Unlocks at Treat Cooking tier {recipe.requiredTier}
                  </ItemMeta>
                ) : (
                  <ButtonRow>
                    <Button
                      disabled={!canCook(state, treatId)}
                      onClick={() => cookTreat(treatId)}
                      size="sm"
                    >
                      Cook
                    </Button>
                    {missingCost > 0 && (
                      <Button
                        disabled={points < missingCost}
                        onClick={() => buyMissingIngredients(treatId)}
                        size="sm"
                        variant="outline"
                      >
                        Buy missing <Coins aria-hidden size={13} />{" "}
                        {missingCost}
                      </Button>
                    )}
                  </ButtonRow>
                )}
              </Item>
            );
          })}
        </Grid>
      </Section>
    </Panel>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 0.75rem;
`;

const Item = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  padding: 0.75rem;
  border-radius: 10px;
  background: light-dark(var(--color-grey-50), var(--color-grey-800));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
`;

const ItemName = styled.span`
  font-weight: 600;
  font-size: 0.95rem;
`;

const ItemMeta = styled.span`
  font-size: 0.8rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;
