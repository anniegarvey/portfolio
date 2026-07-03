"use client";

import { styled } from "next-yak";
import { useId, useState } from "react";
import { Button } from "@/components/Button";
import { CreatureSVG } from "@/components/glade/CreatureSVG";
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
  onClose: () => void;
  /** Target of the greet button's aria-controls. */
  id?: string;
}

/** Detail card shown when a resident in the glade scene is greeted. */
export function ResidentDetail({ resident, onClose, id }: ResidentDetailProps) {
  const { nameResident } = useGlade();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState("");
  const headingId = useId();
  const renameInputId = useId();

  const species = SPECIES[resident.speciesId];
  const displayName = resident.name ?? species.name;
  const role = species.benefitRole;

  return (
    <Card aria-labelledby={headingId} id={id}>
      <Portrait>
        <CreatureSVG size={56} speciesId={resident.speciesId} />
      </Portrait>
      <Info>
        <Heading id={headingId}>
          {displayName}
          {resident.name !== undefined && (
            <SpeciesNote> the {species.name}</SpeciesNote>
          )}
        </Heading>
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
          <RenameForm
            onSubmit={(e) => {
              e.preventDefault();
              nameResident(resident.id, draft);
              setRenaming(false);
            }}
          >
            <RenameLabel htmlFor={renameInputId}>New name</RenameLabel>
            <RenameInput
              id={renameInputId}
              maxLength={24}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={species.name}
              value={draft}
            />
            <Button
              disabled={draft.trim() === ""}
              size="sm"
              type="submit"
              variant="outline"
            >
              Save
            </Button>
          </RenameForm>
        ) : (
          <Button
            onClick={() => {
              setDraft(resident.name ?? "");
              setRenaming(true);
            }}
            size="sm"
            variant="ghost"
          >
            Rename
          </Button>
        )}
      </Info>
      <Button
        aria-label="Close details"
        onClick={onClose}
        size="sm"
        variant="ghost"
      >
        Close
      </Button>
    </Card>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Card = styled.section`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  background: light-dark(var(--color-grey-50), var(--color-grey-800));
  border: 1px solid
    light-dark(var(--color-primary-300), var(--color-primary-700));
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

const Heading = styled.h3`
  margin: 0;
  font-size: 1.15rem;
`;

const SpeciesNote = styled.span`
  font-weight: 400;
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

const RenameForm = styled.form`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RenameLabel = styled.label`
  font-size: 0.8rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const RenameInput = styled.input`
  min-width: 0;
  width: 10rem;
  padding: 0.35rem 0.6rem;
  font-size: 0.9rem;
  border-radius: 8px;
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  background: light-dark(white, var(--color-grey-900));
  color: inherit;

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 1px;
  }
`;
