"use client";

import { keyframes, styled } from "next-yak";
import type { CSSProperties } from "react";
import { CreatureSVG } from "@/components/glade/CreatureSVG";
import { useGlade } from "@/lib/glade/context";

export function TameCelebration() {
  const { celebration, clearCelebration } = useGlade();

  if (!celebration) return null;

  const { fromRect, speciesId, creatureName } = celebration;
  const fromX = fromRect.left + fromRect.width / 2;
  const fromY = fromRect.top + fromRect.height / 2;
  // Fly toward the upper-center of the viewport where GladeScene lives
  const dx = window.innerWidth / 2 - fromX;
  const dy = 140 - fromY;

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
        } as CSSProperties
      }
    >
      <CreatureSVG size={64} speciesId={speciesId} />
      <FlyLabel>{creatureName} joined the glade!</FlyLabel>
    </FlyingCreature>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const flyToGlade = keyframes`
  0%   { opacity: 1; transform: translate(0, 0) scale(1); }
  75%  { opacity: 1; transform: translate(var(--dx), var(--dy)) scale(0.75); }
  100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0.5); }
`;

const FlyingCreature = styled.div`
  position: fixed;
  /* Centre on the capture point so the creature appears to launch from the card */
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  pointer-events: none;
  z-index: 9999;
  animation: ${flyToGlade} 900ms ease-in both;

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

const FlyLabel = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
  color: light-dark(var(--color-primary-700), var(--color-primary-300));
  background: light-dark(
    color-mix(in oklch, white 80%, transparent),
    color-mix(in oklch, black 60%, transparent)
  );
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
`;
