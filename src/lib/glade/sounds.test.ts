import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ALL_SPECIES_IDS } from "./catalog";

/**
 * Just enough of the Web Audio API to see what a sound schedules: when each
 * voice starts and at what pitch, and whether it was sent through the echo.
 */
function stubAudio() {
  const voices: { at: number; pitch: number }[] = [];
  const wobbles: number[] = [];
  let echoes = 0;
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  class FakeAudioContext {
    currentTime = 0;
    destination = {};
    createOscillator() {
      const frequency = param();
      return {
        type: "sine",
        frequency,
        connect: vi.fn(),
        start(at: number) {
          const pitch = frequency.setValueAtTime.mock.calls[0]?.[0];
          // A voice sets its pitch on the clock; a vibrato just has a rate.
          if (pitch === undefined) wobbles.push(frequency.value);
          else voices.push({ at, pitch });
        },
        stop: vi.fn(),
      };
    }
    createGain() {
      return { gain: param(), connect: vi.fn() };
    }
    createDelay() {
      echoes += 1;
      return { delayTime: param(), connect: vi.fn() };
    }
  }
  vi.stubGlobal("AudioContext", FakeAudioContext);
  return { voices, wobbles, echoCount: () => echoes };
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

  it("plays one voice per note of the species' call", async () => {
    const { voices, wobbles } = stubAudio();
    const { playCreatureSound, CREATURE_CALLS } = await loadSounds();

    playCreatureSound("wren");

    expect(voices).toHaveLength(CREATURE_CALLS.wren.length);
    expect(wobbles).toEqual(
      CREATURE_CALLS.wren.flatMap((tone) => tone.vibrato ?? []),
    );
  });

  it("never repeats a call at quite the same pitch, but stays close", async () => {
    const { voices } = stubAudio();
    const { playCreatureSound, CREATURE_CALLS } = await loadSounds();
    const written = CREATURE_CALLS.owl[0].from;

    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(1);
    playCreatureSound("owl");
    playCreatureSound("owl");
    vi.restoreAllMocks();

    const low = voices[0].pitch;
    const high = voices[CREATURE_CALLS.owl.length].pitch;
    expect(low).toBeCloseTo(written * 0.96);
    expect(high).toBeCloseTo(written * 1.04);
  });

  it("lets only a fantastical creature's call ring on in an echo", async () => {
    const audio = stubAudio();
    const { playCreatureSound } = await loadSounds();

    playCreatureSound("fox");
    expect(audio.echoCount()).toBe(0);

    playCreatureSound("mirewing");
    playCreatureSound("fernmother");
    // One echo, shared by every sound that uses it.
    expect(audio.echoCount()).toBe(1);
  });

  it("stays silent when site sounds are muted", async () => {
    const { voices } = stubAudio();
    const sounds = await loadSounds();
    const { setSoundMuted } = await import("@/lib/sound");

    setSoundMuted(true);
    sounds.playCreatureSound("owl");
    sounds.playTrustSound(true, 0.5);
    sounds.playTameSound(1.3);
    sounds.playCookSound();
    sounds.playBuySound();
    sounds.playLessonSound();
    expect(voices).toHaveLength(0);
  });

  it("does nothing where Web Audio is unavailable", async () => {
    const { playCreatureSound } = await loadSounds();
    // jsdom has no AudioContext.
    expect(() => playCreatureSound("fox")).not.toThrow();
  });
});

describe("reward sounds", () => {
  it("chimes higher the closer a visitor is to tame", async () => {
    const { trustChime } = await loadSounds();
    const pitches = [0, 0.25, 0.5, 0.75, 1].map((p) => trustChime(p)[0].from);
    expect(pitches).toEqual([...pitches].sort((a, b) => a - b));
    expect(new Set(pitches).size).toBe(pitches.length);
  });

  it("always rises within a chime, and copes with trust outside 0 to 1", async () => {
    const { trustChime } = await loadSounds();
    for (const progress of [-1, 0, 0.4, 1, 3]) {
      const [first, second] = trustChime(progress);
      expect(second.from).toBeGreaterThan(first.from);
      expect(second.at).toBeGreaterThan(first.at);
    }
    expect(trustChime(-1)).toEqual(trustChime(0));
    expect(trustChime(3)).toEqual(trustChime(1));
  });

  it("answers a matched action with the chime, a beat after the call", async () => {
    const { voices } = stubAudio();
    const { playTrustSound, trustChime } = await loadSounds();

    playTrustSound(true, 0.5);

    const chime = trustChime(0.5);
    expect(voices.map((v) => v.pitch)).toEqual(chime.map((t) => t.from));
    expect(voices[0].at).toBeCloseTo(0.22);
  });

  it("answers a missed action with one low note instead", async () => {
    const { voices } = stubAudio();
    const { playTrustSound, trustChime } = await loadSounds();

    playTrustSound(false, 0.5);

    expect(voices).toHaveLength(1);
    expect(voices[0].pitch).toBeLessThan(trustChime(0)[0].from);
  });

  it("times the fanfare's bright chord to the creature landing", async () => {
    const { tameFanfare } = await loadSounds();
    const fanfare = tameFanfare(1.3);
    const flourish = fanfare.filter((t) => t.at < 1.3);
    const landing = fanfare.filter((t) => t.at === 1.3);

    expect(flourish.map((t) => t.from)).toEqual([523, 659, 784, 1047]);
    expect(landing.map((t) => t.from)).toEqual([1047, 1319, 1568]);
    expect(tameFanfare(2).filter((t) => t.at === 2)).toHaveLength(3);
  });

  it("plays the fanfare through the echo", async () => {
    const audio = stubAudio();
    const { playTameSound, tameFanfare } = await loadSounds();

    playTameSound(1.3);

    expect(audio.voices).toHaveLength(tameFanfare(1.3).length);
    expect(audio.echoCount()).toBe(1);
  });

  it("gives cooking, buying and lessons each a sound of their own", async () => {
    const { voices } = stubAudio();
    const sounds = await loadSounds();

    const heard = [
      sounds.playCookSound,
      sounds.playBuySound,
      sounds.playLessonSound,
    ].map((play) => {
      voices.length = 0;
      play();
      return JSON.stringify(voices);
    });

    expect(heard.every((sound) => sound !== "[]")).toBe(true);
    expect(new Set(heard).size).toBe(3);
  });
});
