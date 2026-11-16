import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ALL_NEIGHBOUR_IDS } from "./catalog";

/**
 * Just enough of the Web Audio API to see what a sound schedules: when each
 * voice starts and at what pitch, and whether it was sent through the echo.
 */
function stubAudio() {
  const voices: { at: number; pitch: number }[] = [];
  const bands: number[] = [];
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
          if (pitch !== undefined) voices.push({ at, pitch });
        },
        stop: vi.fn(),
      };
    }
    createGain() {
      return { gain: param(), connect: vi.fn() };
    }
    sampleRate = 8;
    createBuffer(_channels: number, length: number) {
      const data = new Float32Array(length);
      return { getChannelData: () => data };
    }
    createBufferSource() {
      // Noise has no pitch of its own: recorded as 0.
      return {
        connect: vi.fn(),
        start: (at: number) => voices.push({ at, pitch: 0 }),
        stop: vi.fn(),
      };
    }
    createBiquadFilter() {
      const frequency = param();
      bands.push(0);
      return {
        type: "",
        Q: param(),
        frequency,
        connect: vi.fn(),
      };
    }
    createDelay() {
      echoes += 1;
      return { delayTime: param(), connect: vi.fn() };
    }
  }
  vi.stubGlobal("AudioContext", FakeAudioContext);
  return { voices, bandCount: () => bands.length, echoCount: () => echoes };
}

// The module keeps its streak, AudioContext and mute setting once read, so
// each test loads a fresh copy.
async function loadSounds() {
  vi.resetModules();
  return import("./sounds");
}

const end = (tones: { at: number; dur: number }[]) =>
  Math.max(...tones.map((t) => t.at + t.dur));

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("haul chime", () => {
  it("starts a step higher for every haul in a streak", async () => {
    const { haulChime } = await loadSounds();
    const firsts = [0, 1, 2, 3, 4].map((streak) => haulChime(streak)[1].from);
    expect(firsts).toEqual([...firsts].sort((a, b) => a - b));
    expect(new Set(firsts).size).toBe(firsts.length);
  });

  it("rises within every chime, and tops out rather than running off the scale", async () => {
    const { haulChime } = await loadSounds();
    for (const streak of [-3, 0, 5, 50]) {
      const [, low, high] = haulChime(streak);
      expect(high.from).toBeGreaterThan(low.from);
      expect(Number.isFinite(high.from)).toBe(true);
    }
    expect(haulChime(50)).toEqual(haulChime(500));
    expect(haulChime(-3)).toEqual(haulChime(0));
  });
});

describe("streaks", () => {
  it("counts hauls close together and starts over after a pause", async () => {
    const { nextStreak, STREAK_MS } = await loadSounds();
    expect(nextStreak(1000)).toBe(0);
    expect(nextStreak(1000 + STREAK_MS)).toBe(1);
    expect(nextStreak(1000 + STREAK_MS * 2)).toBe(2);
    expect(nextStreak(1000 + STREAK_MS * 3 + 1)).toBe(0);
  });

  it("climbs as a row of beds is harvested, then a forage carries it on", async () => {
    const { voices } = stubAudio();
    const { playHarvestSound, playForageSound, haulChime } = await loadSounds();
    vi.spyOn(Date, "now").mockReturnValue(5000);

    playHarvestSound();
    playHarvestSound();
    playForageSound();

    // Each haul chime's second voice is its first note.
    const chime = haulChime(0).length;
    expect(voices[1].pitch).toBe(haulChime(0)[1].from);
    expect(voices[chime + 1].pitch).toBe(haulChime(1)[1].from);
    // The forage's rustle plays first, then its chime.
    const rustle = voices.length - chime * 3;
    expect(voices[chime * 2 + rustle + 1].pitch).toBe(haulChime(2)[1].from);
  });
});

describe("the farm's sounds", () => {
  it("plays one voice per note, through the echo for the magical ones", async () => {
    const audio = stubAudio();
    const sounds = await loadSounds();

    sounds.playSowSound();
    expect(audio.voices).toHaveLength(sounds.SOW.length);
    expect(audio.echoCount()).toBe(0);

    sounds.playWaterSound();
    expect(audio.voices).toHaveLength(sounds.SOW.length + sounds.WATER.length);
    expect(audio.echoCount()).toBe(1);
  });

  it("answers an empty-handed tap with a soft hm", async () => {
    const { voices } = stubAudio();
    const { playNothingSound, NOTHING } = await loadSounds();
    playNothingSound();
    expect(voices).toHaveLength(NOTHING.length);
  });

  it("has the cat say something different each time it is petted", async () => {
    const { voices } = stubAudio();
    const { playCatSound, CAT_SOUNDS } = await loadSounds();
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    playCatSound(0);
    playCatSound(1);
    playCatSound(CAT_SOUNDS.length);

    const [first, second] = CAT_SOUNDS;
    expect(voices[0].pitch).toBeCloseTo(first[0].from);
    expect(voices[first.length].pitch).toBeCloseTo(second[0].from);
    // Round again to the first.
    expect(voices[first.length + second.length].pitch).toBeCloseTo(
      first[0].from,
    );
  });

  it("gives every neighbour's door a sound of its own", async () => {
    const { DOOR_SOUNDS } = await loadSounds();
    const doors = ALL_NEIGHBOUR_IDS.map((id) =>
      JSON.stringify(DOOR_SOUNDS[id]),
    );
    expect(new Set(doors).size).toBe(ALL_NEIGHBOUR_IDS.length);
  });

  it("rings a door, the stall and a purchase", async () => {
    const { voices } = stubAudio();
    const sounds = await loadSounds();

    sounds.playDoorSound("bram");
    sounds.playShopSound();
    sounds.playBuySound();

    expect(voices).toHaveLength(
      sounds.DOOR_SOUNDS.bram.length +
        sounds.SHOP_BELL.length +
        sounds.SEED_BOUGHT.length,
    );
  });
});

describe("textured sounds", () => {
  it("rustles with soft, swelling noise rather than a pitch", async () => {
    const audio = stubAudio();
    const { playForageSound, rustle } = await loadSounds();
    const leaves = rustle();
    expect(leaves.every((tone) => tone.wave === "noise")).toBe(true);
    // A sharp start is what makes a burst of noise sound like a drum.
    expect(leaves.every((tone) => (tone.attack ?? 0) > 0.03)).toBe(true);

    playForageSound();
    const hisses = audio.voices.filter((voice) => voice.pitch === 0);
    expect(hisses).toHaveLength(leaves.length);
    // Every hiss is narrowed to a band, or it would be a radio between stations.
    expect(audio.bandCount()).toBeGreaterThanOrEqual(leaves.length);
  });

  it("never rustles quite the same way twice", async () => {
    const { rustle } = await loadSounds();
    expect(rustle(() => 0)).not.toEqual(rustle(() => 0.9));
    expect(rustle(() => 0.3)).toEqual(rustle(() => 0.3));
  });

  it("glugs: every bubble rises, and the water ends in a splash", async () => {
    const { WATER } = await loadSounds();
    const bubbles = WATER.filter((tone) => tone.wave !== "noise");
    expect(bubbles.every((tone) => (tone.to ?? 0) > tone.from)).toBe(true);
    expect(WATER.at(-1)?.wave).toBe("noise");
  });

  it("creaks the mill wheel through a hollow with a judder", async () => {
    const { DOOR_SOUNDS } = await loadSounds();
    const creaks = DOOR_SOUNDS.wren.filter((tone) => tone.filter !== undefined);
    expect(creaks.length).toBeGreaterThanOrEqual(2);
    expect(creaks.every((tone) => (tone.vibratoDepth ?? 0) > 0.1)).toBe(true);
  });

  it("purrs at about a real cat's rate", async () => {
    const { CAT_SOUNDS } = await loadSounds();
    const purr = CAT_SOUNDS[2];
    expect(purr.every((tone) => tone.from >= 20 && tone.from <= 30)).toBe(true);
  });

  it("purrs in one long breath that builds before it fades", async () => {
    const { CAT_SOUNDS } = await loadSounds();
    const [breath, ...rest] = CAT_SOUNDS[2];
    expect(rest).toHaveLength(0);
    expect(breath.dur).toBeGreaterThanOrEqual(1.5);
    expect(breath.attack ?? 0).toBeGreaterThan(0.3);
  });
});

describe("rewards", () => {
  it("makes more of a loved gift, and most of a new friendship tier", async () => {
    const { voices } = stubAudio();
    const sounds = await loadSounds();

    sounds.playGiftSound(false, false);
    const accepted = voices.length;
    sounds.playGiftSound(true, false);
    const loved = voices.length - accepted;
    sounds.playGiftSound(true, true);
    const tierUp = voices.length - accepted - loved;

    expect(accepted).toBe(sounds.GIFT_ACCEPTED.length);
    expect(loved).toBe(sounds.GIFT_LOVED.length);
    expect(tierUp).toBe(sounds.FRIENDSHIP_UP.length);
    expect(end(sounds.FRIENDSHIP_UP)).toBeGreaterThan(end(sounds.GIFT_LOVED));
  });

  it("celebrates a quest more than an errand", async () => {
    const { voices } = stubAudio();
    const sounds = await loadSounds();

    sounds.playQuestSound();
    sounds.playErrandSound();
    sounds.playMorningSound();

    expect(voices).toHaveLength(
      sounds.QUEST_FANFARE.length +
        sounds.ERRAND_DONE.length +
        sounds.MORNING.length,
    );
    expect(end(sounds.QUEST_FANFARE)).toBeGreaterThan(end(sounds.ERRAND_DONE));
  });

  it("stays silent when site sounds are muted", async () => {
    const { voices } = stubAudio();
    const sounds = await loadSounds();
    const { setSoundMuted } = await import("@/lib/sound");

    setSoundMuted(true);
    sounds.playSowSound();
    sounds.playHarvestSound();
    sounds.playForageSound();
    sounds.playCatSound(0);
    sounds.playDoorSound("wren");
    sounds.playGiftSound(true, true);
    sounds.playQuestSound();
    expect(voices).toHaveLength(0);
  });
});
