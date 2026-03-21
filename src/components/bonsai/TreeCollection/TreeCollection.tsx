"use client";

import { styled } from "next-yak";
import { Button } from "@/components/Button";
import { useBonsai } from "@/lib/bonsai/context";
import type { SpeciesId } from "@/lib/bonsai/schema";
import { getGrowthLabel, SPECIES_CONFIG } from "@/lib/bonsai/schema";

export function TreeCollection() {
  const { state, switchActiveTree, plantTree } = useBonsai();

  const ownedSeeds = state.inventory.ownedSpeciesIds;

  return (
    <CollectionWrapper>
      {state.trees.length > 0 && (
        <Section>
          <SectionTitle>Your Trees</SectionTitle>
          <TreeGrid>
            {state.trees.map((tree) => {
              const config = SPECIES_CONFIG[tree.speciesId];
              const isActive = tree.id === state.activePlantedTreeId;
              return (
                <TreeCard data-active={isActive} key={tree.id}>
                  <TreeEmoji aria-hidden="true">{config.emoji}</TreeEmoji>
                  <TreeInfo>
                    <TreeName>{config.label}</TreeName>
                    <TreeStage>
                      {getGrowthLabel(tree.activeDaysCount)} ·{" "}
                      {tree.activeDaysCount}{" "}
                      {tree.activeDaysCount === 1 ? "day" : "days"}
                    </TreeStage>
                  </TreeInfo>
                  {!isActive && (
                    <Button
                      intent="secondary"
                      onClick={() => switchActiveTree(tree.id)}
                      size="sm"
                      variant="outline"
                    >
                      Set Active
                    </Button>
                  )}
                  {isActive && <ActiveBadge>Active</ActiveBadge>}
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
                    onClick={() => plantTree(speciesId as SpeciesId)}
                    size="sm"
                    variant="solid"
                  >
                    Plant
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

const TreeCard = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  border: 2px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  background: light-dark(var(--color-grey-50), var(--color-grey-900));
  transition: border-color 150ms ease;

  &[data-active="true"] {
    border-color: light-dark(var(--color-primary-400), var(--color-primary-500));
    background: light-dark(var(--color-primary-50), var(--color-grey-800));
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

const ActiveBadge = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  color: light-dark(var(--color-primary-600), var(--color-primary-400));
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
