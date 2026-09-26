import { keyframes, styled } from "next-yak";
import { QUERIES } from "@/lib/constants";
import { ART_SIZE, generateAboutArt, type Hue } from "./generateAboutArt";

const ART_SEED = 1916;
const art = generateAboutArt(ART_SEED);

const shade = (hue: Hue) =>
  `light-dark(var(--color-${hue}-600), var(--color-${hue}-300))`;

export function AboutArt() {
  return (
    <ArtFrame>
      <svg
        aria-label="Generative art: a Celtic triple spiral woven from many unique strands in purple, green and teal, under a scattering of stars"
        role="img"
        viewBox={`0 0 ${ART_SIZE} ${ART_SIZE}`}
      >
        {art.stars.map((star) => (
          <StarDot
            cx={star.x}
            cy={star.y}
            key={`${star.x}-${star.y}`}
            r={star.r}
            style={{
              fill: shade(star.hue),
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
        {art.strands.map((strand) => (
          <StrandPath
            d={strand.d}
            key={strand.d}
            pathLength={1}
            style={{
              stroke: shade(strand.hue),
              strokeWidth: strand.width,
              animationDuration: `${strand.duration}s`,
              animationDelay: `${strand.delay}s`,
            }}
          />
        ))}
      </svg>
    </ArtFrame>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

// One full dash period, so the loop is seamless
const flow = keyframes`
  to {
    stroke-dashoffset: -0.2;
  }
`;

const twinkle = keyframes`
  0%, 100% {
    opacity: 0.25;
  }
  50% {
    opacity: 0.9;
  }
`;

const ArtFrame = styled.div`
  flex: 0 0 auto;
  width: min(320px, 100%);
  aspect-ratio: 1;
  border-radius: 16px;
  background: light-dark(var(--color-grey-100), var(--color-grey-900));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  overflow: hidden;

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  @media (${QUERIES.TABLET_UP}) {
    width: 340px;
  }
`;

const StrandPath = styled.path`
  fill: none;
  stroke-linecap: round;
  stroke-dasharray: 0.16 0.04;
  opacity: 0.85;
  animation: ${flow} linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const StarDot = styled.circle`
  opacity: 0.6;
  animation: ${twinkle} 6s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
