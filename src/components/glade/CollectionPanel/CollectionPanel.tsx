"use client";

import { css, keyframes, styled } from "next-yak";
import { useState } from "react";
import { CreatureSVG } from "@/components/glade/CreatureSVG";
import { ResidentDetail } from "@/components/glade/ResidentDetail";
import { Modal } from "@/components/Modal";
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
  // Which resident's details are open. Each species is tamed at most once, so
  // the resident stands for its whole entry.
  const [openId, setOpenId] = useState<string | null>(null);
  const residentsBySpecies = new Map(
    state.residents.map((r) => [r.speciesId, r]),
  );
  // The species tamed this session, so opening the tab after a tame points
  // straight at the entry that just turned from a silhouette into a creature.
  const newestSpeciesId =
    state.residents.find((r) => r.id === tamedResidentId)?.speciesId ?? null;
  const open = state.residents.find((r) => r.id === openId) ?? null;
  const openSpecies = open === null ? null : SPECIES[open.speciesId];

  return (
    <>
      <Grid>
        {ALL_SPECIES_IDS.map((speciesId) => {
          const species = SPECIES[speciesId];
          const resident = residentsBySpecies.get(speciesId);
          const isNew = speciesId === newestSpeciesId ? "true" : undefined;
          if (resident === undefined) {
            return (
              <Entry data-new={isNew} key={speciesId}>
                <CreatureSVG silhouette size={56} speciesId={speciesId} />
                <EntryName>???</EntryName>
                <EntryMeta>{species.rarity}</EntryMeta>
              </Entry>
            );
          }
          return (
            <EntryButton
              data-new={isNew}
              key={speciesId}
              onClick={() => setOpenId(resident.id)}
              type="button"
            >
              <CreatureSVG size={56} speciesId={speciesId} />
              <EntryName>{resident.name ?? species.name}</EntryName>
              <EntryMeta>
                {species.rarity} · {ROLE_LABELS[species.benefitRole]}
              </EntryMeta>
            </EntryButton>
          );
        })}
      </Grid>

      {open !== null && openSpecies !== null && (
        <Modal
          description={`Details for your ${openSpecies.name}.`}
          isOpen
          onClose={() => setOpenId(null)}
          title={open.name ?? openSpecies.name}
        >
          <ResidentDetail resident={open} />
        </Modal>
      )}
    </>
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

const entryStyles = css`
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

const Entry = styled.div`
  ${entryStyles}
`;

/** A tamed creature's entry, which opens its details. */
const EntryButton = styled.button`
  ${entryStyles}
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition: border-color 150ms var(--ease-out);

  &:hover {
    border-color: light-dark(
      var(--color-primary-300),
      var(--color-primary-600)
    );
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
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
