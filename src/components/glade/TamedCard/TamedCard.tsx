"use client";

import { keyframes, styled } from "next-yak";
import { type CSSProperties, useId, useState } from "react";
import { Button } from "@/components/Button";
import { CreatureSVG } from "@/components/glade/CreatureSVG";
import { ROLE_LABELS, SPECIES } from "@/lib/glade/catalog";
import { useGlade } from "@/lib/glade/context";
import type { WildVisitor } from "@/lib/glade/schema";

const PARTICLE_ANGLES = [0, 60, 120, 180, 240, 300];

export function TamedCard({ visitor }: { visitor: WildVisitor }) {
  const { state, tamedResidentId, nameResident } = useGlade();
  const [draft, setDraft] = useState("");
  const inputId = useId();

  const species = SPECIES[visitor.speciesId];
  const resident =
    state.residents.find((r) => r.id === tamedResidentId) ?? null;

  return (
    <Card>
      <PortraitWrapper>
        <CreatureSVG size={72} speciesId={visitor.speciesId} />
        <Particles aria-hidden="true">
          {PARTICLE_ANGLES.map((angle) => (
            <Particle
              key={angle}
              style={{ "--angle": `${angle}deg` } as CSSProperties}
            />
          ))}
        </Particles>
      </PortraitWrapper>
      <SuccessBadge>Joined the glade!</SuccessBadge>
      <Name>{resident?.name ?? species.name}</Name>
      <RoleNote>Now your {ROLE_LABELS[species.benefitRole]}</RoleNote>
      {resident !== null &&
        (resident.name === undefined ? (
          <NameForm
            onSubmit={(e) => {
              e.preventDefault();
              nameResident(resident.id, draft);
            }}
          >
            <NameLabel htmlFor={inputId}>Give them a name</NameLabel>
            <NameRow>
              <NameInput
                id={inputId}
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
                Name
              </Button>
            </NameRow>
          </NameForm>
        ) : (
          <NamedNote>
            Say hello to {resident.name} the {species.name}!
          </NamedNote>
        ))}
    </Card>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 12px;
  background: light-dark(var(--color-grey-50), var(--color-grey-800));
  border: 1px solid
    light-dark(var(--color-primary-300), var(--color-primary-700));
`;

const PortraitWrapper = styled.div`
  position: relative;
  display: grid;
  place-items: center;
  padding: 0.25rem;
  border-radius: 10px;
  background: light-dark(#eaf3e2, var(--color-grey-900));
`;

const sparkleOut = keyframes`
  0%   { opacity: 1; transform: rotate(var(--angle)) translateX(0) scale(1); }
  70%  { opacity: 1; }
  100% { opacity: 0; transform: rotate(var(--angle)) translateX(44px) scale(0); }
`;

const Particles = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: grid;
  place-items: center;

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

const Particle = styled.div`
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: light-dark(var(--color-primary-500), var(--color-primary-400));
  animation: ${sparkleOut} 650ms ease-out both;
`;

const SuccessBadge = styled.span`
  display: inline-block;
  align-self: flex-start;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.1rem 0.5rem;
  border-radius: 8px;
  background: light-dark(var(--color-primary-100), var(--color-primary-900));
  color: light-dark(var(--color-primary-700), var(--color-primary-300));
`;

const Name = styled.h3`
  margin: 0;
  font-size: 1.15rem;
`;

const RoleNote = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const NameForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.25rem;
`;

const NameLabel = styled.label`
  font-size: 0.8rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const NameRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const NameInput = styled.input`
  flex: 1;
  min-width: 0;
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

const NamedNote = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: light-dark(var(--color-primary-700), var(--color-primary-300));
`;
