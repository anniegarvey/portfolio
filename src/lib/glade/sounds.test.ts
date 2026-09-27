import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ALL_SPECIES_IDS } from "./catalog";

/** Just enough of the Web Audio API to count the tones a call schedules. */
function stubAudio() {
  const started: number[] = [];
  const param = () => ({
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  class FakeAudioContext {
    currentTime = 0;
    destination = {};
    createOscillator() {
      return {
        type: "sine",
        frequency: param(),
        connect: vi.fn(),
        start: (at: number) => started.push(at),
        stop: vi.fn(),
      };
    }
    createGain() {
      return { gain: param(), connect: vi.fn() };
    }
  }
  vi.stubGlobal("AudioContext", FakeAudioContext);
  return started;
}

// The module keeps its AudioContext and mute setting once read, so each test
// loads a fresh copy.
async function loadSounds() {
  vi.resetModules();
  return import("./sounds");
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("creature sounds", () => {
  it("gives every species a call of its own", async () => {
    const { CREATURE_CALLS } = await loadSounds();
    const calls = ALL_SPECIES_IDS.map((id) =>
      JSON.stringify(CREATURE_CALLS[id]),
    );
    expect(calls.every((call) => call !== "[]")).toBe(true);
    expect(new Set(calls).size).toBe(ALL_SPECIES_IDS.length);
  });

  it("keeps every call short", async () => {
    const { CREATURE_CALLS } = await loadSounds();
    for (const id of ALL_SPECIES_IDS) {
      const end = Math.max(...CREATURE_CALLS[id].map((t) => t.at + t.dur));
      expect(end).toBeLessThan(1);
    }
  });

  it("plays one tone per note of the species' call", async () => {
    const started = stubAudio();
    const { playCreatureSound, CREATURE_CALLS } = await loadSounds();

    playCreatureSound("wren");

    expect(started).toHaveLength(CREATURE_CALLS.wren.length);
  });

  it("stays silent when site sounds are muted", async () => {
    const started = stubAudio();
    const sounds = await loadSounds();
    const { setSoundMuted } = await import("@/lib/sound");

    setSoundMuted(true);
    sounds.playCreatureSound("owl");
    expect(started).toHaveLength(0);
  });

  it("does nothing where Web Audio is unavailable", async () => {
    const { playCreatureSound } = await loadSounds();
    // jsdom has no AudioContext.
    expect(() => playCreatureSound("fox")).not.toThrow();
  });
});
