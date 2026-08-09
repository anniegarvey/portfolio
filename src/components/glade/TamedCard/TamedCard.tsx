"use client";

import { keyframes, styled } from "next-yak";
import type { CSSProperties } from "react";
import { CreatureSVG } from "@/components/glade/CreatureSVG";
import { ResidentNameForm } from "@/components/glade/ResidentNameForm";
import { FLIGHT_MS } from "@/components/glade/TameCelebration/timing";
import { ROLE_LABELS, SPECIES } from "@/lib/glade/catalog";
import { useGlade } from "@/lib/glade/context";
import type { WildVisitor } from "@/lib/glade/schema";

const PARTICLE_ANGLES = [0, 60, 120, 180, 240, 300];

/**
 * The tame is one sequence, not three things at once: the creature flies to
 * the glade, lands, and only then does this card confirm it. Holding the badge
 * and sparkles back until the flight ends is what makes the celebration read
 * as cause and effect — so the hold is derived from the flight's own duration
 * rather than restated, and the two cannot drift apart.
 */
const ARRIVAL_DELAY_MS = FLIGHT_MS - 20;

export function TamedCard({ visitor }: { visitor: WildVisitor }) {
  const { state, tamedResidentId, nameResident } = useGlade();

  const species = SPECIES[visitor.speciesId];
  const resident =
    state.residents.find((r) => r.id === tamedResidentId) ?? null;

  return (
    <Card
      style={{ "--arrival-delay": `${ARRIVAL_DELAY_MS}ms` } as CSSProperties}
    >
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

const cardArrive = keyframes`
  from { opacity: 0; transform: scale(0.97); }
  to   { opacity: 1; transform: scale(1); }
`;

/* Takes over the tamed visitor's slot in the grid, so it eases in rather than
   snapping over the card the creature just left. */
const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 12px;
  background: light-dark(var(--color-grey-50), var(--color-grey-800));
  border: 1px solid
    light-dark(var(--color-primary-300), var(--color-primary-700));
  animation: ${cardArrive} 280ms var(--ease-out) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
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
  /*
   * Transparent at rest, filling forwards rather than both ways, so the wait
   * for the creature to land is a wait, not six dots parked on the portrait.
   */
  opacity: 0;
  animation: ${sparkleOut} 650ms var(--arrival-delay) var(--ease-out) forwards;
`;

const badgeArrive = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
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
  /* Filling backwards, so it holds its space in the layout while it waits. */
  animation: ${badgeArrive} 260ms var(--arrival-delay) var(--ease-out) backwards;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
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
