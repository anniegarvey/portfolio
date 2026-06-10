import type { GladeState, SkillState, WildVisitor } from "./schema";

/** Builds a GladeState with sensible defaults, overridable per test. */
export function makeGladeState(overrides?: Partial<GladeState>): GladeState {
  return {
    visitors: [],
    residents: [],
    skills: {
      "treat-cooking": { tier: 1, xp: 0 },
      "body-language": { tier: 1, xp: 0 },
      "petting-technique": { tier: 1, xp: 0 },
    },
    pantry: { ingredients: {}, treats: {} },
    ...overrides,
  };
}

export function makeVisitor(overrides?: Partial<WildVisitor>): WildVisitor {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    speciesId: "robin",
    trust: 0,
    arrivedDate: "2026-06-10",
    actionsToday: { treat: false, approach: false, pet: false },
    ...overrides,
  };
}

export function makeSkill(overrides?: Partial<SkillState>): SkillState {
  return { tier: 1, xp: 0, ...overrides };
}
