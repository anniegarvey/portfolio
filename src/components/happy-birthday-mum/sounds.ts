import { getAudioContext } from "@/lib/sound";

/**
 * A reedy, clarinet-ish voice: a square wave (all odd harmonics, like a
 * clarinet's closed tube) softened by a lowpass filter, with a gentle
 * vibrato that only creeps in once the note has sounded — the way a player
 * leans into a held note rather than wobbling from the first instant.
 */
function playClarinetNote(
  ctx: AudioContext,
  freq: number,
  startAt: number,
  durationS: number,
  peakGain = 0.06,
): void {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const vibrato = ctx.createOscillator();
  const vibratoDepth = ctx.createGain();

  osc.type = "square";
  osc.frequency.value = freq;
  filter.type = "lowpass";
  filter.frequency.value = freq * 3.5;
  filter.Q.value = 0.7;

  vibrato.frequency.value = 5.2;
  vibratoDepth.gain.setValueAtTime(0, startAt);
  vibratoDepth.gain.linearRampToValueAtTime(
    freq * 0.006,
    startAt + Math.min(0.25, durationS),
  );
  vibrato.connect(vibratoDepth);
  vibratoDepth.connect(osc.frequency);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peakGain, startAt + 0.04);
  gain.gain.setValueAtTime(peakGain, startAt + durationS * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + durationS);

  for (const node of [osc, vibrato]) {
    node.start(startAt);
    node.stop(startAt + durationS + 0.02);
  }
}

/** A sine tone sliding between two pitches, for chirps and bubbles. */
function playGlide(
  ctx: AudioContext,
  fromFreq: number,
  toFreq: number,
  startAt: number,
  durationS: number,
  peakGain: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.setValueAtTime(fromFreq, startAt);
  osc.frequency.exponentialRampToValueAtTime(toFreq, startAt + durationS);

  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peakGain, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + durationS);

  osc.start(startAt);
  osc.stop(startAt + durationS + 0.02);
}

export interface SongNote {
  freq: number;
  duration: number;
  /** The sung syllable; omitted when a note carries on the previous one. */
  lyric?: string;
}

// The four lines of "Happy Birthday to You" (public domain). "Mum" is sung
// across two notes, so its second note carries no lyric of its own.
export const SONG_LINES: SongNote[][] = [
  [
    { freq: 392.0, duration: 0.24, lyric: "Hap-" }, // G4
    { freq: 392.0, duration: 0.2, lyric: "py" }, // G4
    { freq: 440.0, duration: 0.44, lyric: "birth-" }, // A4
    { freq: 392.0, duration: 0.44, lyric: "day" }, // G4
    { freq: 523.25, duration: 0.44, lyric: "to" }, // C5
    { freq: 493.88, duration: 0.8, lyric: "you" }, // B4
  ],
  [
    { freq: 392.0, duration: 0.24, lyric: "Hap-" },
    { freq: 392.0, duration: 0.2, lyric: "py" },
    { freq: 440.0, duration: 0.44, lyric: "birth-" },
    { freq: 392.0, duration: 0.44, lyric: "day" },
    { freq: 587.33, duration: 0.44, lyric: "to" }, // D5
    { freq: 523.25, duration: 0.8, lyric: "you" }, // C5
  ],
  [
    { freq: 392.0, duration: 0.24, lyric: "Hap-" },
    { freq: 392.0, duration: 0.2, lyric: "py" },
    { freq: 783.99, duration: 0.44, lyric: "birth-" }, // G5
    { freq: 659.25, duration: 0.44, lyric: "day" }, // E5
    { freq: 523.25, duration: 0.44, lyric: "dear" }, // C5
    { freq: 493.88, duration: 0.44, lyric: "Mum" }, // B4
    { freq: 440.0, duration: 0.8 }, // A4 — "Mu-um"
  ],
  [
    { freq: 698.46, duration: 0.24, lyric: "Hap-" }, // F5
    { freq: 698.46, duration: 0.2, lyric: "py" },
    { freq: 659.25, duration: 0.44, lyric: "birth-" }, // E5
    { freq: 523.25, duration: 0.44, lyric: "day" }, // C5
    { freq: 587.33, duration: 0.44, lyric: "to" }, // D5
    { freq: 523.25, duration: 1.1, lyric: "you" }, // C5
  ],
];

// A breath of space between notes, so repeated pitches re-articulate.
const NOTE_GAP_S = 0.04;

/** When each note of a line starts, in ms from the line's start. */
export function noteOffsetsMs(line: SongNote[]): number[] {
  let t = 0;
  return line.map(({ duration }) => {
    const start = t;
    t += duration + NOTE_GAP_S;
    return Math.round(start * 1000);
  });
}

/** How long a whole line runs, for timing visuals to it. */
export function lineDurationMs(line: SongNote[]): number {
  return Math.round(
    line.reduce((total, { duration }) => total + duration + NOTE_GAP_S, 0) *
      1000,
  );
}

/** Plays one line of the song on the clarinet voice. */
export function playSongLine(line: SongNote[]): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  let t = ctx.currentTime + 0.02;
  for (const { freq, duration } of line) {
    playClarinetNote(ctx, freq, t, duration);
    t += duration + NOTE_GAP_S;
  }
}

/** A bright "la-la-la" up a major arpeggio, for the singing verse. */
export function playSingingFlourish(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    playGlide(ctx, freq * 0.98, freq, t + i * 0.13, 0.22, 0.09);
  });
}

/** A quick chalumeau-to-clarion run, for the clarinet verse. */
export function playClarinetRun(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  [293.66, 349.23, 440.0, 523.25, 698.46].forEach((freq, i) => {
    playClarinetNote(ctx, freq, t + i * 0.09, i === 4 ? 0.45 : 0.1);
  });
}

/** Two little birdsong chirps, for the gardening verse. */
export function playBirdsong(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  for (const start of [0, 0.12, 0.34]) {
    playGlide(ctx, 2200, 3400, t + start, 0.08, 0.05);
  }
}

/** A few rising bloops, for the swimming verse. */
export function playBubbles(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  [0, 0.1, 0.17, 0.3].forEach((start, i) => {
    playGlide(ctx, 300 + i * 60, 900 + i * 120, t + start, 0.09, 0.1);
  });
}
