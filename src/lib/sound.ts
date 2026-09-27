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
