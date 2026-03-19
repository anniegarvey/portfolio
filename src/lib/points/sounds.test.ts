import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("sounds", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not throw when AudioContext constructor throws", async () => {
    vi.stubGlobal(
      "AudioContext",
      vi.fn(() => {
        throw new Error("not supported");
      }),
    );

    const { playCollectSound, playDepositSound } = await import("./sounds");
    expect(() => playCollectSound()).not.toThrow();
    expect(() => playDepositSound()).not.toThrow();
  });

  it("does not throw when AudioContext is unavailable", async () => {
    vi.stubGlobal("AudioContext", undefined);

    const { playCollectSound, playDepositSound } = await import("./sounds");
    expect(() => playCollectSound()).not.toThrow();
    expect(() => playDepositSound()).not.toThrow();
  });
});
