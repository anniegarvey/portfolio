"use client";

import { styled } from "next-yak";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { CreatureSVG } from "@/components/glade/CreatureSVG";
import { ResidentNameForm } from "@/components/glade/ResidentNameForm";
import { RoleBadge } from "@/components/glade/RoleBadge";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, SPECIES } from "@/lib/glade/catalog";
import { useGlade } from "@/lib/glade/context";
import type { Resident } from "@/lib/glade/schema";

function formatTamedDate(dateString: string): string {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export interface ResidentDetailProps {
  resident: Resident;
}

/**
 * A resident's details, opened from its Collection entry. The modal around it
 * carries the resident's name as its title, so this starts at what kind of
 * creature it is.
 */
export function ResidentDetail({ resident }: ResidentDetailProps) {
  const { nameResident } = useGlade();
  const [renaming, setRenaming] = useState(false);

  // Saving removes the form (and the focused Save button) from the DOM;
  // hand focus back to the Rename button so keyboard users aren't dropped.
  const renameButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef(false);
  useEffect(() => {
    if (!renaming && returnFocusRef.current) {
      returnFocusRef.current = false;
      renameButtonRef.current?.focus();
    }
  }, [renaming]);

  const species = SPECIES[resident.speciesId];
  const role = species.benefitRole;

  return (
    <Layout>
      <Portrait>
        <CreatureSVG size={56} speciesId={resident.speciesId} />
      </Portrait>
      <Info>
        {resident.name !== undefined && (
          <SpeciesNote>The {species.name}</SpeciesNote>
        )}
        <Meta>
          {species.rarity} · tamed {formatTamedDate(resident.tamedDate)}
        </Meta>
        <Benefit>
          <RoleBadge role={role} />
          <span>
            <strong>{ROLE_LABELS[role]}</strong> — {ROLE_DESCRIPTIONS[role]}
          </span>
        </Benefit>
        {renaming ? (
          <ResidentNameForm
            autoFocus
            initialValue={resident.name}
            label="New name"
            onSubmit={(name) => {
              nameResident(resident.id, name);
              returnFocusRef.current = true;
              setRenaming(false);
            }}
            placeholder={species.name}
            submitLabel="Save"
          />
        ) : (
          <Button
            onClick={() => setRenaming(true)}
            ref={renameButtonRef}
            size="sm"
            variant="ghost"
          >
            Rename
          </Button>
        )}
      </Info>
    </Layout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Layout = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const Portrait = styled.div`
  display: grid;
  place-items: center;
  padding: 0.25rem;
  border-radius: 10px;
  background: light-dark(#eaf3e2, var(--color-grey-900));
`;

const Info = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
`;

const SpeciesNote = styled.p`
  margin: 0;
  font-weight: 600;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const Meta = styled.p`
  margin: 0;
  font-size: 0.8rem;
  text-transform: capitalize;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const Benefit = styled.p`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
`;
