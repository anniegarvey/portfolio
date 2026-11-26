import { v4 as uuidv4 } from "uuid";
import { EXTRA_ROUND_COSTS, INVITE_COSTS } from "./catalog";
import { pickExtraVisitor } from "./gladeEngine";
import type {
  GladeExtrasBought,
  GladeState,
  SkillId,
  WildVisitor,
} from "./schema";
import { isSkillUnlocked } from "./skillsModule";

/**
 * Extras: speedups bought with points — another round of taming actions with
 * a visitor, or an invitation for one more visitor today. Each function here
 * is pure and leaves paying to the caller, which spends the points only when
 * the purchase is allowed (ADR 0009).
 */

/** The skill that unlocks each taming action. */
const ACTION_SKILL: Record<keyof WildVisitor["actionsToday"], SkillId> = {
  approach: "body-language",
  pet: "petting-technique",
  treat: "treat-cooking",
};

/** What has been bought today; nothing, if the record is from another day. */
export function extrasBoughtToday(
  state: GladeState,
  today: string,
): GladeExtrasBought {
  const bought = state.extrasBought;
  return bought?.date === today
    ? bought
    : { date: today, rounds: 0, invites: 0 };
}

/** The price of the day's next round, or null once the day's run is spent. */
export function extraRoundCost(
  state: GladeState,
  today: string,
): number | null {
  return EXTRA_ROUND_COSTS[extrasBoughtToday(state, today).rounds] ?? null;
}

/**
 * Offered once a visitor has had every action the player can do so far, so a
 * round is never bought with actions still spare.
 */
export function canBuyExtraRound(
  state: GladeState,
  visitorId: string,
  today: string,
): boolean {
  const visitor = state.visitors.find((v) => v.id === visitorId);
  if (visitor === undefined || extraRoundCost(state, today) === null) {
    return false;
  }
  return (
    Object.keys(ACTION_SKILL) as (keyof WildVisitor["actionsToday"])[]
  ).every(
    (action) =>
      visitor.actionsToday[action] ||
      !isSkillUnlocked(state, ACTION_SKILL[action]),
  );
}

/** Lets a visitor accept all three taming actions again today. */
export function buyExtraRound(
  state: GladeState,
  visitorId: string,
  today: string,
): GladeState | null {
  if (!canBuyExtraRound(state, visitorId, today)) return null;
  const bought = extrasBoughtToday(state, today);
  return {
    ...state,
    visitors: state.visitors.map((v) =>
      v.id === visitorId
        ? { ...v, actionsToday: { treat: false, approach: false, pet: false } }
        : v,
    ),
    extrasBought: { ...bought, rounds: bought.rounds + 1 },
  };
}

/** The price of the day's next invitation, or null once the day's run is spent. */
export function inviteCost(state: GladeState, today: string): number | null {
  return INVITE_COSTS[extrasBoughtToday(state, today).invites] ?? null;
}

/**
 * Brings one more wild visitor for today, arriving with its species' banked
 * trust. Null when sold out, or when every untamed species is already here.
 */
export function inviteVisitor(
  state: GladeState,
  today: string,
  rng: () => number = Math.random,
): GladeState | null {
  if (inviteCost(state, today) === null) return null;
  const speciesId = pickExtraVisitor(state, rng);
  if (speciesId === null) return null;
  const bought = extrasBoughtToday(state, today);
  return {
    ...state,
    visitors: [
      ...state.visitors,
      {
        id: uuidv4(),
        speciesId,
        trust: state.speciesTrust[speciesId] ?? 0,
        arrivedDate: today,
        actionsToday: { treat: false, approach: false, pet: false },
      },
    ],
    extrasBought: { ...bought, invites: bought.invites + 1 },
  };
}

/** True when there is anyone left to invite and invitations aren't sold out. */
export function canInviteVisitor(state: GladeState, today: string): boolean {
  return (
    inviteCost(state, today) !== null &&
    pickExtraVisitor(state, () => 0) !== null
  );
}
