"use client";

import { styled } from "next-yak";
import { Button } from "@/components/Button";
import { useBonsai } from "@/lib/bonsai/context";
import type { PotId, StandId } from "@/lib/bonsai/schema";
import { SHOP_CATALOG } from "@/lib/bonsai/schema";

function getItemLabel(id: string): string {
  return SHOP_CATALOG.find((i) => i.id === id)?.label ?? id;
}

export function InventoryPanel() {
  const { state, activePlantedTree, equipPot, equipStand } = useBonsai();
  const inv = state.inventory;

  const hasAnything =
    inv.ownedToolIds.length > 0 ||
    inv.ownedFertiliserIds.length > 0 ||
    inv.ownedPotIds.length > 0 ||
    inv.ownedStandIds.length > 0;

  if (!hasAnything) {
    return (
      <EmptyState>
        <p>
          Your inventory is empty. Buy tools, fertiliser, pots, and stands from
          the shop.
        </p>
      </EmptyState>
    );
  }

  // Count fertiliser quantities
  const fertiliserCounts = inv.ownedFertiliserIds.reduce<
    Record<string, number>
  >((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <PanelWrapper>
      {inv.ownedToolIds.length > 0 && (
        <Section>
          <SectionTitle>Tools</SectionTitle>
          <ItemList>
            {[...new Set(inv.ownedToolIds)].map((id) => (
              <ItemRow key={id}>
                <ItemLabel>{getItemLabel(id)}</ItemLabel>
              </ItemRow>
            ))}
          </ItemList>
        </Section>
      )}

      {Object.keys(fertiliserCounts).length > 0 && (
        <Section>
          <SectionTitle>Fertiliser</SectionTitle>
          <ItemList>
            {Object.entries(fertiliserCounts).map(([id, count]) => (
              <ItemRow key={id}>
                <ItemLabel>
                  {getItemLabel(id)}
                  {count > 1 && <QuantityBadge>×{count}</QuantityBadge>}
                </ItemLabel>
              </ItemRow>
            ))}
          </ItemList>
        </Section>
      )}

      {inv.ownedPotIds.length > 0 && (
        <Section>
          <SectionTitle>Pots</SectionTitle>
          <ItemList>
            {[...new Set(inv.ownedPotIds)].map((potId) => {
              const isEquipped = activePlantedTree?.equippedPotId === potId;
              return (
                <ItemRow key={potId}>
                  <ItemLabel>
                    {getItemLabel(potId)}
                    {isEquipped && <EquippedBadge>Equipped</EquippedBadge>}
                  </ItemLabel>
                  {!isEquipped && activePlantedTree && (
                    <Button
                      intent="secondary"
                      onClick={() =>
                        equipPot(activePlantedTree.id, potId as PotId)
                      }
                      size="sm"
                      variant="outline"
                    >
                      Equip
                    </Button>
                  )}
                </ItemRow>
              );
            })}
          </ItemList>
        </Section>
      )}

      {inv.ownedStandIds.length > 0 && (
        <Section>
          <SectionTitle>Stands</SectionTitle>
          <ItemList>
            {[...new Set(inv.ownedStandIds)].map((standId) => {
              const isEquipped = activePlantedTree?.equippedStandId === standId;
              return (
                <ItemRow key={standId}>
                  <ItemLabel>
                    {getItemLabel(standId)}
                    {isEquipped && <EquippedBadge>Equipped</EquippedBadge>}
                  </ItemLabel>
                  {!isEquipped && activePlantedTree && (
                    <Button
                      intent="secondary"
                      onClick={() =>
                        equipStand(activePlantedTree.id, standId as StandId)
                      }
                      size="sm"
                      variant="outline"
                    >
                      Equip
                    </Button>
                  )}
                </ItemRow>
              );
            })}
          </ItemList>
        </Section>
      )}
    </PanelWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PanelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.4rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
  margin: 0;
`;

const ItemList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const ItemRow = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: light-dark(var(--color-grey-100), var(--color-grey-800));
`;

const ItemLabel = styled.span`
  font-size: 1.3rem;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const QuantityBadge = styled.span`
  font-size: 1.1rem;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
`;

const EquippedBadge = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  color: light-dark(var(--color-primary-600), var(--color-primary-400));
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  font-size: 1.3rem;
`;
