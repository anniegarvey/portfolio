"use client";

import { styled } from "next-yak";
import { CreatureSVG } from "@/components/glade/CreatureSVG";
import { SPECIES } from "@/lib/glade/catalog";
import { useGlade } from "@/lib/glade/context";

const ROLE_LABELS: Record<string, string> = {
  forager: "Forager — gathers an ingredient each day",
  soother: "Soother — calms wild visitors each day",
  beacon: "Beacon — attracts rarer visitors",
  muse: "Muse — boosts skill XP",
};

export function GladeScene() {
  const { state } = useGlade();

  return (
    <Scene aria-label="Glade ecosystem" role="img">
      <BackgroundSVG preserveAspectRatio="none" viewBox="0 0 100 60">
        <title>A peaceful forest glade</title>
        {/* Sky */}
        <rect fill="var(--glade-sky, #cfe8d8)" height="60" width="100" />
        {/* Distant treeline */}
        <path
          d="M0 28 Q8 18 16 26 Q22 14 30 24 Q38 12 46 22 Q54 14 62 24 Q70 12 78 22 Q86 16 94 26 Q97 22 100 26 L100 60 L0 60 Z"
          fill="#86a87c"
        />
        {/* Meadow */}
        <path d="M0 34 Q50 26 100 36 L100 60 L0 60 Z" fill="#a4c48a" />
        <path d="M0 44 Q50 36 100 46 L100 60 L0 60 Z" fill="#b6d29a" />
        {/* Pond */}
        <ellipse cx="80" cy="52" fill="#9ad1d4" rx="13" ry="4.5" />
        <ellipse
          cx="80"
          cy="51.4"
          fill="#bde2f5"
          opacity="0.6"
          rx="10"
          ry="3"
        />
        {/* Flowers */}
        <circle cx="12" cy="50" fill="#e8a4c4" r="1" />
        <circle cx="20" cy="55" fill="#f2d06b" r="1" />
        <circle cx="34" cy="52" fill="#e8a4c4" r="1" />
        <circle cx="55" cy="56" fill="#f2d06b" r="1" />
        <circle cx="45" cy="49" fill="#ffffff" r="0.8" />
      </BackgroundSVG>

      {state.residents.length === 0 ? (
        <EmptyMessage>
          The glade is quiet… tame your first visitor to start the ecosystem.
        </EmptyMessage>
      ) : (
        state.residents.map((resident) => {
          const species = SPECIES[resident.speciesId];
          return (
            <ResidentSpot
              key={resident.id}
              style={{
                left: `${resident.position.x}%`,
                top: `${resident.position.y}%`,
              }}
              title={`${species.name} · ${ROLE_LABELS[species.benefitRole]}`}
            >
              <CreatureSVG size={52} speciesId={resident.speciesId} />
              <ResidentName>{species.name}</ResidentName>
            </ResidentSpot>
          );
        })
      )}
    </Scene>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Scene = styled.div`
  position: relative;
  width: 100%;
  height: 280px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px
    color-mix(in oklch, var(--color-grey-900) 15%, transparent);
`;

const BackgroundSVG = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
`;

const EmptyMessage = styled.p`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 1rem;
  text-align: center;
  font-style: italic;
  color: var(--color-grey-700);
`;

const ResidentSpot = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ResidentName = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-grey-800);
  background: color-mix(in oklch, white 70%, transparent);
  padding: 0 0.4rem;
  border-radius: 8px;
`;
