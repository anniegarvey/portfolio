import { play, run, type Tone } from "@/lib/sound";
import type { NeighbourId } from "./schema";

/**
 * Meadowmere's sounds: the farm answering what the farmer does. Synthesised
 * like the Glade's, quiet, and under a second unless something big happened.
 * Every reward is in C major pentatonic, so whichever lands on whichever,
 * nothing clashes.
 */

const PENTATONIC = [
  523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760, 2093,
];

// ─── The farm ─────────────────────────────────────────────────────────────────

/** A seed pressed into the soil: a soft pat, then a little "bloop". */
export const SOW: Tone[] = [
  { at: 0, dur: 0.07, from: 200, to: 120, wave: "triangle", gain: 0.12 },
  { at: 0.09, dur: 0.12, from: 520, to: 880, wave: "sine", gain: 0.06 },
];

/**
 * The can tipping: a run of glugs, each a bubble that bloops up and then
 * gulps lower, uneven the way water leaves a can, then the splash on the soil.
 */
function glug(at: number, f: number): Tone[] {
  return [
    { at, dur: 0.05, from: f, to: f * 1.9, wave: "sine", gain: 0.16 },
    {
      at: at + 0.05,
      dur: 0.07,
      from: f * 0.85,
      to: f * 1.5,
      wave: "sine",
      gain: 0.12,
    },
  ];
}

export const WATER: Tone[] = [
  ...glug(0, 190),
  ...glug(0.15, 240),
  ...glug(0.28, 170),
  ...glug(0.44, 220),
  {
    at: 0.52,
    dur: 0.4,
    from: 1600,
    to: 700,
    wave: "noise",
    gain: 0.06,
    q: 0.8,
  },
];

/**
 * A crop pulled up, or something found in the wilds: a pop, then two rising
 * chimes. `streak` counts the hauls in quick succession, and each one starts
 * a step higher, so working down a row of ripe beds is heard as a climb.
 */
export function haulChime(streak: number): Tone[] {
  const step = Math.min(Math.max(0, streak), PENTATONIC.length - 3);
  const low = PENTATONIC[step];
  const high = PENTATONIC[step + 2];
  return [
    { at: 0, dur: 0.06, from: 300, to: 700, wave: "sine", gain: 0.1 },
    { at: 0.07, dur: 0.2, from: low, wave: "triangle", gain: 0.07 },
    { at: 0.15, dur: 0.35, from: high, wave: "triangle", gain: 0.07 },
    { at: 0.15, dur: 0.35, from: high * 2, wave: "sine", gain: 0.02 },
  ];
}

/**
 * Leaves parting before a find: a dozen soft wisps of hiss, each swelling in
 * rather than starting sharp (a sharp start is what makes noise a drum), each
 * a different size and brightness. `random` picks them, so no two rustles are
 * quite the same.
 */
export function rustle(random: () => number = Math.random): Tone[] {
  return Array.from({ length: 12 }, (_, i) => {
    const dur = 0.1 + random() * 0.12;
    const from = 3500 + random() * 4000;
    return {
      at: i * 0.035 + random() * 0.03,
      dur,
      from,
      to: from * (0.8 + random() * 0.3),
      wave: "noise" as const,
      gain: 0.02 + random() * 0.03,
      attack: dur * 0.45,
      q: 0.6,
    };
  });
}

/** How long the rustle runs before the find chimes over its tail. */
const RUSTLE_LENGTH = 0.45;

/** Nothing to do there: a soft, unbothered "hm". */
export const NOTHING: Tone[] = [
  { at: 0, dur: 0.16, from: 440, to: 392, wave: "triangle", gain: 0.05 },
];

// ─── The cat ──────────────────────────────────────────────────────────────────

/**
 * A purr: a low buzz pulsing about 25 times a second, which is roughly a real
 * cat's rate, shaped to a rumble. One long breath out that swells up and then
 * slowly settles, easing a touch lower as it goes.
 */
function purr(dur: number): Tone {
  return {
    at: 0,
    dur,
    from: 25,
    to: 22,
    wave: "sawtooth",
    gain: 0.28,
    attack: dur * 0.35,
    filter: 220,
    filterTo: 180,
    q: 1.2,
  };
}

const PURR: Tone[] = [purr(1.2)];

/** Shifts a sound later by `by` seconds. */
const after = (by: number, tones: Tone[]): Tone[] =>
  tones.map((tone) => ({ ...tone, at: tone.at + by }));

/**
 * What the cat says, taking turns like the purrs written for it. Voiced
 * through a moving filter, which is what makes a "mew" sound like a mouth
 * rather than a whistle.
 */
export const CAT_SOUNDS: Tone[][] = [
  // Mrrp? A rolled trill that rises like a question.
  [
    {
      at: 0,
      dur: 0.2,
      from: 420,
      to: 680,
      wave: "sawtooth",
      gain: 0.06,
      vibrato: 30,
      vibratoDepth: 0.12,
      filter: 1200,
      filterTo: 1800,
      q: 2,
    },
    ...after(0.28, PURR),
  ],
  // Mew: "mi" up to the top, then "aow" sliding down as the mouth opens.
  [
    {
      at: 0,
      dur: 0.12,
      from: 700,
      to: 980,
      wave: "sawtooth",
      gain: 0.08,
      filter: 2400,
      filterTo: 1600,
      q: 3,
    },
    {
      at: 0.12,
      dur: 0.28,
      from: 980,
      to: 620,
      wave: "sawtooth",
      gain: 0.08,
      filter: 1600,
      filterTo: 850,
      q: 3,
    },
    ...after(0.48, PURR),
  ],
  // Just the purr, long and pleased with itself.
  [purr(2)],
];

// ─── Neighbours ───────────────────────────────────────────────────────────────

/**
 * Someone's door opening, in the sound of their trade: the inn's brass bell,
 * a knock on Bram's oak, Marigold's bees and a wind chime, the mill wheel's
 * creak and Wren's whistle.
 */
export const DOOR_SOUNDS: Record<NeighbourId, Tone[]> = {
  nessa: run([1319, 1047], 0.14, { dur: 0.5, wave: "sine", gain: 0.06 }),
  bram: [
    { at: 0, dur: 0.05, from: 330, to: 220, wave: "triangle", gain: 0.14 },
    { at: 0.13, dur: 0.05, from: 330, to: 220, wave: "triangle", gain: 0.14 },
    { at: 0.32, dur: 0.18, from: 523, to: 659, wave: "sine", gain: 0.05 },
  ],
  marigold: [
    { at: 0, dur: 0.3, from: 220, wave: "sawtooth", gain: 0.015, vibrato: 30 },
    ...run(
      [1568, 2093, 1760, 2349],
      0.08,
      {
        dur: 0.4,
        wave: "sine",
        gain: 0.035,
      },
      0.2,
    ),
  ],
  // The mill wheel: two long wooden creaks, a stick-and-slip judder of a
  // buzz rung through a hollow, then Wren's whistle.
  wren: [
    {
      at: 0,
      dur: 0.45,
      from: 70,
      to: 110,
      wave: "sawtooth",
      gain: 0.2,
      vibrato: 19,
      vibratoDepth: 0.4,
      filter: 900,
      q: 3,
    },
    {
      at: 0.5,
      dur: 0.35,
      from: 120,
      to: 80,
      wave: "sawtooth",
      gain: 0.18,
      vibrato: 23,
      vibratoDepth: 0.4,
      filter: 1100,
      q: 3,
    },
    { at: 0.95, dur: 0.12, from: 1568, to: 2093, wave: "sine", gain: 0.05 },
    { at: 1.09, dur: 0.2, from: 2093, to: 1760, wave: "sine", gain: 0.05 },
  ],
};

/** The seed stall's shop bell. */
export const SHOP_BELL: Tone[] = [
  { at: 0, dur: 0.4, from: 2637, wave: "sine", gain: 0.04 },
  { at: 0.09, dur: 0.5, from: 2093, wave: "sine", gain: 0.04 },
];

/** A packet of seeds dropping into the farmer's pocket. */
export const SEED_BOUGHT: Tone[] = [
  { at: 0, dur: 0.1, from: 988, wave: "sine", gain: 0.06 },
  { at: 0.07, dur: 0.25, from: 1319, wave: "sine", gain: 0.06 },
  { at: 0.07, dur: 0.25, from: 2637, wave: "sine", gain: 0.015 },
];

/** A gift accepted with good grace. */
export const GIFT_ACCEPTED: Tone[] = run([784, 1047], 0.1, {
  dur: 0.3,
  wave: "triangle",
  gain: 0.06,
});

/** A gift they loved: a heart-shaped little rise that hangs in the air. */
export const GIFT_LOVED: Tone[] = [
  ...run([784, 1047, 1319], 0.08, { dur: 0.25, wave: "triangle", gain: 0.06 }),
  { at: 0.24, dur: 0.6, from: 1568, wave: "sine", gain: 0.06, vibrato: 6 },
  { at: 0.24, dur: 0.6, from: 3136, wave: "sine", gain: 0.015 },
];

/** A friendship reaching its next tier: the loved chime, then a bright chord. */
export const FRIENDSHIP_UP: Tone[] = [
  ...GIFT_LOVED,
  ...run(
    [1047, 1319, 1568, 2093],
    0,
    { dur: 0.9, wave: "sine", gain: 0.04 },
    0.7,
  ),
  ...run(
    [2093, 2637, 3136, 4186],
    0.06,
    { dur: 0.4, wave: "sine", gain: 0.02 },
    0.75,
  ),
];

/** A quest handed in: a little march up to a held chord, and sparkles. */
export const QUEST_FANFARE: Tone[] = [
  ...run([523, 659, 784], 0.11, { dur: 0.16, wave: "triangle", gain: 0.07 }),
  { at: 0.33, dur: 0.12, from: 784, wave: "triangle", gain: 0.07 },
  ...run([1047, 1319, 1568], 0, { dur: 1, wave: "triangle", gain: 0.05 }, 0.47),
  ...run(
    [2093, 2349, 2637, 3136, 3520, 4186],
    0.06,
    {
      dur: 0.35,
      wave: "sine",
      gain: 0.02,
    },
    0.55,
  ),
];

/** An errand run: a cheerful two-step and a ding. */
export const ERRAND_DONE: Tone[] = [
  ...run([659, 880], 0.1, { dur: 0.16, wave: "triangle", gain: 0.07 }),
  { at: 0.22, dur: 0.6, from: 1319, wave: "sine", gain: 0.06 },
  { at: 0.22, dur: 0.6, from: 1976, wave: "sine", gain: 0.025 },
];

/** A new day on the farm: a sunrise, slowly up the scale. */
export const MORNING: Tone[] = [
  ...run([392, 523, 659, 784, 1047], 0.13, {
    dur: 0.6,
    wave: "sine",
    gain: 0.05,
  }),
  { at: 0.65, dur: 0.9, from: 1319, wave: "sine", gain: 0.04, vibrato: 5 },
];

// ─── Playing ──────────────────────────────────────────────────────────────────

/** How long after one haul another still counts as the same streak. */
export const STREAK_MS = 4000;

let streak = { count: -1, at: Number.NEGATIVE_INFINITY };

/**
 * Where a haul at `now` sits in its streak: 0 for the first, one more for
 * each that follows within STREAK_MS of the last.
 */
export function nextStreak(now: number): number {
  const count = now - streak.at <= STREAK_MS ? streak.count + 1 : 0;
  streak = { count, at: now };
  return count;
}

export function playSowSound(): void {
  play(SOW);
}

export function playWaterSound(): void {
  play(WATER, { echo: true });
}

export function playHarvestSound(): void {
  play(haulChime(nextStreak(Date.now())), { echo: true });
}

/** Foraging: a rustle in the leaves first, then the same climbing find. */
export function playForageSound(): void {
  play(rustle());
  play(haulChime(nextStreak(Date.now())), {
    delay: RUSTLE_LENGTH,
    echo: true,
  });
}

export function playNothingSound(): void {
  play(NOTHING);
}

/** `pets` is how many times the cat has been petted before this one. */
export function playCatSound(pets: number): void {
  play(CAT_SOUNDS[pets % CAT_SOUNDS.length], {
    pitch: 0.96 + Math.random() * 0.08,
  });
}

export function playDoorSound(neighbourId: NeighbourId): void {
  play(DOOR_SOUNDS[neighbourId], { echo: neighbourId === "marigold" });
}

export function playShopSound(): void {
  play(SHOP_BELL, { echo: true });
}

export function playBuySound(): void {
  play(SEED_BOUGHT);
}

export function playGiftSound(liked: boolean, tierUp: boolean): void {
  if (tierUp) play(FRIENDSHIP_UP, { echo: true });
  else play(liked ? GIFT_LOVED : GIFT_ACCEPTED, { echo: liked });
}

export function playQuestSound(): void {
  play(QUEST_FANFARE, { echo: true });
}

export function playErrandSound(): void {
  play(ERRAND_DONE, { echo: true });
}

export function playMorningSound(): void {
  play(MORNING, { echo: true });
}
