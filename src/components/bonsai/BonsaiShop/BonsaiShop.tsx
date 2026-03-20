"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { styled } from "next-yak";
import { useState } from "react";
import { Button } from "@/components/Button";
import { useBonsai } from "@/lib/bonsai/context";
import type {
  ShopCategory,
  ShopItem,
  ShopItemId,
  SpeciesId,
} from "@/lib/bonsai/schema";
import { SHOP_CATALOG } from "@/lib/bonsai/schema";
import { usePoints } from "@/lib/points/context";

const CATEGORIES: { value: ShopCategory; label: string }[] = [
  { value: "species", label: "Seeds" },
  { value: "tool", label: "Tools" },
  { value: "fertiliser", label: "Fertiliser" },
  { value: "pot", label: "Pots" },
  { value: "stand", label: "Stands" },
];

function useOwnedCount(itemId: ShopItemId, category: ShopCategory) {
  const { state } = useBonsai();
  const inv = state.inventory;
  switch (category) {
    case "species":
      return inv.ownedSpeciesIds.filter((id) => id === itemId).length;
    case "tool":
      return inv.ownedToolIds.filter((id) => id === itemId).length;
    case "fertiliser":
      return inv.ownedFertiliserIds.filter((id) => id === itemId).length;
    case "pot":
      return inv.ownedPotIds.filter((id) => id === itemId).length;
    case "stand":
      return inv.ownedStandIds.filter((id) => id === itemId).length;
  }
}

function isSpeciesFullyOwned(
  itemId: ShopItemId,
  state: ReturnType<typeof useBonsai>["state"],
) {
  const alreadyPlanted = state.trees.some((t) => t.speciesId === itemId);
  const inInventory = state.inventory.ownedSpeciesIds.includes(
    itemId as SpeciesId,
  );
  return alreadyPlanted || inInventory;
}

function ShopCard({ item }: { item: ShopItem }) {
  const { buyItem, state } = useBonsai();
  const { points } = usePoints();
  const [feedback, setFeedback] = useState<"insufficient" | null>(null);
  const ownedCount = useOwnedCount(item.id, item.category);

  const speciesOwned =
    item.category === "species" && isSpeciesFullyOwned(item.id, state);
  const canAfford = points >= item.cost;

  const isDisabled = !canAfford || speciesOwned;

  const handleBuy = () => {
    if (speciesOwned) return;
    const success = buyItem(item.id);
    if (!success) {
      setFeedback("insufficient");
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <ItemName>{item.label}</ItemName>
        <Cost>
          <CoinDot />
          {item.cost}
        </Cost>
      </CardHeader>
      <ItemDescription>{item.description}</ItemDescription>
      <CardFooter>
        {speciesOwned ? (
          <OwnedBadge>
            {state.trees.some((t) => t.speciesId === item.id)
              ? "Planted"
              : "In inventory"}
          </OwnedBadge>
        ) : ownedCount > 0 ? (
          <OwnedBadge>Owned: {ownedCount}</OwnedBadge>
        ) : null}
        {!speciesOwned && (
          <Button
            disabled={isDisabled}
            intent="primary"
            onClick={handleBuy}
            size="sm"
            variant="outline"
          >
            Buy
          </Button>
        )}
      </CardFooter>
      {feedback === "insufficient" && (
        <FeedbackMsg>Not enough points</FeedbackMsg>
      )}
    </Card>
  );
}

export function BonsaiShop() {
  const items = SHOP_CATALOG;

  return (
    <ShopRoot defaultValue="species">
      <ShopTabsList aria-label="Shop categories">
        {CATEGORIES.map(({ value, label }) => (
          <ShopTab key={value} value={value}>
            {label}
          </ShopTab>
        ))}
      </ShopTabsList>

      {CATEGORIES.map(({ value }) => (
        <Tabs.Content key={value} value={value}>
          <ShopGrid>
            {items
              .filter((item) => item.category === value)
              .map((item) => (
                <ShopCard item={item} key={item.id} />
              ))}
          </ShopGrid>
        </Tabs.Content>
      ))}
    </ShopRoot>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ShopRoot = styled(Tabs.Root)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ShopTabsList = styled(Tabs.List)`
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  flex-wrap: wrap;
`;

const ShopTab = styled(Tabs.Trigger)`
  background: none;
  border: none;
  padding: 0.5rem 0.75rem;
  font-size: 1.3rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 150ms ease, border-color 150ms ease;

  &[data-state="active"] {
    color: light-dark(var(--color-primary-600), var(--color-primary-400));
    border-bottom-color: light-dark(var(--color-primary-600), var(--color-primary-400));
  }

  &:hover:not([data-state="active"]) {
    color: light-dark(var(--color-grey-700), var(--color-grey-200));
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
    border-radius: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const ShopGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
`;

const Card = styled.div`
  background: light-dark(var(--color-grey-50), var(--color-grey-900));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  border-radius: 8px;
  padding: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
`;

const ItemName = styled.span`
  font-size: 1.3rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-800), var(--color-grey-100));
  line-height: 1.3;
`;

const Cost = styled.span`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 1.3rem;
  font-weight: 700;
  color: #f59e0b;
  white-space: nowrap;
  flex-shrink: 0;
`;

const CoinDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ffe066, #f59e0b);
  display: inline-block;
  flex-shrink: 0;
`;

const ItemDescription = styled.p`
  font-size: 1.2rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
  margin: 0;
  line-height: 1.4;
  flex: 1;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
`;

const OwnedBadge = styled.span`
  font-size: 1.1rem;
  color: light-dark(var(--color-primary-600), var(--color-primary-400));
  font-weight: 600;
`;

const FeedbackMsg = styled.p`
  font-size: 1.1rem;
  color: var(--color-danger-500, #ef4444);
  margin: 0;
  text-align: right;
`;
