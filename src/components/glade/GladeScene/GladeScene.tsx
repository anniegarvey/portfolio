"use client";

import { keyframes, styled } from "next-yak";
import { useId, useState } from "react";
import { CreatureSVG } from "@/components/glade/CreatureSVG";
import { ResidentDetail } from "@/components/glade/ResidentDetail";
import { RoleBadge } from "@/components/glade/RoleBadge";
import { SPECIES } from "@/lib/glade/catalog";
import { useGlade } from "@/lib/glade/context";

export function GladeScene() {
  const { state, celebration, gladeSceneRef } = useGlade();
  // Which resident's detail card is open, and which one is playing its
  // greet animation (cleared when the animation finishes).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [greetingId, setGreetingId] = useState<string | null>(null);
  const detailId = useId();

  const selected = state.residents.find((r) => r.id === selectedId) ?? null;

  const toggleResident = (residentId: string) => {
    const opening = selectedId !== residentId;
    setSelectedId(opening ? residentId : null);
    setGreetingId(opening ? residentId : null);
  };

  return (
    <>
      <Scene aria-label="Glade ecosystem" ref={gladeSceneRef} role="region">
        <BackgroundSVG
          aria-hidden="true"
          preserveAspectRatio="none"
          viewBox="0 0 100 60"
        >
          {/* Sky */}
          <rect fill="var(--glade-sky)" height="60" width="100" />
          {/* Distant treeline */}
          <path
            d="M0 28 Q8 18 16 26 Q22 14 30 24 Q38 12 46 22 Q54 14 62 24 Q70 12 78 22 Q86 16 94 26 Q97 22 100 26 L100 60 L0 60 Z"
            fill="var(--glade-treeline)"
          />
          {/* Meadow */}
          <path
            d="M0 34 Q50 26 100 36 L100 60 L0 60 Z"
            fill="var(--glade-meadow-far)"
          />
          <path
            d="M0 44 Q50 36 100 46 L100 60 L0 60 Z"
            fill="var(--glade-meadow-near)"
          />
          {/* Pond */}
          <ellipse cx="80" cy="52" fill="var(--glade-pond)" rx="13" ry="4.5" />
          <ellipse
            cx="80"
            cy="51.4"
            fill="var(--glade-pond-shine)"
            opacity="0.6"
            rx="10"
            ry="3"
          />
          {/* Flowers */}
          <circle cx="12" cy="50" fill="var(--glade-bloom-pink)" r="1" />
          <circle cx="20" cy="55" fill="var(--glade-bloom-gold)" r="1" />
          <circle cx="34" cy="52" fill="var(--glade-bloom-pink)" r="1" />
          <circle cx="55" cy="56" fill="var(--glade-bloom-gold)" r="1" />
          <circle cx="45" cy="49" fill="var(--glade-bloom-white)" r="0.8" />
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
                data-entering={
                  celebration?.newResidentId === resident.id
                    ? "true"
                    : undefined
                }
                key={resident.id}
                style={{
                  left: `${resident.position.x}%`,
                  top: `${resident.position.y}%`,
                }}
              >
                <ResidentButton
                  // Only referenced while open so the id always resolves.
                  aria-controls={
                    selectedId === resident.id ? detailId : undefined
                  }
                  aria-expanded={selectedId === resident.id}
                  onClick={() => toggleResident(resident.id)}
                  type="button"
                >
                  <GreetWrapper
                    data-greeting={
                      greetingId === resident.id ? "true" : undefined
                    }
                    onAnimationEnd={() => setGreetingId(null)}
                  >
                    <CreatureSVG size={52} speciesId={resident.speciesId} />
                  </GreetWrapper>
                  <BadgeSlot>
                    <RoleBadge role={species.benefitRole} />
                  </BadgeSlot>
                  <ResidentName>{resident.name ?? species.name}</ResidentName>
                </ResidentButton>
              </ResidentSpot>
            );
          })
        )}
      </Scene>

      {selected !== null && (
        <ResidentDetail
          id={detailId}
          key={selected.id}
          onClose={() => setSelectedId(null)}
          resident={selected}
        />
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Scene = styled.div`
  /* Daytime palette in light mode; a calmer dusk palette in dark mode so the
     scene doesn't glow against a dark page (light-dark follows color-scheme,
     covering both the manual theme toggle and the system default). */
  --glade-sky: light-dark(#cfe8d8, #25303b);
  --glade-treeline: light-dark(#86a87c, #36453a);
  --glade-meadow-far: light-dark(#a4c48a, #3e4c39);
  --glade-meadow-near: light-dark(#b6d29a, #495843);
  --glade-pond: light-dark(#9ad1d4, #3a5f64);
  --glade-pond-shine: light-dark(#bde2f5, #6e99a0);
  --glade-bloom-pink: light-dark(#e8a4c4, #8d6a7e);
  --glade-bloom-gold: light-dark(#f2d06b, #a68f52);
  --glade-bloom-white: light-dark(#ffffff, #b7c1bb);

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
  /* Dark text reads on the daytime scene; light text on the dusk scene. */
  color: light-dark(var(--color-grey-700), var(--color-grey-100));
  /* Scrim so the message stays legible over any part of the illustration
     (e.g. the mid-tone treeline), independent of where the text wraps. */
  background: light-dark(
    color-mix(in oklch, white 55%, transparent),
    color-mix(in oklch, black 45%, transparent)
  );
`;

const ResidentSpot = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);

  /* Hidden while the flying animation is in progress; fades in when it lands. */
  &[data-entering="true"] {
    opacity: 0;
  }

  transition: opacity 150ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const ResidentButton = styled.button`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
    border-radius: 8px;
  }
`;

const greetBounce = keyframes`
  0%   { transform: scale(1); }
  30%  { transform: scale(1.12) translateY(-6px); }
  60%  { transform: scale(0.96); }
  100% { transform: scale(1); }
`;

const GreetWrapper = styled.div`
  display: grid;
  place-items: center;

  &[data-greeting="true"] {
    animation: ${greetBounce} 500ms ease;
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-greeting="true"] {
      animation: none;
    }
  }
`;

const BadgeSlot = styled.span`
  position: absolute;
  top: -4px;
  right: -6px;
`;

const ResidentName = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  /* A light pill with dark text on the daytime scene; a dark pill with light
     text on the dusk scene, so the label stays legible in both. */
  color: light-dark(var(--color-grey-800), var(--color-grey-50));
  background: light-dark(
    color-mix(in oklch, white 70%, transparent),
    color-mix(in oklch, black 55%, transparent)
  );
  padding: 0 0.4rem;
  border-radius: 8px;
`;
