import { useSyncExternalStore } from "react";

// One mute setting for every sound on the site, flipped from the nav.
// Kept in this browser only, apart from any saved progress, so resetting a
// game doesn't turn the sound back on.

export const SOUND_MUTED_KEY = "sound-muted";

let muted: boolean | null = null;
const listeners = new Set<() => void>();

export function isSoundMuted(): boolean {
  if (muted === null) {
    try {
      muted = localStorage.getItem(SOUND_MUTED_KEY) === "true";
    } catch {
      muted = false;
    }
  }
  return muted;
}

export function setSoundMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem(SOUND_MUTED_KEY, String(next));
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

/** Whether site sounds are muted, kept in step with the toggle. */
export function useSoundMuted(): boolean {
  return useSyncExternalStore(subscribe, isSoundMuted, () => false);
}

let audioContext: AudioContext | null = null;

/**
 * The shared AudioContext every sound plays through, or null when sound is
 * muted or Web Audio is unavailable, so callers simply skip playing.
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || isSoundMuted()) return null;
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioContext;
}

// ─── Tones ────────────────────────────────────────────────────────────────────
// Every game's sounds are synthesised from these, so the site ships no audio
// files.

/**
 * One tone in a sound: a pitch that may slide to another over its length,
 * with a quick attack and a soft decay so nothing clicks.
 */
export interface Tone {
  /** Seconds after the sound starts. */
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
  /** Wobbles the pitch this many times a second: a warble, a purr, a bleat. */
  vibrato?: number;
}

/** A run of tones, one per pitch, `gap` seconds apart. */
export function run(
  pitches: number[],
  gap: number,
  tone: Omit<Tone, "at" | "from">,
  at = 0,
): Tone[] {
  return pitches.map((from, i) => ({ ...tone, at: at + i * gap, from }));
}

// ─── Playing ──────────────────────────────────────────────────────────────────

const echoes = new WeakMap<AudioContext, AudioNode>();

/**
 * A soft repeating echo, as if the sound hung in the air a moment: what
 * separates a magical creature's call from an everyday one's.
 */
function echoInput(ctx: AudioContext): AudioNode {
  let input = echoes.get(ctx);
  if (!input) {
    const dry = ctx.createGain();
    const delay = ctx.createDelay(0.5);
    const feedback = ctx.createGain();
    delay.delayTime.value = 0.17;
    feedback.gain.value = 0.32;
    dry.connect(ctx.destination);
    dry.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    feedback.connect(ctx.destination);
    input = dry;
    echoes.set(ctx, input);
  }
  return input;
}

export interface PlayOptions {
  /** Seconds to wait before the first tone. */
  delay?: number;
  /** Lets the sound ring on in an echo. */
  echo?: boolean;
  /** Multiplies every pitch. */
  pitch?: number;
}

/** Plays a run of tones, unless site sounds are muted. Shared by every game. */
export function play(
  tones: Tone[],
  { delay = 0, echo = false, pitch = 1 }: PlayOptions = {},
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const out = echo ? echoInput(ctx) : ctx.destination;
  const start = ctx.currentTime + delay;
  for (const tone of tones) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(out);

    const t = start + tone.at;
    const end = t + tone.dur;
    osc.type = tone.wave;
    osc.frequency.setValueAtTime(tone.from * pitch, t);
    if (tone.to !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(tone.to * pitch, end);
    }

    if (tone.vibrato !== undefined) {
      const wobble = ctx.createOscillator();
      const depth = ctx.createGain();
      wobble.frequency.value = tone.vibrato;
      depth.gain.value = tone.from * pitch * 0.03;
      wobble.connect(depth);
      depth.connect(osc.frequency);
      wobble.start(t);
      wobble.stop(end + 0.02);
    }

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(tone.gain ?? 0.08, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, end);

    osc.start(t);
    osc.stop(end + 0.02);
  }
}
