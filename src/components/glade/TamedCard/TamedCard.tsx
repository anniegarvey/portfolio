"use client";

import { keyframes, styled } from "next-yak";
import type { CSSProperties } from "react";
import { CreatureSVG } from "@/components/glade/CreatureSVG";
import { ResidentNameForm } from "@/components/glade/ResidentNameForm";
import { ROLE_LABELS, SPECIES } from "@/lib/glade/catalog";
import { useGlade } from "@/lib/glade/context";
import type { WildVisitor } from "@/lib/glade/schema";

const PARTICLE_ANGLES = [0, 60, 120, 180, 240, 300];

export function TamedCard({ visitor }: { visitor: WildVisitor }) {
  const { state, tamedResidentId, nameResident } = useGlade();

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
          <ResidentNameForm
            label="Give them a name"
            onSubmit={(name) => nameResident(resident.id, name)}
            placeholder={species.name}
            submitLabel="Name"
          />
        ) : (
          <NamedNote role="status">
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

const NamedNote = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: light-dark(var(--color-primary-700), var(--color-primary-300));
`;
