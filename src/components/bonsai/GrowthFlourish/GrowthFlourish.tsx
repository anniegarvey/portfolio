"use client";

import { keyframes, styled } from "next-yak";
import type { ReactNode } from "react";
import type { GrowthEvent } from "@/lib/bonsai/growthEvents";

/*
 * A garden tree is 90px wide, so "Now a Sapling" would cover the sapling it is
 * congratulating. The stage name alone fits; the full sentence is what the
 * page announces, and what the roomier tending view says.
 */
function label(event: GrowthEvent, variant: "mini" | "full"): string {
  if (event.newStage) {
    return variant === "mini" ? event.newStage : `Now a ${event.newStage}`;
  }
  return `+${event.daysGained} ${event.daysGained === 1 ? "day" : "days"}`;
}

/**
 * Marks the moment a tree grew: the days it gained rise away out of the pot,
 * and crossing into a new growth stage adds a bloom of light from the base.
 * The tree's own surge lives in `StaticTreeSVG`, which knows where its soil is.
 *
 * Decorative only — every signal here is `aria-hidden`. The growth is
 * announced once, from the page, so a garden of five trees does not read out
 * five times over.
 */
export function GrowthFlourish({
  event,
  variant,
  children,
}: {
  /** The growth to celebrate, or null when the tree is just standing there. */
  event: GrowthEvent | null;
  /** `mini` is the garden's 90px tree; `full` is the tending modal's. */
  variant: "mini" | "full";
  children: ReactNode;
}) {
  return (
    <Frame>
      {children}
      {event && (
        <Signals aria-hidden="true" data-variant={variant}>
          {event.newStage && <Bloom />}
          <Floater data-stage={event.newStage ? true : undefined}>
            {label(event, variant)}
          </Floater>
        </Signals>
      )}
    </Frame>
  );
}

// ─── Animations ───────────────────────────────────────────────────────────────

const floatUp = keyframes`
  0%   { opacity: 0; transform: translate(-50%, 6px); }
  18%  { opacity: 1; }
  65%  { opacity: 1; transform: translate(-50%, -26px); }
  100% { opacity: 0; transform: translate(-50%, -40px); }
`;

const bloom = keyframes`
  0%   { opacity: 0; transform: translate(-50%, 50%) scale(0.3); }
  30%  { opacity: 0.9; }
  100% { opacity: 0; transform: translate(-50%, 50%) scale(1.7); }
`;

// ─── Styles ───────────────────────────────────────────────────────────────────

const Frame = styled.div`
  position: relative;
`;

const Signals = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`;

/*
 * Rises out of the pot rather than dropping in from the top of the box: a
 * seedling occupies the bottom tenth of its viewBox, so anything anchored to
 * the top would float in empty sky, disconnected from the plant it describes.
 */
const Floater = styled.span`
  position: absolute;
  left: 50%;
  bottom: 8%;
  transform: translate(-50%, 0);
  /* Absolutely positioned from the centre line, so without an explicit width
     it shrinks to the 45px left over on its right and wraps "+1 day" onto two
     lines. max-content restores one line; the cap keeps the longest stage name
     from overhanging a 90px garden tree far enough to clip at the garden's
     edge, and lets it wrap if a translation ever runs longer still. */
  width: max-content;
  max-width: 130%;
  text-align: center;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 1px 7px;
  border-radius: 999px;
  color: light-dark(#1f4a12, #a8dc84);
  background: light-dark(rgba(255, 255, 255, 0.85), rgba(0, 0, 0, 0.6));
  animation: ${floatUp} 1800ms var(--ease-out) both;

  &[data-stage] {
    color: light-dark(#6b4408, #f2d489);
  }

  [data-variant="full"] & {
    font-size: 1rem;
    padding: 2px 12px;
    white-space: nowrap;
  }

  /* The text is information, not decoration, so it stays — it just stops
     moving. The provider drops the event a beat later, which removes it. */
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Bloom = styled.span`
  position: absolute;
  left: 50%;
  bottom: 12%;
  width: 130%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    light-dark(rgba(255, 226, 150, 0.95), rgba(255, 232, 168, 0.7)) 0%,
    light-dark(rgba(255, 226, 150, 0.35), rgba(255, 232, 168, 0.25)) 45%,
    transparent 70%
  );
  animation: ${bloom} 1600ms var(--ease-out) both;

  /* Purely decorative, so it goes away entirely rather than sitting lit. */
  @media (prefers-reduced-motion: reduce) {
    display: none;
    animation: none;
  }
`;
