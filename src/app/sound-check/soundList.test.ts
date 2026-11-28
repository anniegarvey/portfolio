import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import * as glade from "@/lib/glade/sounds";
import * as meadowmere from "@/lib/meadowmere/sounds";
import * as points from "@/lib/points/sounds";
import { SOUND_GROUPS } from "./soundList";

const source = readFileSync(path.join(__dirname, "soundList.ts"), "utf8");

describe("SOUND_GROUPS", () => {
  it.each([
    ["glade", glade],
    ["meadowmere", meadowmere],
    ["points", points],
  ])("lists every play function from %s's sounds", (name, module) => {
    const playFunctions = Object.keys(module).filter((key) =>
      key.startsWith("play"),
    );
    expect(playFunctions.length).toBeGreaterThan(0);
    for (const fn of playFunctions) {
      expect(source).toContain(`${name}.${fn}`);
    }
  });

  it("gives every sound a unique label within its group", () => {
    for (const group of SOUND_GROUPS) {
      const labels = group.sounds.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    }
  });

  it("plays every sound without throwing when there is no audio", () => {
    // jsdom has no AudioContext, so each play call should quietly do nothing.
    vi.stubGlobal("AudioContext", undefined);
    for (const group of SOUND_GROUPS) {
      for (const sound of group.sounds) {
        expect(() => sound.play()).not.toThrow();
      }
    }
    vi.unstubAllGlobals();
  });
});
