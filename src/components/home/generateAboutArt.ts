// Generates the About Me artwork: a Celtic triskele woven from many strands,
// no two alike (there is no "standard user"), under a scattering of stars.
// Seeded so server and client render identical markup.

export const ART_SIZE = 400;
const CENTRE = ART_SIZE / 2;

/** Palette families, one per triskele arm. Rendered as light/dark shade pairs. */
export const ARM_HUES = ["primary", "secondary", "teal"] as const;
const ACCENT_HUES = ["rose", "orange"] as const;
export type Hue = (typeof ARM_HUES)[number] | (typeof ACCENT_HUES)[number];

export interface Strand {
  d: string;
  hue: Hue;
  width: number;
  /** Flow animation duration in seconds */
  duration: number;
  /** Flow animation delay in seconds (negative, so strands start mid-flow) */
  delay: number;
}

export interface Star {
  x: number;
  y: number;
  r: number;
  hue: Hue;
  delay: number;
}

export interface AboutArt {
  strands: Strand[];
  stars: Star[];
}

/** mulberry32: small, fast, deterministic PRNG returning values in [0, 1). */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number) => Math.round(n * 10) / 10;

const STRANDS_PER_ARM = 11;
const STAR_COUNT = 40;
const ARM_RADIUS = 84;
const SPIRAL_STEPS = 90;

const armAngle = (arm: number) => -Math.PI / 2 + (arm * Math.PI * 2) / 3;

// The triskele is top-heavy (one lobe up, two down), so nudge it down to sit
// visually centred in the frame
const OFFSET_Y = ARM_RADIUS / 4;

const lobeCentre = (angle: number) => ({
  x: CENTRE + ARM_RADIUS * Math.cos(angle),
  y: CENTRE + OFFSET_Y + ARM_RADIUS * Math.sin(angle),
});

function spiralPath(angle: number, random: () => number): string {
  const lobe = lobeCentre(angle);
  // Each strand winds a little differently: its own reach, turns and wobble
  const reach = ARM_RADIUS * (0.92 + random() * 0.16);
  const turns = 1.8 + random() * 0.4;
  const wobbleAmp = 1.5 + random() * 4.5;
  const wobbleFreq = 5 + random() * 9;
  const wobblePhase = random() * Math.PI * 2;
  // The outer end of every spiral points back at the centre, joining the arms
  const endAngle = angle + Math.PI;
  const startAngle = endAngle - turns * Math.PI * 2;

  const points: string[] = [];
  for (let i = 0; i <= SPIRAL_STEPS; i++) {
    const t = i / SPIRAL_STEPS;
    const angle = startAngle + t * turns * Math.PI * 2;
    const r =
      reach * t + wobbleAmp * t * Math.sin(t * wobbleFreq + wobblePhase);
    points.push(
      `${round(lobe.x + r * Math.cos(angle))} ${round(lobe.y + r * Math.sin(angle))}`,
    );
  }
  return `M${points.join("L")}`;
}

export function generateAboutArt(seed: number): AboutArt {
  const random = createRandom(seed);
  const strands: Strand[] = [];

  ARM_HUES.forEach((armHue, arm) => {
    for (let i = 0; i < STRANDS_PER_ARM; i++) {
      // Roughly one strand in five takes an accent colour
      const hue =
        random() < 0.2
          ? ACCENT_HUES[Math.floor(random() * ACCENT_HUES.length)]
          : armHue;
      strands.push({
        d: spiralPath(armAngle(arm), random),
        hue,
        width: round(0.8 + random() * 2.2),
        duration: round(6 + random() * 8),
        delay: -round(random() * 14),
      });
    }
  });

  const stars: Star[] = [];
  const allHues: Hue[] = [...ARM_HUES, ...ACCENT_HUES];
  while (stars.length < STAR_COUNT) {
    const x = random() * ART_SIZE;
    const y = random() * ART_SIZE;
    // Keep the stars in the sky around the spirals, not on top of them
    const onSpiral = ARM_HUES.some((_, arm) => {
      const lobe = lobeCentre(armAngle(arm));
      return Math.hypot(x - lobe.x, y - lobe.y) < ARM_RADIUS * 1.1;
    });
    if (onSpiral) continue;
    stars.push({
      x: round(x),
      y: round(y),
      r: round(0.8 + random() * 2),
      hue: allHues[Math.floor(random() * allHues.length)],
      delay: -round(random() * 6),
    });
  }

  return { strands, stars };
}
