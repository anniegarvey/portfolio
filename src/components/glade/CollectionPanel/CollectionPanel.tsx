"use client";

import { keyframes, styled } from "next-yak";
import { CreatureSVG } from "@/components/glade/CreatureSVG";
import { ALL_SPECIES_IDS, SPECIES } from "@/lib/glade/catalog";
import { useGlade } from "@/lib/glade/context";

const ROLE_LABELS: Record<string, string> = {
  forager: "Forager",
  soother: "Soother",
  beacon: "Beacon",
  muse: "Muse",
  herald: "Herald",
  wellspring: "Wellspring",
};

export function CollectionPanel() {
  const { state, tamedResidentId } = useGlade();
  const residentSpecies = new Set(state.residents.map((r) => r.speciesId));
  // The species tamed this session, so opening the tab after a tame points
  // straight at the entry that just turned from a silhouette into a creature.
  const newestSpeciesId =
    state.residents.find((r) => r.id === tamedResidentId)?.speciesId ?? null;

  return (
    <Grid>
      {ALL_SPECIES_IDS.map((speciesId) => {
        const species = SPECIES[speciesId];
        const collected = residentSpecies.has(speciesId);
        return (
          <Entry
            data-new={speciesId === newestSpeciesId ? "true" : undefined}
            key={speciesId}
          >
            <CreatureSVG
              silhouette={!collected}
              size={56}
              speciesId={speciesId}
            />
            <EntryName>{collected ? species.name : "???"}</EntryName>
            <EntryMeta>
              {species.rarity}
              {collected ? ` · ${ROLE_LABELS[species.benefitRole]}` : ""}
            </EntryMeta>
          </Entry>
        );
      })}
    </Grid>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 0.75rem;
`;

/* A ring that widens and fades, so the newest entry announces itself once
   without the grid around it moving. */
const justCollected = keyframes`
  0%   { box-shadow: 0 0 0 0 var(--color-primary-400); }
  70%  { box-shadow: 0 0 0 6px color-mix(in oklch, var(--color-primary-400) 0%, transparent); }
  100% { box-shadow: 0 0 0 0 color-mix(in oklch, var(--color-primary-400) 0%, transparent); }
`;

const Entry = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 0.5rem;
  border-radius: 10px;
  background: light-dark(var(--color-grey-50), var(--color-grey-800));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  text-align: center;

  &[data-new="true"] {
    border-color: light-dark(
      var(--color-primary-400),
      var(--color-primary-500)
    );
    animation: ${justCollected} 900ms var(--ease-out) both;
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-new="true"] {
      animation: none;
    }
  }
`;

const EntryName = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
`;

const EntryMeta = styled.span`
  font-size: 0.75rem;
  text-transform: capitalize;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;
