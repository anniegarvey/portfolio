"use client";

import { styled } from "next-yak";
import { Button } from "@/components/Button";
import { useBonsai } from "@/lib/bonsai/context";
import type { BonsaiTree, SpeciesId } from "@/lib/bonsai/schema";
import { getGrowthLabel, SPECIES_CONFIG } from "@/lib/bonsai/schema";

interface TreeCollectionProps {
  onOpenTree: (tree: BonsaiTree) => void;
}

export function TreeCollection({ onOpenTree }: TreeCollectionProps) {
  const { state, beginPlanting } = useBonsai();

  const ownedSeeds = state.inventory.ownedSpeciesIds;

  return (
    <CollectionWrapper>
      {state.trees.length > 0 && (
        <Section>
          <SectionTitle>Your Trees</SectionTitle>
          <TreeGrid>
            {state.trees.map((tree) => {
              const config = SPECIES_CONFIG[tree.speciesId];
              const isWatered = tree.lastWateredDay === tree.activeDaysCount;
              return (
                <TreeCard
                  key={tree.id}
                  onClick={() => onOpenTree(tree)}
                  type="button"
                >
                  <TreeEmoji aria-hidden="true">{config.emoji}</TreeEmoji>
                  <TreeInfo>
                    <TreeName>{tree.name ?? config.label}</TreeName>
                    <TreeStage>
                      {getGrowthLabel(tree.activeDaysCount)} ·{" "}
                      {tree.activeDaysCount}{" "}
                      {tree.activeDaysCount === 1 ? "day" : "days"}
                    </TreeStage>
                  </TreeInfo>
                  {isWatered ? (
                    <WateredBadge>💧 Watered</WateredBadge>
                  ) : (
                    <DryBadge>Needs water</DryBadge>
                  )}
                </TreeCard>
              );
            })}
          </TreeGrid>
        </Section>
      )}

      {ownedSeeds.length > 0 && (
        <Section>
          <SectionTitle>Plant a Seed</SectionTitle>
          <SeedList>
            {ownedSeeds.map((speciesId, index) => {
              const config = SPECIES_CONFIG[speciesId as SpeciesId];
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: seed units have no stable id
                <SeedRow key={`${speciesId}-${index}`}>
                  <SeedLabel>
                    {config.emoji} {config.label} Seed
                  </SeedLabel>
                  <Button
                    intent="primary"
                    onClick={() => beginPlanting(speciesId as SpeciesId)}
                    size="sm"
                    variant="solid"
                  >
                    Place in garden
                  </Button>
                </SeedRow>
              );
            })}
          </SeedList>
        </Section>
      )}

      {state.trees.length === 0 && ownedSeeds.length === 0 && (
        <EmptyState>
          <p>
            You don&rsquo;t have any trees yet. Buy a seed from the shop to get
            started!
          </p>
        </EmptyState>
      )}
    </CollectionWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CollectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.4rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
  margin: 0;
`;

const TreeGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TreeCard = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  border: 2px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  background: light-dark(var(--color-grey-50), var(--color-grey-900));
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: light-dark(var(--color-primary-400), var(--color-primary-600));
    background: light-dark(var(--color-grey-100), var(--color-grey-800));
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const TreeEmoji = styled.span`
  font-size: 2rem;
  flex-shrink: 0;
`;

const TreeInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const TreeName = styled.p`
  font-size: 1.3rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-800), var(--color-grey-100));
  margin: 0;
`;

const TreeStage = styled.p`
  font-size: 1.1rem;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  margin: 0;
`;

const WateredBadge = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  color: light-dark(#4a7a3a, #6ab860);
  flex-shrink: 0;
`;

const DryBadge = styled.span`
  font-size: 1.1rem;
  color: light-dark(var(--color-grey-400), var(--color-grey-500));
  flex-shrink: 0;
`;

const SeedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SeedRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  background: light-dark(var(--color-grey-100), var(--color-grey-800));
`;

const SeedLabel = styled.span`
  font-size: 1.3rem;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  font-size: 1.3rem;
`;
