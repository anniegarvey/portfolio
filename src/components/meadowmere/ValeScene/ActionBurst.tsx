import { keyframes, styled } from "next-yak";
import type { CSSProperties } from "react";

/**
 * A little shower thrown off a tile when the farmer does something to it: water
 * spraying off a bed, hearts off a petted cat, stars off a harvest. The tile's
 * own settle says "that was you"; this says "and that was lovely".
 */

export type TouchKind = "sow" | "water" | "harvest" | "forage" | "pet";

type Shape = "heart" | "spark" | "drop" | "leaf";

interface Piece {
  shape: Shape;
  /** Where it flies to, in px from the middle of the tile. */
  x: number;
  y: number;
  turn: number;
  delay: number;
  size: number;
}

const PATHS: Record<Shape, string> = {
  heart: "M5 9 L1.3 5.3 A2.3 2.3 0 0 1 5 2.5 A2.3 2.3 0 0 1 8.7 5.3 Z",
  spark: "M5 0.5 L6.1 3.9 L9.5 5 L6.1 6.1 L5 9.5 L3.9 6.1 L0.5 5 L3.9 3.9 Z",
  drop: "M5 0.8 Q8.6 5.4 8.4 6.6 A3.4 3.4 0 0 1 1.6 6.6 Q1.4 5.4 5 0.8 Z",
  leaf: "M1 9 Q1 2 9 1 Q8 8 1 9 Z",
};

/**
 * Each kind of burst, every piece thrown its own way so it never looks
 * stamped. Water falls back down, the rest rise and drift.
 */
const BURSTS: Record<TouchKind, Piece[]> = {
  sow: [
    { shape: "spark", x: -14, y: -22, turn: -30, delay: 0, size: 9 },
    { shape: "spark", x: 15, y: -26, turn: 40, delay: 60, size: 11 },
    { shape: "leaf", x: 2, y: -32, turn: 20, delay: 120, size: 9 },
    { shape: "spark", x: -4, y: -14, turn: 60, delay: 180, size: 7 },
  ],
  water: [
    { shape: "drop", x: -22, y: 6, turn: -40, delay: 0, size: 9 },
    { shape: "drop", x: -10, y: -20, turn: -15, delay: 40, size: 8 },
    { shape: "drop", x: 9, y: -22, turn: 15, delay: 20, size: 9 },
    { shape: "drop", x: 22, y: 4, turn: 40, delay: 70, size: 8 },
    { shape: "spark", x: 0, y: -30, turn: 45, delay: 140, size: 9 },
    { shape: "spark", x: -18, y: -12, turn: -45, delay: 200, size: 7 },
  ],
  harvest: [
    { shape: "spark", x: -24, y: -30, turn: -40, delay: 0, size: 12 },
    { shape: "heart", x: 22, y: -34, turn: 18, delay: 50, size: 12 },
    { shape: "spark", x: 2, y: -46, turn: 50, delay: 90, size: 14 },
    { shape: "heart", x: -30, y: -6, turn: -22, delay: 130, size: 10 },
    { shape: "spark", x: 30, y: -10, turn: 70, delay: 110, size: 10 },
    { shape: "spark", x: -8, y: -24, turn: -60, delay: 200, size: 8 },
    { shape: "heart", x: 12, y: -18, turn: 10, delay: 240, size: 9 },
  ],
  forage: [
    { shape: "leaf", x: -24, y: -22, turn: -80, delay: 0, size: 11 },
    { shape: "spark", x: 20, y: -32, turn: 40, delay: 60, size: 12 },
    { shape: "leaf", x: 26, y: -6, turn: 90, delay: 40, size: 10 },
    { shape: "spark", x: -6, y: -42, turn: -30, delay: 120, size: 10 },
    { shape: "leaf", x: 4, y: -20, turn: 140, delay: 180, size: 9 },
  ],
  pet: [
    { shape: "heart", x: -16, y: -30, turn: -18, delay: 0, size: 12 },
    { shape: "heart", x: 16, y: -26, turn: 20, delay: 90, size: 10 },
    { shape: "heart", x: 0, y: -46, turn: 4, delay: 180, size: 14 },
    { shape: "spark", x: -24, y: -10, turn: -50, delay: 60, size: 8 },
    { shape: "spark", x: 24, y: -40, turn: 50, delay: 240, size: 8 },
  ],
};

export function ActionBurst({
  kind,
  style,
}: {
  kind: TouchKind;
  style: CSSProperties;
}) {
  return (
    <Burst aria-hidden data-kind={kind} style={style}>
      {BURSTS[kind].map((piece) => (
        <BurstPiece
          data-shape={piece.shape}
          key={`${piece.x}-${piece.y}`}
          style={
            {
              width: piece.size,
              height: piece.size,
              "--burst-x": `${piece.x}px`,
              "--burst-y": `${piece.y}px`,
              "--burst-turn": `${piece.turn}deg`,
              "--burst-delay": `${piece.delay}ms`,
            } as CSSProperties
          }
          viewBox="0 0 10 10"
        >
          <path d={PATHS[piece.shape]} />
        </BurstPiece>
      ))}
    </Burst>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const burstFly = keyframes`
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.2); }
  20%  { opacity: 1; transform: translate(calc(var(--burst-x) * 0.45 - 50%), calc(var(--burst-y) * 0.45 - 50%)) scale(1.15) rotate(calc(var(--burst-turn) * 0.4)); }
  100% { opacity: 0; transform: translate(calc(var(--burst-x) - 50%), calc(var(--burst-y) - 50%)) scale(0.7) rotate(var(--burst-turn)); }
`;

/* Sprayed up and out, then falling back to the soil it was meant for. */
const dropFly = keyframes`
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  15%  { opacity: 1; }
  45%  { transform: translate(calc(var(--burst-x) * 0.7 - 50%), calc(var(--burst-y) - 50%)) scale(1); }
  100% { opacity: 0; transform: translate(calc(var(--burst-x) - 50%), calc(var(--burst-y) * -0.2 - 50%)) scale(0.8); }
`;

/** A point at the middle of the tile, never in the way of the next tap. */
const Burst = styled.span`
  position: absolute;
  width: 0;
  height: 0;
  pointer-events: none;

  /* Nothing to show without the motion: the haul note and the tile's new
     drawing already say what happened. */
  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

const BurstPiece = styled.svg`
  position: absolute;
  left: 0;
  top: 0;
  overflow: visible;
  opacity: 0;
  animation: ${burstFly} 900ms var(--burst-delay) var(--ease-out) both;
  filter: drop-shadow(0 0 1.5px rgb(255 255 255 / 0.8));

  &[data-shape="heart"] {
    fill: light-dark(#e8558a, #ff8fb8);
  }

  &[data-shape="spark"] {
    fill: light-dark(#f2b632, #ffe08a);
  }

  &[data-shape="drop"] {
    fill: light-dark(#2f8fd0, #8fd3f4);
    animation-name: ${dropFly};
    animation-duration: 800ms;
  }

  &[data-shape="leaf"] {
    fill: light-dark(#e8933a, #ffc56e);
  }

  /* On the attribute too, or the drops' own animation rule would outrank it. */
  @media (prefers-reduced-motion: reduce) {
    &,
    &[data-shape] {
      animation: none;
    }
  }
`;
