import { lessonCostFor, MAX_TIER, SPECIES, xpThresholdFor } from "./catalog";
import type { GladeState, SkillId } from "./schema";

/**
 * Grants XP to a skill, clamped at the current tier's threshold (the bar
 * waits full until a lesson is bought). Each muse resident grants +1 bonus
 * XP per action — they stack, so all three muses quadruple XP gains.
 */
export function gainXp(state: GladeState, skillId: SkillId): GladeState {
  const skill = state.skills[skillId];
  const threshold = xpThresholdFor(skill.tier);
  if (threshold === null) return state; // max tier

  const museCount = state.residents.filter(
    (r) => SPECIES[r.speciesId].benefitRole === "muse",
  ).length;
  const xp = Math.min(skill.xp + 1 + museCount, threshold);
  return {
    ...state,
    skills: { ...state.skills, [skillId]: { ...skill, xp } },
  };
}

/** A lesson is buyable when the XP bar is full and the skill isn't maxed. */
export function canBuyLesson(state: GladeState, skillId: SkillId): boolean {
  const skill = state.skills[skillId];
  const threshold = xpThresholdFor(skill.tier);
  return threshold !== null && skill.xp >= threshold;
}

/** Points cost of the next lesson for a skill, or null when maxed. */
export function nextLessonCost(
  state: GladeState,
  skillId: SkillId,
): number | null {
  return lessonCostFor(state.skills[skillId].tier);
}

/**
 * Advances a skill to the next tier and resets its XP. Caller is responsible
 * for spending points first — this module has no knowledge of the points
 * system (same contract as the Bonsai shopModule).
 */
export function buyLesson(state: GladeState, skillId: SkillId): GladeState {
  if (!canBuyLesson(state, skillId)) return state;
  const skill = state.skills[skillId];
  if (skill.tier >= MAX_TIER) return state;
  return {
    ...state,
    skills: {
      ...state.skills,
      [skillId]: { tier: skill.tier + 1, xp: 0 },
    },
  };
}

/**
 * Preference hints sharpen with handling experience: clear hints unlock once
 * Body Language and Petting Technique tiers sum to 6 (e.g. 3 + 3).
 */
export function hasClearHints(state: GladeState): boolean {
  return (
    state.skills["body-language"].tier +
      state.skills["petting-technique"].tier >=
    6
  );
}
