"use client";

import { keyframes, styled } from "next-yak";
import { type CSSProperties, useId, useState } from "react";
import { CreatureSVG } from "@/components/glade/CreatureSVG";
import { ResidentDetail } from "@/components/glade/ResidentDetail";
import { RoleBadge } from "@/components/glade/RoleBadge";
import { ROLE_LABELS, SPECIES } from "@/lib/glade/catalog";
import { useGlade } from "@/lib/glade/context";
import type { SpeciesId } from "@/lib/glade/schema";

// ─── Idle Motion ──────────────────────────────────────────────────────────────

type IdleMotion =
  | "hop"
  | "bob"
  | "breathe"
  | "sway"
  | "waddle"
  | "prowl"
  | "shimmer"
  | "twitch";

/**
 * Each species' idle animation in the scene: an archetype fitting how the
 * creature moves, plus a duration giving it its own tempo.
 */
const IDLE_MOTIONS: Record<
  SpeciesId,
  { motion: IdleMotion; duration: number }
> = {
  robin: { motion: "hop", duration: 2.6 },
  rabbit: { motion: "hop", duration: 3.8 },
  squirrel: { motion: "twitch", duration: 4.2 },
  hedgehog: { motion: "waddle", duration: 3.4 },
  mouse: { motion: "twitch", duration: 2.4 },
  wren: { motion: "hop", duration: 2.2 },
  mole: { motion: "waddle", duration: 4.8 },
  fox: { motion: "prowl", duration: 5 },
  deer: { motion: "sway", duration: 5.6 },
  owl: { motion: "breathe", duration: 5.2 },
  badger: { motion: "waddle", duration: 4.4 },
  mosskit: { motion: "sway", duration: 4.8 },
  otter: { motion: "prowl", duration: 3.6 },
  hare: { motion: "twitch", duration: 3 },
  thistledown: { motion: "shimmer", duration: 4.6 },
  glimmerwing: { motion: "bob", duration: 2.6 },
  puffloaf: { motion: "breathe", duration: 4.2 },
  dewsprite: { motion: "shimmer", duration: 3.6 },
  emberveil: { motion: "bob", duration: 2.1 },
  thornwhisper: { motion: "sway", duration: 6.2 },
  mirewing: { motion: "bob", duration: 3.2 },
  fernmother: { motion: "breathe", duration: 6.8 },
};

/** Phase-shifts a resident's idle loop by where it stands, so neighbours
 * sharing a motion never move in lockstep. */
function idleStyle(speciesId: SpeciesId, positionX: number): CSSProperties {
  const { duration } = IDLE_MOTIONS[speciesId];
  return {
    "--idle-duration": `${duration}s`,
    "--idle-delay": `${(-(positionX / 100) * duration).toFixed(2)}s`,
  } as CSSProperties;
}

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
            const displayName = resident.name ?? species.name;
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
                  // The badge is decorative, so the role rides along in the
                  // accessible name (starting with the visible pill text).
                  aria-label={`${displayName} — ${ROLE_LABELS[species.benefitRole]}`}
                  onClick={() => toggleResident(resident.id)}
                  type="button"
                >
                  <GreetWrapper
                    data-greeting={
                      greetingId === resident.id ? "true" : undefined
                    }
                    onAnimationEnd={(e) => {
                      // The idle loop's animationend (and any future child
                      // animation) bubbles up here; only the greet bounce
                      // on this element should clear the greeting.
                      if (e.target === e.currentTarget) setGreetingId(null);
                    }}
                  >
                    <IdleWrapper
                      data-motion={IDLE_MOTIONS[resident.speciesId].motion}
                      style={idleStyle(resident.speciesId, resident.position.x)}
                    >
                      <CreatureSVG size={52} speciesId={resident.speciesId} />
                    </IdleWrapper>
                  </GreetWrapper>
                  <BadgeSlot>
                    <RoleBadge role={species.benefitRole} />
                  </BadgeSlot>
                  <ResidentName>{displayName}</ResidentName>
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
  transition: transform 150ms ease;

  &:hover {
    transform: scale(1.06);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
    border-radius: 8px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover {
      transform: none;
    }
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

// Idle keyframes: small, slow, and grounded so the scene stays calm.
const idleHop = keyframes`
  0%, 55%, 69%, 83%, 100% { transform: translateY(0); }
  62% { transform: translateY(-7px); }
  76% { transform: translateY(-4px); }
`;

const idleBob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

const idleBreathe = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const idleSway = keyframes`
  0%, 100% { transform: rotate(-2.5deg); }
  50% { transform: rotate(2.5deg); }
`;

const idleWaddle = keyframes`
  0%, 100% { transform: rotate(0deg) translateX(0); }
  25% { transform: rotate(-3deg) translateX(-1px); }
  75% { transform: rotate(3deg) translateX(1px); }
`;

const idleProwl = keyframes`
  0%, 100% { transform: translateX(0); }
  30% { transform: translateX(-4px); }
  70% { transform: translateX(4px); }
`;

const idleShimmer = keyframes`
  0%, 100% { opacity: 1; transform: translateY(0); }
  50% { opacity: 0.8; transform: translateY(-3px); }
`;

const idleTwitch = keyframes`
  0%, 70%, 82%, 100% { transform: translateX(0) rotate(0deg); }
  74% { transform: translateX(-2px) rotate(-2deg); }
  78% { transform: translateX(2px) rotate(2deg); }
`;

const IdleWrapper = styled.div`
  /* Ground-level pivot so sways and waddles rock on the feet, not the middle. */
  transform-origin: 50% 90%;
  animation-duration: var(--idle-duration);
  animation-delay: var(--idle-delay);
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;

  &[data-motion="hop"] {
    animation-name: ${idleHop};
  }
  &[data-motion="bob"] {
    animation-name: ${idleBob};
  }
  &[data-motion="breathe"] {
    animation-name: ${idleBreathe};
  }
  &[data-motion="sway"] {
    animation-name: ${idleSway};
  }
  &[data-motion="waddle"] {
    animation-name: ${idleWaddle};
  }
  &[data-motion="prowl"] {
    animation-name: ${idleProwl};
  }
  &[data-motion="shimmer"] {
    animation-name: ${idleShimmer};
  }
  &[data-motion="twitch"] {
    animation-name: ${idleTwitch};
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
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
