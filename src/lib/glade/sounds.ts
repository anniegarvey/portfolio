import { play, run, type Tone } from "@/lib/sound";
import { SPECIES } from "./catalog";
import type { SpeciesId } from "./schema";

/**
 * Each species' call, synthesised rather than recorded so it ships no audio
 * files. Every call is under a second and quiet: it answers a tap, and a tap
 * can come often. Each is written from the creature's description: the robin
 * and wren sing phrases, the Puffloaf bleats in its sleep, the Mirewing rings
 * like struck crystal.
 */
export const CREATURE_CALLS: Record<SpeciesId, Tone[]> = {
  // A liquid, warbling phrase: the morning tune.
  robin: [
    { at: 0, dur: 0.1, from: 2300, to: 3000, wave: "sine" },
    { at: 0.12, dur: 0.09, from: 3100, to: 2500, wave: "sine" },
    { at: 0.24, dur: 0.16, from: 2700, wave: "sine", vibrato: 28 },
    { at: 0.43, dur: 0.12, from: 2400, to: 3300, wave: "sine" },
  ],
  // A double thump of a hind foot, then a contented little honk.
  rabbit: [
    { at: 0, dur: 0.09, from: 180, to: 110, wave: "triangle", gain: 0.14 },
    { at: 0.13, dur: 0.09, from: 170, to: 105, wave: "triangle", gain: 0.12 },
    { at: 0.3, dur: 0.12, from: 620, to: 760, wave: "sine", gain: 0.05 },
  ],
  // A quick chitter, ending on a bright "kuk".
  squirrel: [
    ...[0, 0.05, 0.1, 0.15].map((at) => ({
      at,
      dur: 0.035,
      from: 1800,
      to: 1600,
      wave: "square" as const,
      gain: 0.03,
    })),
    { at: 0.23, dur: 0.08, from: 1500, to: 2200, wave: "triangle", gain: 0.06 },
  ],
  // Three little snuffles and a happy squeak.
  hedgehog: [
    ...[0, 0.09, 0.18].map((at) => ({
      at,
      dur: 0.06,
      from: 320,
      to: 260,
      wave: "triangle" as const,
      gain: 0.1,
    })),
    { at: 0.3, dur: 0.09, from: 1400, to: 1900, wave: "sine", gain: 0.05 },
  ],
  // Two squeaks: each leaps up and falls away, with a rasp no bird has.
  mouse: [
    { at: 0, dur: 0.03, from: 2400, to: 4400, wave: "sawtooth", gain: 0.03 },
    {
      at: 0.03,
      dur: 0.09,
      from: 4400,
      to: 3000,
      wave: "sawtooth",
      gain: 0.03,
      vibrato: 55,
    },
    { at: 0.2, dur: 0.025, from: 2600, to: 4700, wave: "sawtooth", gain: 0.03 },
    {
      at: 0.225,
      dur: 0.07,
      from: 4700,
      to: 3300,
      wave: "sawtooth",
      gain: 0.03,
      vibrato: 55,
    },
  ],
  // A song far too big for the bird: a rattling trill and a flourish.
  wren: [
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
      at: i * 0.04,
      dur: 0.035,
      from: i % 2 === 0 ? 3200 : 3800,
      wave: "sine" as const,
      gain: 0.07,
    })),
    { at: 0.34, dur: 0.1, from: 3000, to: 4300, wave: "sine", gain: 0.08 },
    { at: 0.46, dur: 0.14, from: 4000, wave: "sine", gain: 0.08, vibrato: 34 },
  ],
  // A low, velvety "mrrp" from under the soil.
  mole: [
    { at: 0, dur: 0.2, from: 120, to: 170, wave: "triangle", gain: 0.12 },
    { at: 0.2, dur: 0.16, from: 170, to: 140, wave: "triangle", gain: 0.1 },
  ],
  // A yip that jumps up and falls away.
  fox: [
    { at: 0, dur: 0.07, from: 700, to: 1250, wave: "triangle" },
    { at: 0.07, dur: 0.12, from: 1250, to: 600, wave: "triangle" },
    { at: 0.26, dur: 0.1, from: 800, to: 1100, wave: "triangle", gain: 0.05 },
  ],
  // A soft, wavering bleat.
  deer: [
    { at: 0, dur: 0.12, from: 500, to: 570, wave: "sine" },
    { at: 0.12, dur: 0.24, from: 570, to: 470, wave: "sine", vibrato: 9 },
  ],
  // Hoo-hoo, hoo.
  owl: [
    { at: 0, dur: 0.2, from: 390, to: 370, wave: "sine", gain: 0.12 },
    { at: 0.27, dur: 0.14, from: 380, to: 370, wave: "sine", gain: 0.1 },
    {
      at: 0.47,
      dur: 0.4,
      from: 370,
      to: 335,
      wave: "sine",
      gain: 0.12,
      vibrato: 6,
    },
  ],
  // Two gruff, good-natured grunts.
  badger: [
    { at: 0, dur: 0.12, from: 150, to: 105, wave: "sawtooth", gain: 0.04 },
    { at: 0.17, dur: 0.14, from: 140, to: 175, wave: "sawtooth", gain: 0.04 },
  ],
  // A small mew that settles into a purr.
  mosskit: [
    { at: 0, dur: 0.08, from: 800, to: 1050, wave: "triangle" },
    { at: 0.08, dur: 0.14, from: 1050, to: 720, wave: "triangle" },
    { at: 0.28, dur: 0.4, from: 95, wave: "triangle", gain: 0.12, vibrato: 24 },
  ],
  // A tumble of squeaky chirps.
  otter: [
    { at: 0, dur: 0.07, from: 1400, to: 1900, wave: "sine" },
    { at: 0.1, dur: 0.07, from: 1600, to: 2100, wave: "sine" },
    { at: 0.2, dur: 0.07, from: 1500, to: 2000, wave: "sine" },
    { at: 0.3, dur: 0.1, from: 1800, to: 2500, wave: "sine" },
  ],
  // A drum of the hind feet and one high squeal.
  hare: [
    { at: 0, dur: 0.06, from: 200, to: 120, wave: "triangle", gain: 0.12 },
    { at: 0.08, dur: 0.06, from: 200, to: 120, wave: "triangle", gain: 0.12 },
    { at: 0.2, dur: 0.12, from: 1200, to: 1650, wave: "sine" },
  ],
  // An airy sparkle drifting upward (a rising whole-tone run).
  thistledown: run([2093, 2349, 2637, 2960, 3322], 0.09, {
    dur: 0.3,
    wave: "sine",
    gain: 0.035,
  }),
  // The blur of its wings, then a lantern-bright chime (G6, B6, D7, G7).
  glimmerwing: [
    { at: 0, dur: 0.2, from: 190, wave: "triangle", gain: 0.05, vibrato: 40 },
    ...run(
      [1568, 1976, 2349, 3136],
      0.06,
      { dur: 0.3, wave: "sine", gain: 0.05 },
      0.1,
    ),
  ],
  // A drowsy little baa, trailing off into a sigh.
  puffloaf: [
    {
      at: 0,
      dur: 0.3,
      from: 420,
      to: 380,
      wave: "triangle",
      gain: 0.09,
      vibrato: 11,
    },
    { at: 0.36, dur: 0.4, from: 300, to: 190, wave: "sine", gain: 0.07 },
  ],
  // Three falling droplets and the ring they leave.
  dewsprite: [
    { at: 0, dur: 0.09, from: 1500, to: 750, wave: "sine" },
    { at: 0.12, dur: 0.09, from: 1300, to: 650, wave: "sine" },
    { at: 0.24, dur: 0.09, from: 1700, to: 850, wave: "sine" },
    { at: 0.34, dur: 0.4, from: 2637, wave: "sine", gain: 0.04 },
  ],
  // Crackling sparks over a deep, warm glow.
  emberveil: [
    { at: 0, dur: 0.7, from: 147, wave: "triangle", gain: 0.1, vibrato: 5 },
    { at: 0, dur: 0.7, from: 220, wave: "sine", gain: 0.06 },
    ...[900, 1300, 1100, 1500, 1000].map((from, i) => ({
      at: 0.05 + i * 0.09,
      dur: 0.03,
      from,
      wave: "square" as const,
      gain: 0.025,
    })),
  ],
  // Old wood knocking, then a slow, rustling rise and fall.
  thornwhisper: [
    { at: 0, dur: 0.05, from: 420, to: 260, wave: "triangle", gain: 0.12 },
    { at: 0.09, dur: 0.05, from: 380, to: 240, wave: "triangle", gain: 0.1 },
    { at: 0.2, dur: 0.3, from: 196, to: 262, wave: "triangle", gain: 0.08 },
    {
      at: 0.5,
      dur: 0.4,
      from: 262,
      to: 196,
      wave: "triangle",
      gain: 0.08,
      vibrato: 5,
    },
  ],
  // Struck crystal: a slow, glassy peal (C7, E7, G7, C8).
  mirewing: run([2093, 2637, 3136, 4186], 0.13, {
    dur: 0.55,
    wave: "sine",
    gain: 0.045,
  }),
  // A warm chord that blooms from the roots up (C3, G3, C4, E4, G4).
  fernmother: run([131, 196, 262, 330, 392], 0.07, {
    dur: 0.65,
    wave: "sine",
    gain: 0.07,
    vibrato: 4,
  }),
};

// ─── Rewards ──────────────────────────────────────────────────────────────────
// The sounds of things going well. All in C major pentatonic, so whichever
// follows whichever, nothing clashes.

const PENTATONIC = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568];

/**
 * A matched taming action: two rising chimes. They start higher the closer
 * the visitor is to tame, so a taming is heard as a climb.
 */
export function trustChime(progress: number): Tone[] {
  const step = Math.round(
    Math.min(1, Math.max(0, progress)) * (PENTATONIC.length - 3),
  );
  return [
    { at: 0, dur: 0.22, from: PENTATONIC[step], wave: "sine", gain: 0.07 },
    { at: 0.1, dur: 0.3, from: PENTATONIC[step + 2], wave: "sine", gain: 0.07 },
    {
      at: 0.1,
      dur: 0.3,
      from: PENTATONIC[step + 2] * 2,
      wave: "sine",
      gain: 0.02,
    },
  ];
}

/** An action that missed the visitor's preference: a soft, unbothered "hm". */
const NEAR_MISS: Tone[] = [
  { at: 0, dur: 0.16, from: 440, to: 392, wave: "triangle", gain: 0.05 },
];

/**
 * A new resident: a rising flourish while the creature flies to the glade,
 * and a bright chord for the moment it lands, `landAt` seconds later.
 */
export function tameFanfare(landAt: number): Tone[] {
  return [
    ...run([523, 659, 784, 1047], 0.11, {
      dur: 0.3,
      wave: "triangle",
      gain: 0.07,
    }),
    ...run(
      [1047, 1319, 1568],
      0,
      { dur: 0.9, wave: "sine", gain: 0.06 },
      landAt,
    ),
    ...run(
      [2093, 2637, 3136, 4186],
      0.07,
      { dur: 0.4, wave: "sine", gain: 0.03 },
      landAt + 0.05,
    ),
  ];
}

/** A treat coming out of the pot: three bubbles and a ding. */
const COOKED: Tone[] = [
  { at: 0, dur: 0.07, from: 300, to: 620, wave: "sine", gain: 0.09 },
  { at: 0.09, dur: 0.07, from: 360, to: 740, wave: "sine", gain: 0.09 },
  { at: 0.18, dur: 0.07, from: 420, to: 860, wave: "sine", gain: 0.09 },
  { at: 0.3, dur: 0.5, from: 1319, wave: "sine", gain: 0.06 },
  { at: 0.3, dur: 0.5, from: 1976, wave: "sine", gain: 0.03 },
];

/** Something dropping into the pantry basket. */
const BOUGHT: Tone[] = [
  { at: 0, dur: 0.1, from: 988, wave: "sine", gain: 0.06 },
  { at: 0.07, dur: 0.25, from: 1319, wave: "sine", gain: 0.06 },
];

/** A lesson learnt: up the scale to a held top note. */
const LESSON: Tone[] = [
  ...run([523, 659, 784], 0.09, { dur: 0.18, wave: "triangle", gain: 0.07 }),
  { at: 0.27, dur: 0.6, from: 1047, wave: "triangle", gain: 0.07, vibrato: 6 },
  { at: 0.27, dur: 0.6, from: 1568, wave: "sine", gain: 0.03 },
];

/** A friendship grown: a short, dreamy music-box tune ending on a soft bell. */
const FRIENDSHIP: Tone[] = [
  ...run([784, 988, 1175, 988], 0.16, { dur: 0.3, wave: "sine", gain: 0.055 }),
  { at: 0.66, dur: 0.8, from: 1568, wave: "sine", gain: 0.05 },
  { at: 0.66, dur: 0.8, from: 3136, wave: "sine", gain: 0.015 },
];

/**
 * Plays a species' call. No two calls come out quite the same: each is
 * nudged up or down by a few percent, the way a real animal never repeats
 * itself exactly. Fantastical creatures' calls hang in the air.
 */
export function playCreatureSound(speciesId: SpeciesId): void {
  play(CREATURE_CALLS[speciesId], {
    echo: SPECIES[speciesId].kind === "fantastical",
    pitch: 0.96 + Math.random() * 0.08,
  });
}

/**
 * Answers a taming action, a beat after the creature's own call so the two
 * read as call and reward. `progress` is the visitor's trust as a fraction
 * of what it takes to tame.
 */
export function playTrustSound(matched: boolean, progress: number): void {
  play(matched ? trustChime(progress) : NEAR_MISS, {
    delay: 0.22,
    echo: matched,
  });
}

/** Celebrates a tame; `landAt` is how long the flight to the glade lasts. */
export function playTameSound(landAt: number): void {
  play(tameFanfare(landAt), { delay: 0.22, echo: true });
}

export function playCookSound(): void {
  play(COOKED);
}

export function playBuySound(): void {
  play(BOUGHT);
}

export function playLessonSound(): void {
  play(LESSON, { echo: true });
}

export function playFriendshipSound(): void {
  play(FRIENDSHIP, { echo: true });
}
