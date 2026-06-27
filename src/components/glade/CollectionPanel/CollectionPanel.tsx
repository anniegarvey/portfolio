"use client";

import { styled } from "next-yak";
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
  const { state } = useGlade();
  const residentSpecies = new Set(state.residents.map((r) => r.speciesId));

  return (
    <Grid>
      {ALL_SPECIES_IDS.map((speciesId) => {
        const species = SPECIES[speciesId];
        const collected = residentSpecies.has(speciesId);
        return (
          <Entry key={speciesId}>
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
