"use client";

import { styled } from "next-yak";
import { GardenBackground } from "@/components/bonsai/GardenBackground";
import { BACKGROUND_CONFIGS } from "@/lib/bonsai/backgroundConfigs";
import { useBonsai } from "@/lib/bonsai/context";
import type { BackgroundId } from "@/lib/bonsai/schema";
import { DEFAULT_BACKGROUND_ID, SHOP_CATALOG } from "@/lib/bonsai/schema";

function getItemLabel(id: string): string {
  return SHOP_CATALOG.find((i) => i.id === id)?.label ?? id;
}

export function InventoryPanel() {
  const { state, equipBackground } = useBonsai();
  const inv = state.inventory;
  const equippedBgId = inv.equippedBackgroundId ?? DEFAULT_BACKGROUND_ID;

  // All backgrounds available to equip: the default "garden" is always available,
  // plus any purchased ones.
  const availableBackgrounds: BackgroundId[] = [
    "garden",
    ...inv.ownedBackgroundIds.filter((id) => id !== "garden"),
  ];

  const hasAnything =
    inv.ownedToolIds.length > 0 ||
    inv.ownedFertiliserIds.length > 0 ||
    inv.ownedPotIds.length > 0 ||
    inv.ownedStandIds.length > 0 ||
    availableBackgrounds.length > 1; // more than just the default

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
            {[...new Set(inv.ownedPotIds)].map((potId) => (
              <ItemRow key={potId}>
                <ItemLabel>{getItemLabel(potId)}</ItemLabel>
              </ItemRow>
            ))}
          </ItemList>
        </Section>
      )}

      {inv.ownedStandIds.length > 0 && (
        <Section>
          <SectionTitle>Stands</SectionTitle>
          <ItemList>
            {[...new Set(inv.ownedStandIds)].map((standId) => (
              <ItemRow key={standId}>
                <ItemLabel>{getItemLabel(standId)}</ItemLabel>
              </ItemRow>
            ))}
          </ItemList>
        </Section>
      )}

      {availableBackgrounds.length > 1 && (
        <Section>
          <SectionTitle>Backgrounds</SectionTitle>
          <BackgroundGrid>
            {availableBackgrounds.map((bgId) => {
              const cfg = BACKGROUND_CONFIGS[bgId];
              const isEquipped = bgId === equippedBgId;
              return (
                <BackgroundCard
                  data-equipped={isEquipped || undefined}
                  key={bgId}
                >
                  <BackgroundPreview
                    aria-hidden="true"
                    style={{ borderColor: cfg.borderColor }}
                  >
                    <GardenBackground backgroundId={bgId} />
                  </BackgroundPreview>
                  <BackgroundCardBody>
                    <BackgroundName>{cfg.label}</BackgroundName>
                    <EquipButton
                      disabled={isEquipped}
                      onClick={() => equipBackground(bgId)}
                      type="button"
                    >
                      {isEquipped ? "Equipped" : "Equip"}
                    </EquipButton>
                  </BackgroundCardBody>
                </BackgroundCard>
              );
            })}
          </BackgroundGrid>
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

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  font-size: 1.3rem;
`;

const BackgroundGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
`;

const BackgroundCard = styled.div`
  border-radius: 8px;
  border: 1.5px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  overflow: hidden;
  transition: border-color 150ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  &[data-equipped] {
    border-color: light-dark(var(--color-primary-500), var(--color-primary-400));
  }
`;

const BackgroundPreview = styled.div`
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 52px;
  border-bottom: 1.5px solid transparent;
`;

const BackgroundCardBody = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: light-dark(var(--color-grey-50), var(--color-grey-900));
`;

const BackgroundName = styled.span`
  font-size: 1.2rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;

const EquipButton = styled.button`
  padding: 0.2rem 0.6rem;
  border-radius: 5px;
  font-size: 1.1rem;
  font-family: inherit;
  border: 1.5px solid light-dark(var(--color-primary-400), var(--color-primary-500));
  background: transparent;
  color: light-dark(var(--color-primary-600), var(--color-primary-400));
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.15s;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  &:hover:not(:disabled) {
    background: light-dark(var(--color-primary-50), rgba(100, 160, 80, 0.1));
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
    border-color: light-dark(var(--color-grey-300), var(--color-grey-600));
    color: light-dark(var(--color-grey-500), var(--color-grey-400));
  }
`;
