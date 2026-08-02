import {
  lessonCostFor,
  MAX_TIER,
  PREFERENCE_SKILL,
  SKILL_UNLOCK_REQUIREMENT,
  SPECIES,
  xpThresholdFor,
} from "./catalog";
import type { GladeState, PreferenceKind, SkillId } from "./schema";

/** A skill is unlocked once its prerequisite (if any) reaches the required tier. */
export function isSkillUnlocked(state: GladeState, skillId: SkillId): boolean {
  const requirement = SKILL_UNLOCK_REQUIREMENT[skillId];
  if (requirement === null) return true;
  return state.skills[requirement.skillId].tier >= requirement.tier;
}

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

/** A lesson is buyable when the skill is unlocked, its XP bar is full, and it isn't maxed. */
export function canBuyLesson(state: GladeState, skillId: SkillId): boolean {
  if (!isSkillUnlocked(state, skillId)) return false;
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

/** Whether a preference type's mapped skill (see `PREFERENCE_SKILL`) has reached the given tier. */
function preferenceSkillAtTier(
  state: GladeState,
  kind: PreferenceKind,
  tier: number,
): boolean {
  return state.skills[PREFERENCE_SKILL[kind]].tier >= tier;
}

/**
 * A preference type's vague hint becomes visible once its mapped skill
 * reaches tier 2 — its first completed level — independent of whether that
 * preference has actually been discovered yet.
 */
export function isVagueHintUnlocked(
  state: GladeState,
  kind: PreferenceKind,
): boolean {
  return preferenceSkillAtTier(state, kind, 2);
}

/**
 * The shared preference toggletip appears once any one of the three taming
 * skills reaches tier 3, whichever gets there first for a given playthrough.
 */
export function isToggletipVisible(state: GladeState): boolean {
  return (Object.keys(PREFERENCE_SKILL) as PreferenceKind[]).some((kind) =>
    preferenceSkillAtTier(state, kind, 3),
  );
}

/**
 * A preference type's toggletip section reveals its confirmed hint (once
 * discovered) once that type's own mapped skill reaches tier 3.
 */
export function isConfirmedHintUnlocked(
  state: GladeState,
  kind: PreferenceKind,
): boolean {
  return preferenceSkillAtTier(state, kind, 3);
}

/**
 * A preference type's toggletip section upgrades to a full log of every
 * option tried so far once that type's own mapped skill reaches tier 4 — an
 * elimination aid for narrowing down a preference not yet discovered.
 */
export function isTriedLogUnlocked(
  state: GladeState,
  kind: PreferenceKind,
): boolean {
  return preferenceSkillAtTier(state, kind, 4);
}
