"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { keyframes, styled } from "next-yak";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { CreatureSVG } from "@/components/glade/CreatureSVG";
import { ROLE_LABELS, SPECIES } from "@/lib/glade/catalog";
import { useGlade } from "@/lib/glade/context";
import type { SpeciesId } from "@/lib/glade/schema";
import { useWander } from "./useWander";

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
 * Drifting pollen by day, fireflies at dusk (same specks, recoloured). Laid
 * out by hand rather than randomised so they spread across the scene instead
 * of clumping, and so the set is identical on every render.
 */
const MOTES = [
  { left: 6, top: 74, drift: 14, duration: 17, delay: 0 },
  { left: 15, top: 88, drift: -11, duration: 21, delay: -6 },
  { left: 24, top: 66, drift: 9, duration: 15, delay: -11 },
  { left: 32, top: 92, drift: -15, duration: 23, delay: -3 },
  { left: 39, top: 70, drift: 12, duration: 19, delay: -14 },
  { left: 46, top: 84, drift: -8, duration: 16, delay: -8 },
  { left: 55, top: 72, drift: 10, duration: 18, delay: -4 },
  { left: 63, top: 90, drift: -12, duration: 22, delay: -12 },
  { left: 71, top: 68, drift: 8, duration: 16, delay: -2 },
  { left: 79, top: 86, drift: -14, duration: 20, delay: -9 },
  { left: 87, top: 74, drift: 11, duration: 17, delay: -15 },
  { left: 95, top: 90, drift: -9, duration: 19, delay: -5 },
];

export function GladeScene() {
  const { state, celebration, gladeSceneRef } = useGlade();
  // Which resident is playing its greet animation (cleared when the animation
  // finishes).
  const [greetingId, setGreetingId] = useState<string | null>(null);

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

  const greetResident = (residentId: string) => {
    setGreetingId(residentId);
    // Both animations live on the same element and landing is authored last,
    // so greeting a resident mid-settle would otherwise do nothing visible.
    clearLanding(residentId);
  };
  /*
   * Who is standing still right now. A resident under the pointer or keyboard
   * focus holds its ground so it can be pressed; one mid-greet finishes its
   * bounce where it stands; and the one arriving from a tame stays on the spot the flight is aiming at.
   */
  const [pointedId, setPointedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const heldIds = [
    pointedId,
    focusedId,
    greetingId,
    enteringId,
    landingId,
  ].filter((id): id is string => id !== null);
  const spotRef = useWander(state.residents, gladeSceneRef, heldIds);

  /**
   * Which way the glade still runs on past the edge of the screen, so the
   * edges can say there is more (the same cue as the Meadowmere map).
   */
  const viewRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ west: false, east: false });
  const syncEdges = useCallback(() => {
    const view = viewRef.current;
    if (view === null) return;
    const furthest = view.scrollWidth - view.clientWidth;
    const west = view.scrollLeft > 1;
    const east = view.scrollLeft < furthest - 1;
    setMore((prev) =>
      prev.west === west && prev.east === east ? prev : { west, east },
    );
  }, []);
  useEffect(() => {
    syncEdges();
    window.addEventListener("resize", syncEdges);
    return () => window.removeEventListener("resize", syncEdges);
  }, [syncEdges]);

  return (
    <Frame aria-label="Glade ecosystem" role="region">
      <View
        aria-label="Glade, scrolls sideways"
        onScroll={syncEdges}
        ref={viewRef}
        role="group"
        // Scrollable with the arrow keys even before there are residents to
        // tab to.
        tabIndex={0}
      >
        <World ref={gladeSceneRef}>
          <BackgroundSVG
            aria-hidden="true"
            preserveAspectRatio="none"
            viewBox="0 0 240 60"
          >
            {/* Sky */}
            <rect fill="var(--glade-sky)" height="60" width="240" />
            {/* Clouds, crossing the whole sky over a few minutes */}
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
              <g>
                <ellipse cx="10" cy="11" rx="6" ry="2" />
                <ellipse cx="6" cy="10.4" rx="4" ry="1.5" />
              </g>
            </Clouds>
            {/* Distant treeline */}
            <path
              d="M0 28 Q8 14 16 26 Q24 14 32 24 Q40 18 48 26 Q56 12 64 26 Q72 12 80 24 Q88 16 96 26 Q104 14 112 22 Q120 18 128 26 Q136 18 144 24 Q152 14 160 22 Q168 14 176 26 Q184 18 192 26 Q200 12 208 26 Q216 12 224 22 Q232 12 240 24 L240 60 L0 60 Z"
              fill="var(--glade-treeline)"
            />
            {/* Meadow */}
            <path
              d="M0 34 Q60 26 120 34 Q180 42 240 32 L240 60 L0 60 Z"
              fill="var(--glade-meadow-far)"
            />
            <path
              d="M0 44 Q60 36 120 44 Q180 50 240 42 L240 60 L0 60 Z"
              fill="var(--glade-meadow-near)"
            />
            {/* Pond */}
            <ellipse
              cx="190"
              cy="52"
              fill="var(--glade-pond)"
              rx="16"
              ry="4.5"
            />
            <PondShine
              cx="190"
              cy="51.4"
              fill="var(--glade-pond-shine)"
              rx="12"
              ry="3"
            />
            {/* Flowers */}
            <Blooms>
              <circle cx="12" cy="50" fill="var(--glade-bloom-pink)" r="1" />
              <circle cx="28" cy="55" fill="var(--glade-bloom-gold)" r="1" />
              <circle cx="46" cy="52" fill="var(--glade-bloom-pink)" r="1" />
              <circle cx="70" cy="56" fill="var(--glade-bloom-gold)" r="1" />
              <circle cx="88" cy="49" fill="var(--glade-bloom-white)" r="0.8" />
              <circle cx="110" cy="54" fill="var(--glade-bloom-pink)" r="1" />
              <circle cx="132" cy="51" fill="var(--glade-bloom-gold)" r="1" />
              <circle
                cx="150"
                cy="56"
                fill="var(--glade-bloom-white)"
                r="0.8"
              />
              <circle cx="166" cy="50" fill="var(--glade-bloom-pink)" r="1" />
              <circle cx="222" cy="55" fill="var(--glade-bloom-gold)" r="1" />
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

          {state.residents.map((resident) => {
            const species = SPECIES[resident.speciesId];
            const displayName = resident.name ?? species.name;
            return (
              <ResidentSpot
                data-walking="false"
                key={resident.id}
                ref={spotRef(resident.id)}
                // Home until the wander loop takes over; it writes this
                // transform directly from then on.
                style={{
                  transform: `translate(${resident.position.x}%, ${resident.position.y}%)`,
                }}
              >
                <ResidentAnchor
                  data-entering={
                    enteringId === resident.id ? "true" : undefined
                  }
                >
                  <ResidentButton
                    // Nothing is written on the creature itself, so its name
                    // and role are carried here.
                    aria-label={`${displayName} — ${ROLE_LABELS[species.benefitRole]}`}
                    onBlur={() =>
                      setFocusedId((id) => (id === resident.id ? null : id))
                    }
                    onClick={() => greetResident(resident.id)}
                    onFocus={() => setFocusedId(resident.id)}
                    onPointerEnter={() => setPointedId(resident.id)}
                    onPointerLeave={() =>
                      setPointedId((id) => (id === resident.id ? null : id))
                    }
                    type="button"
                  >
                    <GreetWrapper
                      data-greeting={
                        greetingId === resident.id ? "true" : undefined
                      }
                      data-landing={
                        landingId === resident.id ? "true" : undefined
                      }
                      onAnimationEnd={(e) => {
                        // The idle loop's animationend (and any future child
                        // animation) bubbles up here; only the greet bounce
                        // and landing settle on this element should clear
                        // state.
                        if (e.target !== e.currentTarget) return;
                        setGreetingId((id) => (id === resident.id ? null : id));
                        clearLanding(resident.id);
                      }}
                    >
                      <Facing>
                        <IdleWrapper
                          data-motion={IDLE_MOTIONS[resident.speciesId].motion}
                          style={idleStyle(
                            resident.speciesId,
                            resident.position.x,
                          )}
                        >
                          <CreatureSVG
                            size={52}
                            speciesId={resident.speciesId}
                          />
                        </IdleWrapper>
                      </Facing>
                    </GreetWrapper>
                  </ResidentButton>
                </ResidentAnchor>
              </ResidentSpot>
            );
          })}
        </World>
      </View>

      {/* Decoration for a scroll you perform on the glade itself, so these
            stay out of the tab order and out of the pointer's way. */}
      {more.west && (
        <WestEdge aria-hidden>
          <ChevronLeft size={22} />
        </WestEdge>
      )}
      {more.east && (
        <EastEdge aria-hidden>
          <ChevronRight size={22} />
        </EastEdge>
      )}

      {state.residents.length === 0 && (
        <EmptyMessage>
          The glade is quiet… tame your first visitor to start the ecosystem.
        </EmptyMessage>
      )}
    </Frame>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Frame = styled.div`
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
  /* Out of the page's centred column to the edges of the viewport. The page
     clips sideways overflow at the root, so the scrollbar's few pixels of
     100vw never turn into a page-wide sideways scroll. */
  width: 100vw;
  margin-inline: calc(50% - 50vw);
  box-shadow: 0 2px 12px
    color-mix(in oklch, var(--color-grey-900) 15%, transparent);
`;

/** The window onto the glade, which scrolls sideways like the Vale's map. */
const View = styled.div`
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;

  &:focus-visible {
    outline: 3px solid var(--color-primary-400);
    outline-offset: -3px;
  }
`;

/**
 * The whole glade: wider than any screen, so there is always somewhere to
 * wander off to. The floor keeps a phone's glade from being a cramped strip;
 * the multiple gives a wide screen room to scroll too.
 */
const World = styled.div`
  position: relative;
  width: max(200%, 1400px);
  height: 320px;
  overflow: hidden;
`;

/** Where the glade runs on past the edge of the screen. */
const Edge = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2rem;
  display: flex;
  align-items: center;
  pointer-events: none;
  color: light-dark(var(--color-grey-900), #fff);
`;

const WestEdge = styled(Edge)`
  left: 0;
  justify-content: flex-start;
  background: linear-gradient(
    to right,
    light-dark(rgb(255 255 255 / 0.7), rgb(0 0 0 / 0.55)),
    transparent
  );
`;

const EastEdge = styled(Edge)`
  right: 0;
  justify-content: flex-end;
  background: linear-gradient(
    to left,
    light-dark(rgb(255 255 255 / 0.7), rgb(0 0 0 / 0.55)),
    transparent
  );
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

// Crosses the full 240-unit viewBox with the cloud fully clear at both ends.
const cloudDrift = keyframes`
  from { transform: translateX(-24px); }
  to   { transform: translateX(266px); }
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
    animation-duration: 230s;
    animation-delay: -50s;
  }
  & > g:nth-child(2) {
    animation-duration: 330s;
    animation-delay: -190s;
  }
  & > g:nth-child(3) {
    animation-duration: 280s;
    animation-delay: -120s;
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
  & > circle:nth-child(6) {
    animation-delay: -4.6s;
  }
  & > circle:nth-child(7) {
    animation-delay: -2s;
  }
  & > circle:nth-child(8) {
    animation-delay: -3.2s;
  }
  & > circle:nth-child(9) {
    animation-delay: -5.1s;
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

/**
 * A layer the size of the whole glade, moved by the wander loop: a translate
 * in percent of its own box is a translate in percent of the glade, so the
 * resident's position needs no measuring and moves on the compositor alone.
 */
const ResidentSpot = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`;

/** Centres the resident on the spot's top-left corner, its position. */
const ResidentAnchor = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  pointer-events: auto;

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

/** Turns the creature (not its name tag) to face the way it is heading. */
const Facing = styled.div`
  transform: scaleX(var(--facing, 1));
  transition: transform 240ms var(--ease-out);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// Walking gaits, swapped in for the idle loop while a resident is on the move.
// Quicker than the idle loops, since each one is a step rather than a breath.
const gaitHop = keyframes`
  0%, 100% { transform: translateY(0) scale(1.04, 0.96); }
  45%      { transform: translateY(-10px) scale(0.97, 1.04); }
`;

const gaitScurry = keyframes`
  0%, 100% { transform: translateY(0) rotate(-1.5deg); }
  50%      { transform: translateY(-2px) rotate(1.5deg); }
`;

const gaitWaddle = keyframes`
  0%, 100% { transform: rotate(-6deg); }
  50%      { transform: rotate(6deg); }
`;

const gaitProwl = keyframes`
  0%, 100% { transform: translateY(1px) scaleY(0.97); }
  50%      { transform: translateY(-1px) scaleY(1); }
`;

const gaitAmble = keyframes`
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  25%, 75% { transform: translateY(-3px) rotate(0deg); }
  50%      { transform: translateY(0) rotate(2deg); }
`;

const gaitFlutter = keyframes`
  0%, 100% { transform: translateY(0) rotate(-3deg); }
  50%      { transform: translateY(-6px) rotate(3deg); }
`;

const gaitDrift = keyframes`
  0%, 100% { opacity: 1; transform: translateY(0) rotate(-4deg); }
  50%      { opacity: 0.8; transform: translateY(-5px) rotate(4deg); }
`;

const gaitGlide = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(-3px) scale(1.04, 0.98); }
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

  /* One gait per idle archetype, so a creature walks the way it stands. */
  [data-walking="true"] & {
    animation-delay: 0s;
    animation-timing-function: ease-in-out;
  }
  [data-walking="true"] &[data-motion="hop"] {
    animation-name: ${gaitHop};
    animation-duration: 0.42s;
  }
  [data-walking="true"] &[data-motion="twitch"] {
    animation-name: ${gaitScurry};
    animation-duration: 0.2s;
  }
  [data-walking="true"] &[data-motion="waddle"] {
    animation-name: ${gaitWaddle};
    animation-duration: 0.6s;
  }
  [data-walking="true"] &[data-motion="prowl"] {
    animation-name: ${gaitProwl};
    animation-duration: 0.7s;
  }
  [data-walking="true"] &[data-motion="sway"] {
    animation-name: ${gaitAmble};
    animation-duration: 1s;
  }
  [data-walking="true"] &[data-motion="bob"] {
    animation-name: ${gaitFlutter};
    animation-duration: 0.36s;
  }
  [data-walking="true"] &[data-motion="shimmer"] {
    animation-name: ${gaitDrift};
    animation-duration: 1.8s;
  }
  [data-walking="true"] &[data-motion="breathe"] {
    animation-name: ${gaitGlide};
    animation-duration: 1.2s;
  }

  @media (prefers-reduced-motion: reduce) {
    /* Matched on the attribute, not the bare element: a media query adds no
       specificity, so a plain rule here loses to every [data-motion="…"]
       above it and the idle loops keep running. The walking rules outrank
       even that, so they are named too, although nothing walks here. */
    &[data-motion],
    [data-walking] &[data-motion] {
      animation: none;
    }
  }
`;
