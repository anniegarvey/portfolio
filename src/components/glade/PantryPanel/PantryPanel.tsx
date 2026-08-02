"use client";

import { Coins } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/Button";
import { ALL_INGREDIENT_IDS, INGREDIENTS } from "@/lib/glade/catalog";
import { useGlade } from "@/lib/glade/context";
import { usePoints } from "@/lib/points/context";

export function PantryPanel() {
  const { state, buyIngredient } = useGlade();
  const { points } = usePoints();

  return (
    <Grid>
      {ALL_INGREDIENT_IDS.map((id) => (
        <Item key={id}>
          <ItemName>
            {INGREDIENTS[id].name} ×{state.pantry.ingredients[id] ?? 0}
          </ItemName>
          <Button
            disabled={points < INGREDIENTS[id].cost}
            onClick={() => buyIngredient(id)}
            size="sm"
            variant="outline"
          >
            Buy <Coins aria-hidden size={13} /> {INGREDIENTS[id].cost}
          </Button>
        </Item>
      ))}
    </Grid>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
