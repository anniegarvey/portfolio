import { describe, expect, it } from "vitest";
import {
  ALL_QUEST_IDS,
  RESTART_BONUS_PER_QUEST,
  RESTART_MIN_QUESTS,
} from "./catalog";
import {
  canRestart,
  questsUntilRestart,
  restartBonusPercent,
  restartedState,
} from "./restartModule";
import { makeMeadowmereState } from "./testFixtures";

const done = (n: number) =>
  makeMeadowmereState({ completedQuestIds: ALL_QUEST_IDS.slice(0, n) });

describe("when a restart is offered", () => {
  it("waits for half the quest chain", () => {
    expect(canRestart(done(RESTART_MIN_QUESTS - 1))).toBe(false);
    expect(questsUntilRestart(done(RESTART_MIN_QUESTS - 1))).toBe(1);
    expect(canRestart(done(RESTART_MIN_QUESTS))).toBe(true);
    expect(questsUntilRestart(done(RESTART_MIN_QUESTS))).toBe(0);
  });
});

describe("restartBonusPercent", () => {
  it("grows with every quest completed", () => {
    expect(restartBonusPercent(done(0))).toBe(0);
    expect(restartBonusPercent(done(ALL_QUEST_IDS.length))).toBe(
      ALL_QUEST_IDS.length * RESTART_BONUS_PER_QUEST,
    );
  });
});

describe("restartedState", () => {
  it("starts the farm afresh but keeps what each neighbour has been given", () => {
    const fresh = makeMeadowmereState({ seeds: { parsnip: 6 } });
    const played = makeMeadowmereState({
      completedQuestIds: ALL_QUEST_IDS.slice(0, 20),
      inventory: { "parsnip-root": 9 },
      neighbours: {
        nessa: {
          friendship: 80,
          lastGiftDate: "2026-06-10",
          giftedItemIds: ["parsnip-root"],
        },
        bram: { friendship: 40 },
      },
    });

    const next = restartedState(played, fresh);
    expect(next.completedQuestIds).toEqual([]);
    expect(next.inventory).toEqual({});
    expect(next.seeds).toEqual({ parsnip: 6 });
    expect(next.neighbours.nessa).toEqual({
      friendship: 0,
      giftedItemIds: ["parsnip-root"],
    });
    expect(next.neighbours.bram).toEqual({ friendship: 0 });
  });
});
