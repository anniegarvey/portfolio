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

/**
 * A slow drift on top of the idle loop, so residents settle into the glade
 * rather than standing rooted to one pixel. Everything is derived from where
 * the resident stands, so its path is stable across renders and no two
 * neighbours trace the same one. Amplitudes stay under 10px and loops run for
 * half a minute: this should read as a living scene at a glance, never as
 * something moving while you're trying to read the page.
 *
 * Unlike the idle loop this takes no phase offset. Every drift starts from
 * where the resident stands, which is the point the tame flight aims at — a
 * resident that mounted mid-flight would otherwise have drifted several pixels
 * clear of its own landing by the time the creature got there. Direction and
 * tempo vary instead, which pulls neighbours apart within a second or two.
 */
function wanderStyle(position: { x: number; y: number }): CSSProperties {
  const towardsRight = Math.floor(position.y) % 2 === 0 ? 1 : -1;
  const upFirst = Math.floor(position.x) % 2 === 0 ? 1 : -1;
  return {
    "--wander-duration": `${(26 + (position.x % 9)).toFixed(1)}s`,
    "--wander-x": `${(towardsRight * (5 + (position.y % 4))).toFixed(1)}px`,
    "--wander-y": `${(upFirst * (3 + (position.x % 3))).toFixed(1)}px`,
  } as CSSProperties;
}

/**
 * Drifting pollen by day, fireflies at dusk (same specks, recoloured). Laid
 * out by hand rather than randomised so they spread across the scene instead
 * of clumping, and so the set is identical on every render.
 */
const MOTES = [
  { left: 12, top: 74, drift: 14, duration: 17, delay: 0 },
  { left: 31, top: 88, drift: -11, duration: 21, delay: -6 },
  { left: 48, top: 66, drift: 9, duration: 15, delay: -11 },
  { left: 64, top: 92, drift: -15, duration: 23, delay: -3 },
  { left: 77, top: 70, drift: 12, duration: 19, delay: -14 },
  { left: 91, top: 84, drift: -8, duration: 16, delay: -8 },
];

export function GladeScene() {
  const { state, celebration, gladeSceneRef } = useGlade();
  // Which resident's detail card is open, and which one is playing its
  // greet animation (cleared when the animation finishes).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [greetingId, setGreetingId] = useState<string | null>(null);
  const detailId = useId();

  /*
   * The resident the tame flight is still carrying, and the one it has just
   * put down, so an arriving resident lands with a settle instead of blinking
   * into place. Derived while rendering rather than in an effect: the settle
   * has to be on the element in the same commit that reveals it, or the
   * resident paints upright for a frame first and then snaps into the squash.
   */
  const enteringId = celebration?.newResidentId ?? null;
  const [flight, setFlight] = useState<{
    carryingId: string | null;
    landedId: string | null;
  }>({ carryingId: null, landedId: null });
  if (flight.carryingId !== enteringId) {
    setFlight({
      carryingId: enteringId,
      landedId: enteringId === null ? flight.carryingId : null,
    });
  }
  const landingId = flight.landedId;
  // Only ever clears the resident that owns the animation: the handler is
  // shared by every resident, so an unguarded clear would let one creature's
  // greet bounce ending cut short another's landing.
  const clearLanding = (residentId: string) =>
    setFlight((current) =>
      current.landedId === residentId
        ? { ...current, landedId: null }
        : current,
    );

  const selected = state.residents.find((r) => r.id === selectedId) ?? null;

  const toggleResident = (residentId: string) => {
    const opening = selectedId !== residentId;
    setSelectedId(opening ? residentId : null);
    setGreetingId(opening ? residentId : null);
    // Both animations live on the same element and landing is authored last,
    // so greeting a resident mid-settle would otherwise do nothing visible.
    clearLanding(residentId);
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
          {/* Clouds, crossing the whole sky over a minute and a half */}
          <Clouds>
            <g>
              <ellipse cx="10" cy="8" rx="7" ry="2.2" />
              <ellipse cx="14" cy="7" rx="5" ry="1.8" />
              <ellipse cx="6.5" cy="7.4" rx="4" ry="1.5" />
            </g>
            <g>
              <ellipse cx="10" cy="16" rx="5.5" ry="1.8" />
              <ellipse cx="13.5" cy="15.2" rx="4" ry="1.4" />
            </g>
          </Clouds>
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
          <PondShine
            cx="80"
            cy="51.4"
            fill="var(--glade-pond-shine)"
            rx="10"
            ry="3"
          />
          {/* Flowers */}
          <Blooms>
            <circle cx="12" cy="50" fill="var(--glade-bloom-pink)" r="1" />
            <circle cx="20" cy="55" fill="var(--glade-bloom-gold)" r="1" />
            <circle cx="34" cy="52" fill="var(--glade-bloom-pink)" r="1" />
            <circle cx="55" cy="56" fill="var(--glade-bloom-gold)" r="1" />
            <circle cx="45" cy="49" fill="var(--glade-bloom-white)" r="0.8" />
          </Blooms>
        </BackgroundSVG>

        {/* Ahead of the residents in the DOM, so nothing drifts over a face. */}
        <Motes aria-hidden="true">
          {MOTES.map((mote) => (
            <Mote
              key={`${mote.left}-${mote.top}`}
              style={
                {
                  left: `${mote.left}%`,
                  top: `${mote.top}%`,
                  "--mote-x": `${mote.drift}px`,
                  "--mote-duration": `${mote.duration}s`,
                  "--mote-delay": `${mote.delay}s`,
                } as CSSProperties
              }
            />
          ))}
        </Motes>

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
                data-entering={enteringId === resident.id ? "true" : undefined}
                key={resident.id}
                style={{
                  left: `${resident.position.x}%`,
                  top: `${resident.position.y}%`,
                  ...wanderStyle(resident.position),
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
                  <Wanderer>
                    <GreetWrapper
                      data-greeting={
                        greetingId === resident.id ? "true" : undefined
                      }
                      data-landing={
                        landingId === resident.id ? "true" : undefined
                      }
                      onAnimationEnd={(e) => {
                        // The idle loop's animationend (and any future child
                        // animation) bubbles up here; only the greet bounce and
                        // landing settle on this element should clear state.
                        if (e.target !== e.currentTarget) return;
                        setGreetingId((id) => (id === resident.id ? null : id));
                        clearLanding(resident.id);
                      }}
                    >
                      <IdleWrapper
                        data-motion={IDLE_MOTIONS[resident.speciesId].motion}
                        style={idleStyle(
                          resident.speciesId,
                          resident.position.x,
                        )}
                      >
                        <CreatureSVG size={52} speciesId={resident.speciesId} />
                      </IdleWrapper>
                    </GreetWrapper>
                    <BadgeSlot>
                      <RoleBadge role={species.benefitRole} />
                    </BadgeSlot>
                    <ResidentName>{displayName}</ResidentName>
                  </Wanderer>
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
  --glade-cloud: light-dark(#ffffff, #37434f);
  /* Pollen catching the light by day; a firefly's glow at dusk. */
  --glade-mote: light-dark(#ffffff, #f2d06b);

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

// ─── Ambient scene ────────────────────────────────────────────────────────────
// Nothing here reports state; it exists so the glade looks like somewhere a
// creature would want to live. Every loop is long, low-amplitude and offset
// from its neighbours, and all of it stops under reduced motion: the painted
// scenery holds the position it was authored at, and the drifting specks —
// which are transparent at rest anyway — are dropped entirely.

// Crosses the full 100-unit viewBox with the cloud fully clear at both ends.
const cloudDrift = keyframes`
  from { transform: translateX(-24px); }
  to   { transform: translateX(126px); }
`;

const Clouds = styled.g`
  fill: var(--glade-cloud);
  opacity: 0.7;

  & > g {
    animation-name: ${cloudDrift};
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }
  & > g:nth-child(1) {
    animation-duration: 96s;
    animation-delay: -22s;
  }
  & > g:nth-child(2) {
    animation-duration: 138s;
    animation-delay: -80s;
  }

  @media (prefers-reduced-motion: reduce) {
    & > g {
      animation: none;
    }
  }
`;

const pondShimmer = keyframes`
  0%, 100% { opacity: 0.5; transform: scaleX(1); }
  50%      { opacity: 0.72; transform: scaleX(1.05); }
`;

const PondShine = styled.ellipse`
  opacity: 0.6;
  /* fill-box so the shine widens about its own centre, not the SVG's origin. */
  transform-box: fill-box;
  transform-origin: center;
  animation: ${pondShimmer} 9s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/* Half a bloom's radius, which at the scene's vertical scale is ~2px. */
const bloomBob = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-0.5px); }
`;

const Blooms = styled.g`
  & > circle {
    animation-name: ${bloomBob};
    animation-duration: 5.5s;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
  }
  & > circle:nth-child(2) {
    animation-delay: -1.3s;
  }
  & > circle:nth-child(3) {
    animation-delay: -2.6s;
  }
  & > circle:nth-child(4) {
    animation-delay: -3.9s;
  }
  & > circle:nth-child(5) {
    animation-delay: -0.7s;
  }

  @media (prefers-reduced-motion: reduce) {
    & > circle {
      animation: none;
    }
  }
`;

const moteDrift = keyframes`
  0%   { opacity: 0; transform: translate3d(0, 0, 0) scale(0.7); }
  25%  { opacity: 0.85; }
  70%  { opacity: 0.85; }
  100% { opacity: 0; transform: translate3d(var(--mote-x), -52px, 0) scale(1); }
`;

const Motes = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

const Mote = styled.span`
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  opacity: 0;
  background: var(--glade-mote);
  /* Transparent by day, so only the dusk fireflies carry a halo. */
  box-shadow: 0 0 5px light-dark(transparent, var(--glade-mote));
  animation: ${moteDrift} var(--mote-duration) var(--mote-delay) ease-in-out
    infinite;

  /* The container is already hidden, so this changes nothing on screen. It is
     here so that "nothing in the scene animates" is true of the declarations
     and not only of what happens to be painted. */
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
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

  /*
   * Hidden while the flying creature is still carrying it. No fade on the way
   * back in: the flight ends on this exact spot and unmounts in the same
   * commit, so an instant swap is invisible where a crossfade would blink.
   * The landing settle below is what sells the arrival.
   */
  &[data-entering="true"] {
    opacity: 0;
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
  transition: transform 150ms var(--ease-out);

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

const wander = keyframes`
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(var(--wander-x), calc(var(--wander-y) * -1)); }
  50% { transform: translate(calc(var(--wander-x) * 0.4), var(--wander-y)); }
  75% { transform: translate(calc(var(--wander-x) * -1), calc(var(--wander-y) * -0.5)); }
`;

/**
 * Inside the button rather than around it, so the resident drifts but the
 * thing you are aiming at does not. A target that walks away from the cursor
 * is a tax on exactly the people this app is for, and a button whose own box
 * never moves is one that can be aimed at. The drifted creature stays
 * clickable because hit testing follows a transform, so the live target is
 * the button's box together with wherever the creature currently is; only the
 * focus ring, drawn on the untransformed box, can sit up to 9px off centre.
 */
const Wanderer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation-name: ${wander};
  animation-duration: var(--wander-duration);
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const greetBounce = keyframes`
  0%   { transform: scale(1); }
  30%  { transform: scale(1.12) translateY(-6px); }
  60%  { transform: scale(0.96); }
  100% { transform: scale(1); }
`;

/* Takes the weight of the landing, then shakes it off. */
const landSettle = keyframes`
  0%   { transform: scale(1.16, 0.84) translateY(5px); }
  40%  { transform: scale(0.95, 1.06) translateY(-5px); }
  70%  { transform: scale(1.03, 0.98) translateY(0); }
  100% { transform: scale(1); }
`;

const GreetWrapper = styled.div`
  display: grid;
  place-items: center;
  /* Squash on the feet rather than the belly. */
  transform-origin: 50% 90%;

  &[data-greeting="true"] {
    animation: ${greetBounce} 500ms var(--ease-out);
  }

  &[data-landing="true"] {
    animation: ${landSettle} 520ms var(--ease-out);
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-greeting="true"],
    &[data-landing="true"] {
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
    /* Matched on the attribute, not the bare element: a media query adds no
       specificity, so a plain rule here loses to every [data-motion="…"]
       above it and the idle loops keep running. */
    &[data-motion] {
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
