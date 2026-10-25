import { keyframes, styled } from "next-yak";
import type { CSSProperties } from "react";

const WIDTH = 2400;
const WAVELENGTH = 200;

// A gently rippling line, as one smooth chain of quadratic curves. It's
// drawn twice as wide as the hero so sliding it left by half loops cleanly.
function wavePath(y: number, amplitude: number): string {
  let d = `M0 ${y} Q ${WAVELENGTH / 4} ${y - amplitude} ${WAVELENGTH / 2} ${y}`;
  for (let x = WAVELENGTH; x <= WIDTH; x += WAVELENGTH / 2) d += ` T ${x} ${y}`;
  return d;
}

const STAFF_LINES = [0, 1, 2, 3, 4].map((i) => ({
  d: wavePath(60 + i * 18, 6 + i * 1.5),
  duration: `${14 + i * 3}s`,
}));

const NOTES = [
  { glyph: "♪", left: "8%", top: "18%", delay: "0s" },
  { glyph: "♫", left: "22%", top: "62%", delay: "-1.4s" },
  { glyph: "✿", left: "78%", top: "58%", delay: "-0.6s" },
  { glyph: "♩", left: "88%", top: "22%", delay: "-2.1s" },
  { glyph: "❀", left: "14%", top: "80%", delay: "-2.8s" },
  { glyph: "♬", left: "70%", top: "12%", delay: "-3.3s" },
];

/**
 * The hero's backdrop: a musical stave whose five lines ripple like the
 * surface of a swimming pool, with notes and blossoms bobbing on it. Pure
 * SVG and CSS, so it's still there (just still) with reduced motion.
 */
export function StaffScene() {
  return (
    <Scene aria-hidden="true">
      <Staff preserveAspectRatio="none" viewBox="0 0 1200 200">
        {STAFF_LINES.map((line) => (
          <WaveLine
            d={line.d}
            key={line.d}
            style={{ "--duration": line.duration } as CSSProperties}
          />
        ))}
      </Staff>
      {NOTES.map((note) => (
        <Floater
          key={note.left}
          style={
            {
              left: note.left,
              top: note.top,
              "--delay": note.delay,
            } as CSSProperties
          }
        >
          {note.glyph}
        </Floater>
      ))}
    </Scene>
  );
}

// ─── Animations ─────────────────────────────────────────────────────────────

const ripple = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-1200px); }
`;

const bob = keyframes`
  0%, 100% { transform: translateY(0) rotate(-8deg); }
  50% { transform: translateY(-10px) rotate(8deg); }
`;

// ─── Styles ─────────────────────────────────────────────────────────────────

const Scene = styled.div`
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(
      ellipse at 50% 120%,
      light-dark(var(--color-teal-50), var(--color-teal-950)),
      transparent 70%
    ),
    radial-gradient(
      ellipse at 50% -20%,
      light-dark(var(--color-rose-50), var(--color-rose-950)),
      transparent 70%
    );
`;

const Staff = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const WaveLine = styled.path`
  fill: none;
  stroke: light-dark(var(--color-primary-300), var(--color-primary-700));
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
  opacity: 0.7;

  @media (prefers-reduced-motion: no-preference) {
    animation: ${ripple} var(--duration) linear infinite;
  }
`;

const Floater = styled.span`
  position: absolute;
  font-size: clamp(1.1rem, 3vw, 1.6rem);
  color: light-dark(var(--color-rose-400), var(--color-rose-300));
  opacity: 0.75;

  @media (prefers-reduced-motion: no-preference) {
    animation: ${bob} 4s ease-in-out var(--delay) infinite;
  }
`;
