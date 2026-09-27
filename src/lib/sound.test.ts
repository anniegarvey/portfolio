import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The module keeps its AudioContext and mute setting once read, so each test
// loads a fresh copy.
async function loadSound() {
  vi.resetModules();
  return import("./sound");
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getAudioContext", () => {
  it("shares one AudioContext while sound is on", async () => {
    vi.stubGlobal("AudioContext", class {});
    const { getAudioContext } = await loadSound();

    const ctx = getAudioContext();
    expect(ctx).not.toBeNull();
    expect(getAudioContext()).toBe(ctx);
  });

  it("gives nothing to play through when muted", async () => {
    vi.stubGlobal("AudioContext", class {});
    const { getAudioContext, setSoundMuted } = await loadSound();

    setSoundMuted(true);
    expect(getAudioContext()).toBeNull();
  });

  it("gives nothing where Web Audio is unavailable", async () => {
    vi.stubGlobal(
      "AudioContext",
      vi.fn(() => {
        throw new Error("not supported");
      }),
    );
    const { getAudioContext } = await loadSound();

    expect(getAudioContext()).toBeNull();
  });
});

describe("mute setting", () => {
  it("remembers the choice in this browser", async () => {
    const first = await loadSound();
    first.setSoundMuted(true);
    expect(localStorage.getItem(first.SOUND_MUTED_KEY)).toBe("true");

    // A fresh load (the next visit) picks the setting back up.
    const reloaded = await loadSound();
    expect(reloaded.isSoundMuted()).toBe(true);
  });

  it("defaults to sound on when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { isSoundMuted } = await loadSound();

    expect(isSoundMuted()).toBe(false);
    vi.restoreAllMocks();
  });

  it("keeps the hook in step with the toggle", async () => {
    const { setSoundMuted, useSoundMuted } = await loadSound();
    const { result } = renderHook(() => useSoundMuted());
    expect(result.current).toBe(false);

    act(() => setSoundMuted(true));
    expect(result.current).toBe(true);

    act(() => setSoundMuted(false));
    expect(result.current).toBe(false);
  });
});
