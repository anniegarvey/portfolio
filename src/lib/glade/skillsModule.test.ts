import { describe, expect, it } from "vitest";
import { LESSON_COSTS, XP_THRESHOLDS } from "./catalog";
import {
  buyLesson,
  canBuyLesson,
  gainXp,
  hasClearHints,
  nextLessonCost,
} from "./skillsModule";
import { makeGladeState, makeSkill } from "./testFixtures";

describe("gainXp", () => {
  it("grants 1 XP per action", () => {
    const state = makeGladeState();
    const next = gainXp(state, "body-language");
    expect(next.skills["body-language"].xp).toBe(1);
  });

  it("does not affect other skills", () => {
    const state = makeGladeState();
    const next = gainXp(state, "body-language");
    expect(next.skills["treat-cooking"].xp).toBe(0);
    expect(next.skills["petting-technique"].xp).toBe(0);
  });

  it("clamps XP at the tier threshold", () => {
    const state = makeGladeState({
      skills: {
        "treat-cooking": makeSkill(),
        "body-language": makeSkill({ xp: XP_THRESHOLDS[0] }),
        "petting-technique": makeSkill(),
      },
    });
    const next = gainXp(state, "body-language");
    expect(next.skills["body-language"].xp).toBe(XP_THRESHOLDS[0]);
  });

  it("grants +1 bonus XP when a muse resident lives in the glade", () => {
    const state = makeGladeState({
      residents: [
        {
          id: "00000000-0000-4000-8000-000000000002",
          speciesId: "owl", // muse
          tamedDate: "2026-06-01",
          position: { x: 50, y: 50 },
        },
      ],
    });
    const next = gainXp(state, "body-language");
    expect(next.skills["body-language"].xp).toBe(2);
  });

  it("is a no-op at max tier", () => {
    const state = makeGladeState({
      skills: {
        "treat-cooking": makeSkill(),
        "body-language": makeSkill({ tier: 5 }),
        "petting-technique": makeSkill(),
      },
    });
    const next = gainXp(state, "body-language");
    expect(next.skills["body-language"].xp).toBe(0);
  });
});

describe("canBuyLesson / nextLessonCost", () => {
  it("is not buyable until the XP bar is full", () => {
    const state = makeGladeState();
    expect(canBuyLesson(state, "treat-cooking")).toBe(false);
  });

  it("is buyable once XP reaches the threshold", () => {
    const state = makeGladeState({
      skills: {
        "treat-cooking": makeSkill({ xp: XP_THRESHOLDS[0] }),
        "body-language": makeSkill(),
        "petting-technique": makeSkill(),
      },
    });
    expect(canBuyLesson(state, "treat-cooking")).toBe(true);
    expect(nextLessonCost(state, "treat-cooking")).toBe(LESSON_COSTS[0]);
  });

  it("is never buyable at max tier, and cost is null", () => {
    const state = makeGladeState({
      skills: {
        "treat-cooking": makeSkill({ tier: 5, xp: 99 }),
        "body-language": makeSkill(),
        "petting-technique": makeSkill(),
      },
    });
    expect(canBuyLesson(state, "treat-cooking")).toBe(false);
    expect(nextLessonCost(state, "treat-cooking")).toBe(null);
  });
});

describe("buyLesson", () => {
  it("advances the tier and resets XP", () => {
    const state = makeGladeState({
      skills: {
        "treat-cooking": makeSkill({ xp: XP_THRESHOLDS[0] }),
        "body-language": makeSkill(),
        "petting-technique": makeSkill(),
      },
    });
    const next = buyLesson(state, "treat-cooking");
    expect(next.skills["treat-cooking"]).toEqual({ tier: 2, xp: 0 });
  });

  it("returns the state unchanged when the bar is not full", () => {
    const state = makeGladeState();
    expect(buyLesson(state, "treat-cooking")).toBe(state);
  });
});

describe("hasClearHints", () => {
  it("is false at starting tiers", () => {
    expect(hasClearHints(makeGladeState())).toBe(false);
  });

  it("unlocks when body-language and petting tiers sum to 6", () => {
    const state = makeGladeState({
      skills: {
        "treat-cooking": makeSkill(),
        "body-language": makeSkill({ tier: 3 }),
        "petting-technique": makeSkill({ tier: 3 }),
      },
    });
    expect(hasClearHints(state)).toBe(true);
  });
});
