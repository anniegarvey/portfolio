import { keyframes, styled } from "next-yak";

/**
 * Smoke off a chimney pot, in the tile-local coordinates the rest of the Vale's
 * art is drawn in. Its own module because both layers burn wood: the player's
 * farmhouse is terrain, the neighbours' cottages are features, and neither
 * layer should have to reach into the other to light a fire.
 */

const puffRise = keyframes`
  0%   { opacity: 0; transform: translate(0, 0) scale(0.5); }
  18%  { opacity: 0.7; }
  100% { opacity: 0; transform: translate(4px, -17px) scale(1.6); }
`;

const Puff = styled.circle`
  fill: var(--vale-smoke);
  /* Transparent at rest, so a valley that isn't moving — a still screenshot,
     or a player who asked for no motion — has no smoke rather than a stack of
     grey dots parked on the roof. */
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
  animation: ${puffRise} 7.2s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/**
 * Somebody is in. Three puffs off the pot, spaced far enough apart that the
 * column never closes up.
 */
export function ChimneySmoke({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {[0, 2.4, 4.8].map((delay) => (
        <Puff
          cx={x}
          cy={y}
          key={delay}
          r="2.2"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </g>
  );
}
