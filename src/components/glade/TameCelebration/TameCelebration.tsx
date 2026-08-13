"use client";

import { keyframes, styled } from "next-yak";
import { type CSSProperties, useEffect } from "react";
import { CreatureSVG } from "@/components/glade/CreatureSVG";
import { FLIGHT_MS } from "@/components/glade/TameCelebration/timing";
import { useGlade } from "@/lib/glade/context";

export function TameCelebration() {
  const { celebration, clearCelebration } = useGlade();

  // Under reduced motion the overlay is hidden, so onAnimationEnd never fires.
  // Clear immediately so the resident becomes visible without waiting.
  useEffect(() => {
    if (!celebration) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      clearCelebration();
      return;
    }
    // Safety-net: clear if onAnimationEnd somehow doesn't fire (tab hidden,
    // etc). Derived from FLIGHT_MS rather than a fixed number so it can never
    // fire before the flight it is meant to catch actually lands.
    const fallback = setTimeout(clearCelebration, FLIGHT_MS + 200);
    return () => clearTimeout(fallback);
  }, [celebration, clearCelebration]);

  if (!celebration) return null;

  const { fromRect, speciesId, toX, toY, scrollX, scrollY } = celebration;
  // Centre the flying element on the portrait centre. Every value here was
  // captured in the same moment, so the distance is right as it stands; only
  // the starting anchor is converted to page coordinates, because the element
  // is laid out in the page and not the viewport. That is what lets the glade
  // shift under a mid-flight scroll — or under the reflow when the tamed
  // visitor's card shrinks — without the creature missing it.
  const viewportX = fromRect.left + fromRect.width / 2;
  const viewportY = fromRect.top + fromRect.height / 2;
  const fromX = viewportX + scrollX;
  const fromY = viewportY + scrollY;
  const dx = toX - viewportX;
  const dy = toY - viewportY;
  // Resident SVG is 52px; portrait is 72px → scale down to match on landing.
  const endScale = (52 / 72).toFixed(4);

  return (
    <FlyingCreature
      aria-hidden="true"
      onAnimationEnd={clearCelebration}
      style={
        {
          left: fromX,
          top: fromY,
          "--dx": `${dx}px`,
          "--dy": `${dy}px`,
          "--end-scale": endScale,
          "--flight-duration": `${FLIGHT_MS}ms`,
        } as CSSProperties
      }
    >
      <CreatureSVG size={72} speciesId={speciesId} />
    </FlyingCreature>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

/*
 * The transform at 0% centres the element on the portrait (left/top point at
 * the portrait centre, then -50% shifts back). The midpoint lifts the creature
 * well above the straight line between the two, so it arcs across the page the
 * way something with wings would rather than sliding there; the tilt leans into
 * the climb and levels off for the landing.
 *
 * `--land-lift` corrects for the resident spot centring its creature and its
 * name label together: the spot's centre sits roughly half a label below the
 * creature itself, and it is the creature the flight has to meet. Landing on
 * the pixel matters because the resident replaces this element with no fade —
 * see ResidentSpot in GladeScene.
 */
const flyToGlade = keyframes`
  0% {
    transform: translate(-50%, -50%) scale(1) rotate(0deg);
  }
  45% {
    transform:
      translate(calc(var(--dx) * 0.45 - 50%), calc(var(--dy) * 0.45 - 50% - 56px))
      scale(0.88) rotate(-6deg);
  }
  100% {
    transform:
      translate(calc(var(--dx) - 50%), calc(var(--dy) - 50% - var(--land-lift)))
      scale(var(--end-scale)) rotate(0deg);
  }
`;

const FlyingCreature = styled.div`
  --land-lift: 10px;

  /*
   * Laid out in the page rather than the viewport, so the flight survives a
   * scroll. That relies on nothing between here and the root establishing a
   * containing block: no ancestor may take position, transform, filter,
   * perspective or contain without this being revisited.
   */
  position: absolute;
  pointer-events: none;
  /* Clears every layer this app stacks (the highest is a popover at 60). */
  z-index: 100;
  /* Decelerating into the landing, so the arrival is the calm part. The
     duration comes in from FLIGHT_MS, so the card that waits for this flight
     to land is timing itself against the real number. */
  animation: ${flyToGlade} var(--flight-duration) var(--ease-out) both;

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;
