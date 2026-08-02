import { vi } from "vitest";
import type { GladeContextType } from "./context";
import type { GladeState, SkillState, WildVisitor } from "./schema";

/** Builds a GladeState with sensible defaults, overridable per test. */
/**
 * Body Language and Petting Technique default to tier 2 so Petting
 * Technique and Treat Cooking start unlocked (see SKILL_UNLOCK_REQUIREMENT)
 * — most tests exercise pet/treat actions incidentally, not the unlock
 * gating itself, so tests specifically covering gating override tiers back
 * down to 1.
 */
export function makeGladeState(overrides?: Partial<GladeState>): GladeState {
  return {
    visitors: [],
    residents: [],
    skills: {
      "treat-cooking": { tier: 1, xp: 0 },
      "body-language": { tier: 2, xp: 0 },
      "petting-technique": { tier: 2, xp: 0 },
    },
    pantry: { ingredients: {}, treats: {} },
    speciesTrust: {},
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

/**
 * A complete useGlade mock value with inert defaults, so component tests
 * override only what they exercise instead of hand-rolling every member.
 */
export function makeGladeContext(
  overrides?: Partial<GladeContextType>,
): GladeContextType {
  return {
    state: makeGladeState(),
    lastAction: null,
    celebration: null,
    clearCelebration: vi.fn(),
    dailyReport: null,
    clearDailyReport: vi.fn(),
    tamedVisitor: null,
    tamedVisitorIndex: null,
    tamedResidentId: null,
    clearTamedVisitor: vi.fn(),
    nameResident: vi.fn(),
    gladeSceneRef: { current: null },
    offerTreat: vi.fn(),
    approachVisitor: vi.fn(),
    petVisitor: vi.fn(),
    cookTreat: vi.fn(),
    buyIngredient: vi.fn().mockReturnValue(false),
    buyMissingIngredients: vi.fn().mockReturnValue(false),
    buyLesson: vi.fn().mockReturnValue(false),
    resetGlade: vi.fn(),
    ...overrides,
  };
}
