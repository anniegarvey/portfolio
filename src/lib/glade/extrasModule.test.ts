import { describe, expect, it } from "vitest";
import { ALL_SPECIES_IDS, EXTRA_ROUND_COSTS, INVITE_COSTS } from "./catalog";
import {
  buyExtraRound,
  canBuyExtraRound,
  canInviteVisitor,
  extraRoundCost,
  extrasBoughtToday,
  inviteCost,
  inviteVisitor,
} from "./extrasModule";
import type { GladeState } from "./schema";
import { makeGladeState, makeSkill, makeVisitor } from "./testFixtures";

const TODAY = "2026-06-12";
const VISITOR_ID = "00000000-0000-4000-8000-000000000001";
const ALL_DONE = { treat: true, approach: true, pet: true };

/** Unwraps a purchase the test expects to go through. */
function bought(result: GladeState | null): GladeState {
  if (result === null) throw new Error("expected the purchase to go through");
  return result;
}

describe("extrasBoughtToday", () => {
  it("forgets what was bought on an earlier day", () => {
    const state = makeGladeState({
      extrasBought: { date: "2026-06-11", rounds: 2, invites: 1 },
    });
    expect(extrasBoughtToday(state, TODAY)).toEqual({
      date: TODAY,
      rounds: 0,
      invites: 0,
    });
  });
});

describe("another round", () => {
  const done = makeGladeState({
    visitors: [makeVisitor({ actionsToday: ALL_DONE })],
  });

  it("isn't offered while an unlocked action is still spare", () => {
    const state = makeGladeState({
      visitors: [makeVisitor({ actionsToday: { ...ALL_DONE, treat: false } })],
    });
    expect(canBuyExtraRound(state, VISITOR_ID, TODAY)).toBe(false);
    expect(buyExtraRound(state, VISITOR_ID, TODAY)).toBeNull();
  });

  it("doesn't wait on actions the player hasn't unlocked yet", () => {
    const state = makeGladeState({
      skills: {
        "body-language": makeSkill({ tier: 1 }),
        "petting-technique": makeSkill({ tier: 1 }),
        "treat-cooking": makeSkill({ tier: 1 }),
      },
      visitors: [
        makeVisitor({
          actionsToday: { approach: true, pet: false, treat: false },
        }),
      ],
    });
    expect(canBuyExtraRound(state, VISITOR_ID, TODAY)).toBe(true);
  });

  it("lets the visitor take every action again", () => {
    const next = bought(buyExtraRound(done, VISITOR_ID, TODAY));
    expect(next.visitors[0].actionsToday).toEqual({
      treat: false,
      approach: false,
      pet: false,
    });
    expect(next.extrasBought?.rounds).toBe(1);
  });

  it("isn't for a visitor who isn't here", () => {
    expect(canBuyExtraRound(done, "nobody", TODAY)).toBe(false);
  });

  it("climbs in price and sells out for the day", () => {
    expect(extraRoundCost(done, TODAY)).toBe(EXTRA_ROUND_COSTS[0]);
    const once = bought(buyExtraRound(done, VISITOR_ID, TODAY));
    expect(extraRoundCost(once, TODAY)).toBe(EXTRA_ROUND_COSTS[1]);
    const soldOut = {
      ...done,
      extrasBought: {
        date: TODAY,
        rounds: EXTRA_ROUND_COSTS.length,
        invites: 0,
      },
    };
    expect(extraRoundCost(soldOut, TODAY)).toBeNull();
    expect(canBuyExtraRound(soldOut, VISITOR_ID, TODAY)).toBe(false);
  });
});

describe("inviting a visitor", () => {
  it("brings a species not already here, with its banked trust", () => {
    const state = makeGladeState({
      visitors: [makeVisitor({ speciesId: "robin" })],
      speciesTrust: { rabbit: 20 },
    });
    const next = bought(inviteVisitor(state, TODAY, () => 0));
    expect(next.visitors).toHaveLength(2);
    const guest = next.visitors[1];
    expect(guest.speciesId).not.toBe("robin");
    expect(guest.arrivedDate).toBe(TODAY);
    expect(guest.trust).toBe(state.speciesTrust[guest.speciesId] ?? 0);
    expect(next.extrasBought?.invites).toBe(1);
  });

  it("climbs in price and sells out for the day", () => {
    const state = makeGladeState();
    expect(inviteCost(state, TODAY)).toBe(INVITE_COSTS[0]);
    const soldOut = makeGladeState({
      extrasBought: { date: TODAY, rounds: 0, invites: INVITE_COSTS.length },
    });
    expect(inviteCost(soldOut, TODAY)).toBeNull();
    expect(canInviteVisitor(soldOut, TODAY)).toBe(false);
    expect(inviteVisitor(soldOut, TODAY)).toBeNull();
  });

  it("has nobody to invite once every untamed species is here", () => {
    const state = makeGladeState({
      residents: [],
      visitors: ALL_SPECIES_IDS.map((speciesId, i) =>
        makeVisitor({ id: `v-${i}`, speciesId }),
      ),
    });
    expect(canInviteVisitor(state, TODAY)).toBe(false);
    expect(inviteVisitor(state, TODAY)).toBeNull();
  });
});
