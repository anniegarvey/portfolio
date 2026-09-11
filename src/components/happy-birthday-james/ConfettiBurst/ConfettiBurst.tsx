"use client";

import { keyframes, styled } from "next-yak";
import { type CSSProperties, useEffect, useState } from "react";

const COLORS = [
  "var(--color-primary-400)",
  "var(--color-teal-400)",
  "var(--color-secondary-400)",
  "var(--color-orange-400)",
  "var(--color-rose-400)",
];

const PIECE_COUNT = 40;
const FALL_MS = 2600;

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  color: string;
  round: boolean;
}

function generatePieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, id) => ({
    id,
    left: Math.random() * 100,
    delay: Math.random() * 300,
    duration: FALL_MS - 400 + Math.random() * 800,
    drift: Math.random() * 160 - 80,
    spin: 360 + Math.random() * 540,
    color: COLORS[id % COLORS.length],
    round: id % 2 === 0,
  }));
}

/**
 * Fires a shower of on-brand confetti (the same five accent colors as the
 * nav's rainbow line) whenever `triggerCount` increases. A ref-counted key
 * rather than a boolean, so re-triggering while a burst is still falling
 * still reads as a change and starts a fresh one.
 */
export function ConfettiBurst({ triggerCount }: { triggerCount: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (triggerCount === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setPieces(generatePieces());
    const timeout = setTimeout(() => setPieces([]), FALL_MS + 400);
    return () => clearTimeout(timeout);
  }, [triggerCount]);

  if (pieces.length === 0) return null;

  return (
    <Overlay aria-hidden="true">
      {pieces.map((piece) => (
        <Piece
          $round={piece.round}
          key={piece.id}
          style={
            {
              "--left": `${piece.left}%`,
              "--delay": `${piece.delay}ms`,
              "--duration": `${piece.duration}ms`,
              "--drift": `${piece.drift}px`,
              "--spin": `${piece.spin}deg`,
              "--color": piece.color,
            } as CSSProperties
          }
        />
      ))}
    </Overlay>
  );
}

// ─── Animations ─────────────────────────────────────────────────────────────

const fall = keyframes`
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--drift), 105vh) rotate(var(--spin));
    opacity: 0;
  }
`;

// ─── Styles ─────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 1000;
`;

const Piece = styled.span<{ $round: boolean }>`
  position: absolute;
  top: -16px;
  left: var(--left);
  width: 9px;
  height: 9px;
  background: var(--color);
  border-radius: ${({ $round }) => ($round ? "50%" : "2px")};
  animation: ${fall} var(--duration) linear var(--delay) forwards;
`;
