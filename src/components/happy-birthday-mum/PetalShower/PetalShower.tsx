"use client";

import { keyframes, styled } from "next-yak";
import { type CSSProperties, useEffect, useState } from "react";

const COLORS = [
  "var(--color-rose-300)",
  "var(--color-rose-400)",
  "var(--color-primary-300)",
  "var(--color-primary-400)",
  "var(--color-orange-300)",
];

const NOTES = ["♪", "♫", "♩", "♬"];

const PIECE_COUNT = 44;
const FALL_MS = 3400;

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  sway: number;
  spin: number;
  color: string;
  note: string | null;
}

function generatePieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, id) => ({
    id,
    left: Math.random() * 100,
    delay: Math.random() * 600,
    duration: FALL_MS - 800 + Math.random() * 1200,
    sway: 20 + Math.random() * 40,
    spin: 180 + Math.random() * 360,
    color: COLORS[id % COLORS.length],
    // Roughly one in four pieces is a music note; the rest are petals.
    note: id % 4 === 0 ? NOTES[(id / 4) % NOTES.length] : null,
  }));
}

/**
 * Petals and music notes drifting down the screen whenever `triggerCount`
 * increases. Petals fall slower than paper confetti and sway side to side
 * on the way, like blossom coming off a tree in a breeze.
 */
export function PetalShower({ triggerCount }: { triggerCount: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (triggerCount === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setPieces(generatePieces());
    const timeout = setTimeout(() => setPieces([]), FALL_MS + 1000);
    return () => clearTimeout(timeout);
  }, [triggerCount]);

  if (pieces.length === 0) return null;

  return (
    <Overlay aria-hidden="true">
      {pieces.map((piece) => (
        <Faller
          key={piece.id}
          style={
            {
              "--left": `${piece.left}%`,
              "--delay": `${piece.delay}ms`,
              "--duration": `${piece.duration}ms`,
            } as CSSProperties
          }
        >
          <Swayer
            style={
              {
                "--sway": `${piece.sway}px`,
                "--spin": `${piece.spin}deg`,
                "--color": piece.color,
              } as CSSProperties
            }
          >
            {piece.note ? <Note>{piece.note}</Note> : <Petal />}
          </Swayer>
        </Faller>
      ))}
    </Overlay>
  );
}

// ─── Animations ─────────────────────────────────────────────────────────────

const fall = keyframes`
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    transform: translateY(105vh);
    opacity: 0;
  }
`;

const sway = keyframes`
  0%, 100% {
    transform: translateX(calc(-1 * var(--sway))) rotate(0deg);
  }
  50% {
    transform: translateX(var(--sway)) rotate(var(--spin));
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

// Falling and swaying live on separate elements so each keeps its own
// timing: the fall is one long linear drop, the sway a repeating ease.
const Faller = styled.span`
  position: absolute;
  top: -24px;
  left: var(--left);
  animation: ${fall} var(--duration) linear var(--delay) forwards;
`;

const Swayer = styled.span`
  display: block;
  animation: ${sway} 1.6s ease-in-out infinite;
`;

const Petal = styled.span`
  display: block;
  width: 12px;
  height: 9px;
  background: var(--color);
  border-radius: 80% 0 80% 0;
`;

const Note = styled.span`
  display: block;
  font-size: 1.2rem;
  line-height: 1;
  color: var(--color);
`;
