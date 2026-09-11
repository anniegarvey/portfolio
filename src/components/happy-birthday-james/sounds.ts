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
  analyser?: AnalyserNode,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  if (analyser) gain.connect(analyser);

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

// The full four-line "Happy Birthday to You" (public domain), split into
// sections so each dial completion advances to the next line rather than
// replaying the same six notes every time.
const HAPPY_BIRTHDAY_SECTIONS: Array<
  Array<{ freq: number; duration: number }>
> = [
  [
    { freq: 392.0, duration: 0.22 }, // G4 — Hap-
    { freq: 392.0, duration: 0.22 }, // G4 — -py
    { freq: 440.0, duration: 0.42 }, // A4 — Birth-
    { freq: 392.0, duration: 0.42 }, // G4 — -day
    { freq: 523.25, duration: 0.42 }, // C5 — to
    { freq: 493.88, duration: 0.75 }, // B4 — you
  ],
  [
    { freq: 392.0, duration: 0.22 }, // G4 — Hap-
    { freq: 392.0, duration: 0.22 }, // G4 — -py
    { freq: 440.0, duration: 0.42 }, // A4 — Birth-
    { freq: 392.0, duration: 0.42 }, // G4 — -day
    { freq: 587.33, duration: 0.42 }, // D5 — to
    { freq: 523.25, duration: 0.75 }, // C5 — you
  ],
  [
    { freq: 392.0, duration: 0.22 }, // G4 — Hap-
    { freq: 392.0, duration: 0.22 }, // G4 — -py
    { freq: 783.99, duration: 0.42 }, // G5 — Birth-
    { freq: 659.25, duration: 0.42 }, // E5 — -day
    { freq: 523.25, duration: 0.42 }, // C5 — dear
    { freq: 493.88, duration: 0.42 }, // B4 — Ja-
    { freq: 440.0, duration: 0.75 }, // A4 — -mes
  ],
  [
    { freq: 698.46, duration: 0.22 }, // F5 — Hap-
    { freq: 698.46, duration: 0.22 }, // F5 — -py
    { freq: 659.25, duration: 0.42 }, // E5 — Birth-
    { freq: 523.25, duration: 0.42 }, // C5 — -day
    { freq: 587.33, duration: 0.42 }, // D5 — to
    { freq: 523.25, duration: 0.75 }, // C5 — you
  ],
];

function sectionFor(index: number) {
  return HAPPY_BIRTHDAY_SECTIONS[index % HAPPY_BIRTHDAY_SECTIONS.length];
}

/** How long section `index` of the riff runs, for callers timing a visual to it. */
export function getHappyBirthdayRiffMs(index: number): number {
  return Math.round(
    sectionFor(index).reduce(
      (total, { duration }) => total + duration + 0.03,
      0,
    ) * 1000,
  );
}

/**
 * The dial's celebration sting. Each completion plays the next line of the
 * song (looping back to the first after the fourth), so repeat taps
 * progress through the whole tune instead of repeating the same phrase.
 * Returns an AnalyserNode tapped off every note, so a caller can poll its
 * amplitude (via getByteFrequencyData) to drive a visual that pulses in
 * time with the melody rather than on a fixed, audio-independent timer.
 */
export function playHappyBirthdayRiff(index: number): AnalyserNode | null {
  const ctx = getAudioContext();
  if (!ctx) return null;

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 32;

  let t = ctx.currentTime;
  for (const { freq, duration } of sectionFor(index)) {
    playNote(ctx, freq, t, duration, 0.14, analyser);
    t += duration + 0.03;
  }
  return analyser;
}
