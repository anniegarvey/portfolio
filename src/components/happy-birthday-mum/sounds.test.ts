import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAudioContext } from "@/lib/sound";
import {
  lineDurationMs,
  noteOffsetsMs,
  playBirdsong,
  playBubbles,
  playClarinetRun,
  playSingingFlourish,
  playSongLine,
  SONG_LINES,
} from "./sounds";

vi.mock("@/lib/sound", () => ({ getAudioContext: vi.fn() }));

function fakeParam() {
  return {
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
}

function fakeContext() {
  const node = () => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    type: "",
    frequency: fakeParam(),
    gain: fakeParam(),
    Q: fakeParam(),
  });
  return {
    currentTime: 0,
    destination: {},
    createOscillator: vi.fn(node),
    createGain: vi.fn(node),
    createBiquadFilter: vi.fn(node),
  };
}

describe("happy-birthday-mum sounds", () => {
  beforeEach(() => {
    vi.mocked(getAudioContext).mockReset();
  });

  it("times each note of a line from the line's start", () => {
    const line = [
      { freq: 440, duration: 0.2, lyric: "a" },
      { freq: 440, duration: 0.3, lyric: "b" },
      { freq: 440, duration: 0.5 },
    ];
    expect(noteOffsetsMs(line)).toEqual([0, 240, 580]);
    expect(lineDurationMs(line)).toBe(1120);
  });

  it("sings 'dear Mum' on the third line", () => {
    const lyrics = SONG_LINES[2].map((note) => note.lyric).filter(Boolean);
    expect(lyrics).toEqual(["Hap-", "py", "birth-", "day", "dear", "Mum"]);
  });

  it("plays nothing when sound is unavailable or muted", () => {
    vi.mocked(getAudioContext).mockReturnValue(null);
    for (const play of [
      () => playSongLine(SONG_LINES[0]),
      playSingingFlourish,
      playClarinetRun,
      playBirdsong,
      playBubbles,
    ]) {
      expect(() => play()).not.toThrow();
    }
  });

  it("schedules an oscillator for every note it plays", () => {
    const ctx = fakeContext();
    vi.mocked(getAudioContext).mockReturnValue(ctx as unknown as AudioContext);

    playSongLine(SONG_LINES[0]);
    // The clarinet voice uses a tone and a vibrato oscillator per note.
    expect(ctx.createOscillator).toHaveBeenCalledTimes(
      SONG_LINES[0].length * 2,
    );

    for (const play of [
      playSingingFlourish,
      playClarinetRun,
      playBirdsong,
      playBubbles,
    ]) {
      ctx.createOscillator.mockClear();
      play();
      expect(ctx.createOscillator).toHaveBeenCalled();
    }
  });
});
