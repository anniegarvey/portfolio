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

function playNote(
  ctx: AudioContext,
  freq: number,
  startAt: number,
  durationS: number,
  peakGain: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.value = freq;
  osc.type = "sine";

  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peakGain, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + durationS);

  osc.start(startAt);
  osc.stop(startAt + durationS + 0.02);
}

/** A quick mechanical double-tick — the dial catching as it's turned. */
export function playDialClick(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  for (const start of [t, t + 0.07]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "square";
    osc.frequency.value = 900;

    gain.gain.setValueAtTime(0.06, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.04);

    osc.start(start);
    osc.stop(start + 0.05);
  }
}

/** A soft two-tone blip for a card flipping over. */
export function playCardFlip(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  playNote(ctx, 700, t, 0.08, 0.08);
  playNote(ctx, 950, t + 0.06, 0.1, 0.08);
}

// The opening phrase of "Happy Birthday to You" (public domain) — G G A G C B,
// enough to be instantly recognizable without overstaying a replayable sting.
const HAPPY_BIRTHDAY_RIFF: Array<{ freq: number; duration: number }> = [
  { freq: 392.0, duration: 0.22 }, // G4 — Hap-
  { freq: 392.0, duration: 0.22 }, // G4 — -py
  { freq: 440.0, duration: 0.42 }, // A4 — Birth-
  { freq: 392.0, duration: 0.42 }, // G4 — -day
  { freq: 523.25, duration: 0.42 }, // C5 — to
  { freq: 493.88, duration: 0.75 }, // B4 — you
];

/** The dial's celebration sting, once it reaches Mark 33. */
export function playHappyBirthdayRiff(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  let t = ctx.currentTime;
  for (const { freq, duration } of HAPPY_BIRTHDAY_RIFF) {
    playNote(ctx, freq, t, duration, 0.14);
    t += duration + 0.03;
  }
}
