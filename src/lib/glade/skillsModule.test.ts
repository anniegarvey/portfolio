import { describe, expect, it } from "vitest";
import { LESSON_COSTS, XP_THRESHOLDS } from "./catalog";
import {
  buyLesson,
  canBuyLesson,
  gainXp,
  isConfirmedHintUnlocked,
  isSkillUnlocked,
  isToggletipVisible,
  isTriedLogUnlocked,
  isVagueHintUnlocked,
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

  it("muse bonuses stack: each muse adds +1 XP per action", () => {
    const state = makeGladeState({
      residents: [
        {
          id: "00000000-0000-4000-8000-000000000002",
          speciesId: "owl", // muse
          tamedDate: "2026-06-01",
          position: { x: 50, y: 50 },
        },
        {
          id: "00000000-0000-4000-8000-000000000003",
          speciesId: "robin", // muse
          tamedDate: "2026-06-01",
          position: { x: 30, y: 60 },
        },
        {
          id: "00000000-0000-4000-8000-000000000004",
          speciesId: "rabbit", // forager — must not count
          tamedDate: "2026-06-01",
          position: { x: 70, y: 60 },
        },
      ],
    });
    const next = gainXp(state, "body-language");
    expect(next.skills["body-language"].xp).toBe(3);
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
        "petting-technique": makeSkill({ tier: 2 }),
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
        "petting-technique": makeSkill({ tier: 2 }),
      },
    });
    expect(canBuyLesson(state, "treat-cooking")).toBe(false);
    expect(nextLessonCost(state, "treat-cooking")).toBe(null);
  });

  it("is never buyable while the skill is locked, even with a full XP bar", () => {
    const state = makeGladeState({
      skills: {
        "treat-cooking": makeSkill({ xp: XP_THRESHOLDS[0] }),
        "body-language": makeSkill(),
        "petting-technique": makeSkill(), // tier 1 — locks treat-cooking
      },
    });
    expect(canBuyLesson(state, "treat-cooking")).toBe(false);
  });
});

describe("buyLesson", () => {
  it("advances the tier and resets XP", () => {
    const state = makeGladeState({
      skills: {
        "treat-cooking": makeSkill({ xp: XP_THRESHOLDS[0] }),
        "body-language": makeSkill(),
        "petting-technique": makeSkill({ tier: 2 }),
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

describe("isVagueHintUnlocked", () => {
  it("is false below tier 2 on the mapped skill", () => {
    const state = makeGladeState({
      skills: {
        "treat-cooking": makeSkill(),
        "body-language": makeSkill(),
        "petting-technique": makeSkill(),
      },
    });
    expect(isVagueHintUnlocked(state, "posture")).toBe(false);
  });

  it("unlocks per type at tier 2 on that type's own mapped skill", () => {
    const state = makeGladeState({
      skills: {
        "treat-cooking": makeSkill(),
        "body-language": makeSkill({ tier: 2 }),
        "petting-technique": makeSkill(),
      },
    });
    expect(isVagueHintUnlocked(state, "posture")).toBe(true);
    expect(isVagueHintUnlocked(state, "petSpot")).toBe(false);
    expect(isVagueHintUnlocked(state, "treat")).toBe(false);
  });
});

describe("isToggletipVisible", () => {
  it("is false when no skill has reached tier 3", () => {
    const state = makeGladeState({
      skills: {
        "treat-cooking": makeSkill(),
        "body-language": makeSkill({ tier: 2 }),
        "petting-technique": makeSkill({ tier: 2 }),
      },
    });
    expect(isToggletipVisible(state)).toBe(false);
  });

  it("becomes visible once any one of the three skills reaches tier 3", () => {
    const state = makeGladeState({
      skills: {
        "treat-cooking": makeSkill(),
        "body-language": makeSkill({ tier: 3 }),
        "petting-technique": makeSkill(),
      },
    });
    expect(isToggletipVisible(state)).toBe(true);
  });
});

describe("isConfirmedHintUnlocked", () => {
  it("is gated per type on that type's own mapped skill reaching tier 3", () => {
    const state = makeGladeState({
      skills: {
        "treat-cooking": makeSkill(),
        "body-language": makeSkill({ tier: 3 }),
        "petting-technique": makeSkill({ tier: 2 }),
      },
    });
    expect(isConfirmedHintUnlocked(state, "posture")).toBe(true);
    expect(isConfirmedHintUnlocked(state, "petSpot")).toBe(false);
  });
});

describe("isTriedLogUnlocked", () => {
  it("is gated per type on that type's own mapped skill reaching tier 4", () => {
    const state = makeGladeState({
      skills: {
        "treat-cooking": makeSkill(),
        "body-language": makeSkill({ tier: 4 }),
        "petting-technique": makeSkill({ tier: 3 }),
      },
    });
    expect(isTriedLogUnlocked(state, "posture")).toBe(true);
    expect(isTriedLogUnlocked(state, "petSpot")).toBe(false);
  });
});

describe("isSkillUnlocked", () => {
  it("body-language is always unlocked", () => {
    const state = makeGladeState({
      skills: {
        "treat-cooking": makeSkill(),
        "body-language": makeSkill(),
        "petting-technique": makeSkill(),
      },
    });
    expect(isSkillUnlocked(state, "body-language")).toBe(true);
  });

  it("petting-technique is locked until body-language reaches tier 2", () => {
    const locked = makeGladeState({
      skills: {
        "treat-cooking": makeSkill(),
        "body-language": makeSkill(),
        "petting-technique": makeSkill(),
      },
    });
    const unlocked = makeGladeState({
      skills: {
        "treat-cooking": makeSkill(),
        "body-language": makeSkill({ tier: 2 }),
        "petting-technique": makeSkill(),
      },
    });
    expect(isSkillUnlocked(locked, "petting-technique")).toBe(false);
    expect(isSkillUnlocked(unlocked, "petting-technique")).toBe(true);
  });

  it("treat-cooking is locked until petting-technique reaches tier 2", () => {
    const locked = makeGladeState({
      skills: {
        "treat-cooking": makeSkill(),
        "body-language": makeSkill(),
        "petting-technique": makeSkill(),
      },
    });
    const unlocked = makeGladeState({
      skills: {
        "treat-cooking": makeSkill(),
        "body-language": makeSkill(),
        "petting-technique": makeSkill({ tier: 2 }),
      },
    });
    expect(isSkillUnlocked(locked, "treat-cooking")).toBe(false);
    expect(isSkillUnlocked(unlocked, "treat-cooking")).toBe(true);
  });
});
