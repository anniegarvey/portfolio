"use client";

import { keyframes, styled } from "next-yak";
import { type CSSProperties, useEffect } from "react";
import { CreatureSVG } from "@/components/glade/CreatureSVG";
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
    // Safety-net: clear if onAnimationEnd somehow doesn't fire (tab hidden, etc.)
    const fallback = setTimeout(clearCelebration, 1100);
    return () => clearTimeout(fallback);
  }, [celebration, clearCelebration]);

  if (!celebration) return null;

  const { fromRect, speciesId, toX, toY } = celebration;
  // Centre the flying element on the portrait centre.
  const fromX = fromRect.left + fromRect.width / 2;
  const fromY = fromRect.top + fromRect.height / 2;
  const dx = toX - fromX;
  const dy = toY - fromY;
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
        } as CSSProperties
      }
    >
      <CreatureSVG size={72} speciesId={speciesId} />
    </FlyingCreature>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

// The transform at 0% centres the element on the portrait (left/top point at the
// portrait centre, then -50% shifts back). At 90% the creature arrives at the
// resident's exact position, scaled to match the resident SVG size.
const flyToGlade = keyframes`
  0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  90%  { opacity: 1; transform: translate(calc(var(--dx) - 50%), calc(var(--dy) - 50%)) scale(var(--end-scale)); }
  100% { opacity: 0; transform: translate(calc(var(--dx) - 50%), calc(var(--dy) - 50%)) scale(var(--end-scale)); }
`;

const FlyingCreature = styled.div`
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  animation: ${flyToGlade} 900ms ease-in both;

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;
