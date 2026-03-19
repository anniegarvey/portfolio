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

export function playCollectSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Quick ascending arpeggio — coin pickup feel
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  for (let i = 0; i < notes.length; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = notes[i];
    osc.type = "sine";

    const t = ctx.currentTime + i * 0.06;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.start(t);
    osc.stop(t + 0.18);
  }
}

export function playDepositSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Satisfying high "ding" — coin landing in the bank
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.value = 1046.5; // C6
  osc.type = "sine";

  const t = ctx.currentTime;
  gain.gain.setValueAtTime(0.18, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

  osc.start(t);
  osc.stop(t + 0.5);
}
