import { keyframes, styled } from "next-yak";
import type { CSSProperties } from "react";

/**
 * The little lives the Vale carries on with while the farmer works, drawn over
 * the scenery in scene coordinates. Butterflies by day and fireflies at dusk:
 * each colour is transparent in the other theme, so the same shapes serve both
 * without the scene having to know which one it is in. Sparkles on the river
 * come out in both.
 *
 * Every piece still makes sense frozen, which is what a reduced-motion player
 * and a visual snapshot both see: a butterfly resting on the meadow, a firefly
 * glowing where it hangs, and a river with no glitter on it.
 */

const BUTTERFLIES = [
  { x: 112, y: 150, dx: 26, dy: 14, colour: "#f59ec4", dur: 17, delay: 0 },
  { x: 244, y: 206, dx: -30, dy: 18, colour: "#c9a0e0", dur: 21, delay: -6 },
  { x: 360, y: 112, dx: 24, dy: -16, colour: "#f6cf4a", dur: 19, delay: -3 },
  { x: 398, y: 222, dx: -22, dy: -20, colour: "#8fc3f2", dur: 23, delay: -11 },
  { x: 182, y: 272, dx: 28, dy: -12, colour: "#f59ec4", dur: 18, delay: -8 },
];

const FIREFLIES = [
  { x: 16, y: 334, delay: 0 },
  { x: 30, y: 318, delay: -1.6 },
  { x: 113, y: 140, delay: -0.8 },
  { x: 436, y: 240, delay: -2.4 },
  { x: 372, y: 330, delay: -1.2 },
  { x: 232, y: 198, delay: -3.1 },
  { x: 128, y: 36, delay: -2 },
  { x: 320, y: 40, delay: -0.4 },
  { x: 462, y: 268, delay: -2.8 },
  { x: 80, y: 250, delay: -3.6 },
];

const SPARKLES = [
  { x: 10, y: 58, delay: 0 },
  { x: 22, y: 126, delay: -1.4 },
  { x: 12, y: 196, delay: -2.6 },
  { x: 20, y: 262, delay: -0.7 },
  { x: 14, y: 300, delay: -3.3 },
];

const SPARK = "M0 -4 L0.9 -0.9 L4 0 L0.9 0.9 L0 4 L-0.9 0.9 L-4 0 L-0.9 -0.9 Z";

export function ValeMagic() {
  return (
    <g aria-hidden>
      {SPARKLES.map((spark) => (
        <Sparkle
          d={SPARK}
          key={`${spark.x}-${spark.y}`}
          style={
            {
              translate: `${spark.x}px ${spark.y}px`,
              animationDelay: `${spark.delay}s`,
            } as CSSProperties
          }
        />
      ))}
      {FIREFLIES.map((fly) => (
        <g key={`${fly.x}-${fly.y}`} transform={`translate(${fly.x} ${fly.y})`}>
          <Firefly style={{ animationDelay: `${fly.delay}s` }}>
            <circle className="halo" r="7" />
            <circle className="halo" r="3.6" />
            <circle className="glow" r="1.9" />
          </Firefly>
        </g>
      ))}
      {BUTTERFLIES.map((b) => (
        <g key={`${b.x}-${b.y}`} transform={`translate(${b.x} ${b.y})`}>
          <Wander
            style={
              {
                "--dx": `${b.dx}px`,
                "--dy": `${b.dy}px`,
                animationDuration: `${b.dur}s`,
                animationDelay: `${b.delay}s`,
              } as CSSProperties
            }
          >
            <Butterfly style={{ "--wing": b.colour } as CSSProperties}>
              <Wing className="left">
                <ellipse cx="-2.6" cy="-1.2" rx="2.8" ry="2.2" />
                <ellipse cx="-2" cy="1.6" rx="2" ry="1.6" />
              </Wing>
              <Wing className="right">
                <ellipse cx="2.6" cy="-1.2" rx="2.8" ry="2.2" />
                <ellipse cx="2" cy="1.6" rx="2" ry="1.6" />
              </Wing>
              <rect
                className="body"
                height="5"
                rx="0.6"
                width="1.2"
                x="-0.6"
                y="-2.4"
              />
            </Butterfly>
          </Wander>
        </g>
      ))}
    </g>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const twinkle = keyframes`
  0%, 70%, 100% { opacity: 0; scale: 0.3; rotate: 0deg; }
  80%           { opacity: 1; scale: 1; rotate: 45deg; }
  90%           { opacity: 0; scale: 0.4; rotate: 90deg; }
`;

/** A glint of sun, or moon, off the river. Gone at rest. */
const Sparkle = styled.path`
  fill: light-dark(#ffffff, #fff6c8);
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
  animation: ${twinkle} 4.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const fireflyGlow = keyframes`
  0%, 100% { opacity: 0.9; transform: translate(0, 0); }
  35%      { opacity: 0.2; transform: translate(3px, -4px); }
  60%      { opacity: 1; transform: translate(-2px, -6px); }
  80%      { opacity: 0.35; transform: translate(-3px, -2px); }
`;

/** Lit at dusk only: in daylight both circles are transparent. */
const Firefly = styled.g`
  animation: ${fireflyGlow} 4.8s ease-in-out infinite;

  & .halo {
    fill: light-dark(transparent, rgb(246 238 140 / 0.22));
  }

  & .glow {
    fill: light-dark(transparent, #fbf6b0);
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const wander = keyframes`
  0%, 100% { transform: translate(0, 0); }
  25%      { transform: translate(var(--dx), calc(var(--dy) * -1)); }
  50%      { transform: translate(calc(var(--dx) * 1.5), var(--dy)); }
  75%      { transform: translate(calc(var(--dx) * 0.5), calc(var(--dy) * 1.3)); }
`;

const Wander = styled.g`
  animation: ${wander} 18s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** Out by day only, the same trick as the fireflies the other way round. */
const Butterfly = styled.g`
  & ellipse {
    fill: light-dark(var(--wing), transparent);
  }

  & .body {
    fill: light-dark(#5b4636, transparent);
  }
`;

const flap = keyframes`
  0%, 100% { transform: scaleX(1); }
  50%      { transform: scaleX(0.25); }
`;

/* Each wing folds in towards the body, not about its own middle. */
const Wing = styled.g`
  transform-box: view-box;
  transform-origin: 0 0;
  animation: ${flap} 320ms ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
