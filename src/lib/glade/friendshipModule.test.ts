import { describe, expect, it } from "vitest";
import {
  friendshipOf,
  greetResident,
  greetsForNextLevel,
  roleStrength,
  rollAmount,
  strengthOf,
  totalFriendshipLevels,
  wasGreetedToday,
} from "./friendshipModule";
import type { Resident, SpeciesId } from "./schema";
import { makeGladeState } from "./testFixtures";

const TODAY = "2026-06-10";

function resident(speciesId: SpeciesId, friendship?: number, i = 1): Resident {
  return {
    id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    speciesId,
    tamedDate: "2026-06-01",
    position: { x: 50, y: 50 },
    friendship,
  };
}

describe("friendship levels", () => {
  it("takes twice as many greets for each level as the one before", () => {
    expect([0, 1, 2, 3, 4].map(greetsForNextLevel)).toEqual([2, 4, 8, 16, 32]);
  });

  it("starts a resident tamed before friendship existed at level 0", () => {
    expect(friendshipOf(resident("robin"))).toEqual({
      level: 0,
      progress: 0,
      needed: 2,
    });
  });

  it("counts greets towards the next level", () => {
    expect(friendshipOf(resident("robin", 1))).toEqual({
      level: 0,
      progress: 1,
      needed: 2,
    });
    expect(friendshipOf(resident("robin", 2))).toEqual({
      level: 1,
      progress: 0,
      needed: 4,
    });
    expect(friendshipOf(resident("robin", 13))).toEqual({
      level: 2,
      progress: 7,
      needed: 8,
    });
    expect(friendshipOf(resident("robin", 30)).level).toBe(4);
  });
});

describe("how friendship strengthens a role", () => {
  it("adds a tenth of the role's effect per level", () => {
    expect(strengthOf(resident("robin"))).toBe(1);
    expect(strengthOf(resident("robin", 6))).toBeCloseTo(1.2);
  });

  it("adds up every resident with the role, each by its strength", () => {
    const state = makeGladeState({
      residents: [
        resident("hedgehog", 2, 1), // soother, level 1
        resident("deer", 0, 2), // soother, level 0
        resident("rabbit", 30, 3), // forager — must not count
      ],
    });
    expect(roleStrength(state, "soother")).toBeCloseTo(2.1);
    expect(roleStrength(state, "beacon")).toBe(0);
  });

  it("rolls the fraction of an amount as a chance of one more", () => {
    expect(rollAmount(2, () => 0)).toBe(2);
    expect(rollAmount(1.3, () => 0.29)).toBe(2);
    expect(rollAmount(1.3, () => 0.31)).toBe(1);
  });

  it("never rolls for a whole amount", () => {
    let rolls = 0;
    rollAmount(1, () => {
      rolls += 1;
      return 0;
    });
    expect(rolls).toBe(0);
  });
});

describe("greeting a resident", () => {
  it("counts the first greet of the day", () => {
    const robin = resident("robin");
    const result = greetResident(
      makeGladeState({ residents: [robin] }),
      robin.id,
      TODAY,
    );
    expect(result.counted).toBe(true);
    expect(result.levelUp).toBeNull();
    expect(result.state.residents[0].friendship).toBe(1);
    expect(wasGreetedToday(result.state.residents[0], TODAY)).toBe(true);
  });

  it("ignores more greets the same day", () => {
    const robin = { ...resident("robin", 1), lastGreetedDate: TODAY };
    const state = makeGladeState({ residents: [robin] });
    const result = greetResident(state, robin.id, TODAY);
    expect(result).toEqual({ state, counted: false, levelUp: null });
  });

  it("counts again the next day, and says when a level is reached", () => {
    const robin = { ...resident("robin", 1), lastGreetedDate: "2026-06-09" };
    const result = greetResident(
      makeGladeState({ residents: [robin] }),
      robin.id,
      TODAY,
    );
    expect(result.counted).toBe(true);
    expect(result.levelUp).toBe(1);
  });

  it("only changes the resident greeted", () => {
    const robin = resident("robin", 0, 1);
    const fox = resident("fox", 5, 2);
    const result = greetResident(
      makeGladeState({ residents: [robin, fox] }),
      robin.id,
      TODAY,
    );
    expect(result.state.residents[1]).toBe(fox);
  });

  it("does nothing for a resident who isn't there", () => {
    const state = makeGladeState();
    expect(greetResident(state, "missing", TODAY).counted).toBe(false);
  });
});

describe("totalFriendshipLevels", () => {
  it("adds up every resident's level", () => {
    const state = makeGladeState({
      residents: [resident("robin", 2, 1), resident("fox", 14, 2)],
    });
    expect(totalFriendshipLevels(state)).toBe(4);
  });
});
