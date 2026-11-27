import { describe, expect, it } from "vitest";
import { RESTART_MIN_RESIDENTS } from "./catalog";
import {
  canRestart,
  residentsUntilRestart,
  restartBonusPercent,
  restartedState,
} from "./restartModule";
import type { Resident, SpeciesId } from "./schema";
import { makeGladeState, makeSkill } from "./testFixtures";

function resident(speciesId: SpeciesId, i: number): Resident {
  return {
    id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    speciesId,
    tamedDate: "2026-06-01",
    position: { x: 50, y: 50 },
  };
}

const COMMONS: SpeciesId[] = [
  "robin",
  "rabbit",
  "squirrel",
  "hedgehog",
  "mouse",
  "wren",
  "mole",
];
const UNCOMMONS: SpeciesId[] = [
  "fox",
  "deer",
  "owl",
  "badger",
  "mosskit",
  "otter",
  "hare",
  "thistledown",
];

describe("friendship in the restart bonus", () => {
  it("adds a percent for every friendship level", () => {
    const plain = makeGladeState({ residents: [resident("robin", 1)] });
    const friends = makeGladeState({
      residents: [{ ...resident("robin", 1), friendship: 14 }], // level 3
    });
    expect(restartBonusPercent(friends)).toBe(restartBonusPercent(plain) + 3);
  });

  it("starts friendship over with the residents", () => {
    const state = makeGladeState({
      residents: [{ ...resident("robin", 1), friendship: 14 }],
    });
    expect(restartedState(state, makeGladeState()).residents).toEqual([]);
  });
});

describe("when a restart is offered", () => {
  it("waits for half the species to settle", () => {
    const short = makeGladeState({
      residents: COMMONS.map(resident).slice(0, RESTART_MIN_RESIDENTS - 4),
    });
    expect(canRestart(short)).toBe(false);
    expect(residentsUntilRestart(short)).toBe(4);

    const enough = makeGladeState({
      residents: [...COMMONS, ...UNCOMMONS]
        .slice(0, RESTART_MIN_RESIDENTS)
        .map(resident),
    });
    expect(canRestart(enough)).toBe(true);
    expect(residentsUntilRestart(enough)).toBe(0);
  });
});

describe("restartBonusPercent", () => {
  it("weighs each resident by rarity", () => {
    const state = makeGladeState({
      residents: [
        resident("robin", 1),
        resident("fox", 2),
        resident("puffloaf", 3),
        resident("emberveil", 4),
        resident("fernmother", 5),
      ],
    });
    expect(restartBonusPercent(state)).toBe(3 + 5 + 10 + 15 + 25);
  });
});

describe("restartedState", () => {
  it("starts the glade afresh but keeps every preference found", () => {
    const fresh = makeGladeState();
    const played = makeGladeState({
      residents: COMMONS.map(resident),
      skills: {
        "body-language": makeSkill({ tier: 5 }),
        "petting-technique": makeSkill({ tier: 5 }),
        "treat-cooking": makeSkill({ tier: 5 }),
      },
      speciesTrust: { fox: 100 },
      discoveredPreferences: { robin: { treat: true } },
      triedPreferences: { robin: { treat: ["berry-bites"] } },
    });

    const next = restartedState(played, fresh);
    expect(next.residents).toEqual([]);
    expect(next.skills).toEqual(fresh.skills);
    expect(next.speciesTrust).toEqual({});
    expect(next.discoveredPreferences).toEqual({ robin: { treat: true } });
    expect(next.triedPreferences).toEqual({
      robin: { treat: ["berry-bites"] },
    });
  });
});
