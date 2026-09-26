import { useSyncExternalStore } from "react";
import type { SpeciesId } from "./schema";

/**
 * One tone in a creature's call: a pitch that may slide to another over its
 * length, with a quick attack and a soft decay so nothing clicks.
 */
interface Tone {
  /** Seconds after the call starts. */
  at: number;
  /** Seconds the tone lasts. */
  dur: number;
  /** Starting pitch, in Hz. */
  from: number;
  /** Pitch it slides to by the end, in Hz. Holds `from` when omitted. */
  to?: number;
  wave: OscillatorType;
  /** Peak volume; defaults to a gentle 0.08. */
  gain?: number;
}

/**
 * Each species' call, synthesised rather than recorded so it ships no audio
 * files. Every call is well under a second and quiet: it answers a tap, and
 * a tap can come often.
 */
export const CREATURE_CALLS: Record<SpeciesId, Tone[]> = {
  // Two bright rising chirps.
  robin: [
    { at: 0, dur: 0.09, from: 2000, to: 2800, wave: "sine" },
    { at: 0.13, dur: 0.1, from: 2100, to: 3000, wave: "sine" },
  ],
  // A soft double thump of a hind foot.
  rabbit: [
    { at: 0, dur: 0.1, from: 180, to: 110, wave: "triangle", gain: 0.14 },
    { at: 0.14, dur: 0.1, from: 170, to: 105, wave: "triangle", gain: 0.12 },
  ],
  // A quick chitter.
  squirrel: [0, 0.05, 0.1, 0.15].map((at) => ({
    at,
    dur: 0.035,
    from: 1800,
    to: 1600,
    wave: "square" as const,
    gain: 0.035,
  })),
  // Three little snuffles.
  hedgehog: [0, 0.09, 0.18].map((at) => ({
    at,
    dur: 0.06,
    from: 320,
    to: 260,
    wave: "triangle" as const,
    gain: 0.1,
  })),
  // A tiny squeak, twice.
  mouse: [
    { at: 0, dur: 0.05, from: 3000, to: 3500, wave: "sine", gain: 0.05 },
    { at: 0.08, dur: 0.05, from: 3100, to: 3600, wave: "sine", gain: 0.05 },
  ],
  // A fast trill.
  wren: [0, 1, 2, 3, 4, 5].map((i) => ({
    at: i * 0.04,
    dur: 0.035,
    from: i % 2 === 0 ? 3200 : 3700,
    wave: "sine" as const,
    gain: 0.05,
  })),
  // A low, sleepy grumble.
  mole: [{ at: 0, dur: 0.28, from: 120, to: 90, wave: "sawtooth", gain: 0.04 }],
  // A yip that jumps up and falls away.
  fox: [
    { at: 0, dur: 0.07, from: 700, to: 1250, wave: "triangle" },
    { at: 0.07, dur: 0.12, from: 1250, to: 600, wave: "triangle" },
  ],
  // A soft, wavering bleat.
  deer: [
    { at: 0, dur: 0.12, from: 500, to: 570, wave: "sine" },
    { at: 0.12, dur: 0.16, from: 570, to: 470, wave: "sine" },
  ],
  // Hoo-hoo.
  owl: [
    { at: 0, dur: 0.22, from: 390, to: 370, wave: "sine", gain: 0.12 },
    { at: 0.3, dur: 0.34, from: 370, to: 340, wave: "sine", gain: 0.12 },
  ],
  // Two gruff grunts.
  badger: [
    { at: 0, dur: 0.12, from: 150, to: 105, wave: "sawtooth", gain: 0.04 },
    { at: 0.17, dur: 0.12, from: 140, to: 100, wave: "sawtooth", gain: 0.04 },
  ],
  // A small mew.
  mosskit: [
    { at: 0, dur: 0.08, from: 800, to: 1050, wave: "triangle" },
    { at: 0.08, dur: 0.14, from: 1050, to: 720, wave: "triangle" },
  ],
  // Bright squeaky chirps.
  otter: [
    { at: 0, dur: 0.07, from: 1400, to: 1900, wave: "sine" },
    { at: 0.1, dur: 0.08, from: 1600, to: 2100, wave: "sine" },
  ],
  // One quick, high squeal.
  hare: [{ at: 0, dur: 0.1, from: 1200, to: 1550, wave: "sine" }],
  // An airy sparkle drifting upward.
  thistledown: [2400, 3000, 3600].map((from, i) => ({
    at: i * 0.07,
    dur: 0.18,
    from,
    wave: "sine" as const,
    gain: 0.04,
  })),
  // A fluttering chime (G6, B6, D7).
  glimmerwing: [1568, 1976, 2349].map((from, i) => ({
    at: i * 0.05,
    dur: 0.14,
    from,
    wave: "sine" as const,
    gain: 0.06,
  })),
  // A soft, slow puff.
  puffloaf: [
    { at: 0, dur: 0.35, from: 260, to: 190, wave: "triangle", gain: 0.1 },
  ],
  // Two falling droplets.
  dewsprite: [
    { at: 0, dur: 0.09, from: 1300, to: 650, wave: "sine" },
    { at: 0.12, dur: 0.09, from: 1100, to: 550, wave: "sine" },
  ],
  // A few crackling sparks.
  emberveil: [900, 1300, 1100].map((from, i) => ({
    at: i * 0.05,
    dur: 0.03,
    from,
    wave: "square" as const,
    gain: 0.03,
  })),
  // A slow, quiet, rustling rise and fall.
  thornwhisper: [
    { at: 0, dur: 0.25, from: 220, to: 270, wave: "triangle", gain: 0.06 },
    { at: 0.25, dur: 0.3, from: 270, to: 200, wave: "triangle", gain: 0.06 },
  ],
  // Bubbles rising from the marsh.
  mirewing: [0, 0.09, 0.18].map((at, i) => ({
    at,
    dur: 0.07,
    from: 600 + i * 80,
    to: 900 + i * 80,
    wave: "sine" as const,
  })),
  // A warm, unhurried chord (C4, E4, G4).
  fernmother: [262, 330, 392].map((from, i) => ({
    at: i * 0.08,
    dur: 0.6,
    from,
    wave: "sine" as const,
    gain: 0.05,
  })),
};

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioContext;
}

/** Plays a species' call, unless Glade sounds are muted. */
export function playCreatureSound(speciesId: SpeciesId): void {
  if (isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const start = ctx.currentTime;
  for (const tone of CREATURE_CALLS[speciesId]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const t = start + tone.at;
    osc.type = tone.wave;
    osc.frequency.setValueAtTime(tone.from, t);
    if (tone.to !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(tone.to, t + tone.dur);
    }

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(tone.gain ?? 0.08, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + tone.dur);

    osc.start(t);
    osc.stop(t + tone.dur + 0.02);
  }
}

// ─── Mute setting ─────────────────────────────────────────────────────────────
// Kept in this browser only, apart from the saved glade, so resetting the
// glade doesn't turn the sound back on.

export const GLADE_SOUND_MUTED_KEY = "glade-sound-muted";

let muted: boolean | null = null;
const listeners = new Set<() => void>();

function isMuted(): boolean {
  if (muted === null) {
    try {
      muted = localStorage.getItem(GLADE_SOUND_MUTED_KEY) === "true";
    } catch {
      muted = false;
    }
  }
  return muted;
}

export function setGladeSoundMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem(GLADE_SOUND_MUTED_KEY, String(next));
  } catch {
    // Storage blocked (a private window): the choice lasts until reload.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Whether Glade sounds are muted, kept in step with the toggle. */
export function useGladeSoundMuted(): boolean {
  return useSyncExternalStore(subscribe, isMuted, () => false);
}
