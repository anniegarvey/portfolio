import { describe, expect, it } from "vitest";
import {
  ALL_CROP_IDS,
  ALL_KEEPSAKE_IDS,
  ALL_QUEST_IDS,
  ALL_SITE_IDS,
  CROPS,
  MAX_PLOTS,
  QUESTS,
  SITES,
  STARTING_PLOTS,
} from "./catalog";
import {
  claimQuest,
  earnedKeepsakes,
  isQuestUnlocked,
  meetsRequirement,
  questProgress,
  questStatus,
  siteUnlockGiver,
  visibleQuests,
} from "./questsModule";
import { makeEmptyPlots } from "./storage";
import { makeMeadowmereState } from "./testFixtures";

describe("siteUnlockGiver", () => {
  it("names the neighbour whose quest opens each shut site", () => {
    expect(siteUnlockGiver("riverbank")).toBe("bram");
    expect(siteUnlockGiver("stonewood")).toBe("marigold");
  });

  it("has nobody to name for the site that is open from the start", () => {
    expect(siteUnlockGiver("hedgerow")).toBeNull();
  });

  it("agrees with the reward table it is derived from", () => {
    // The pairing is read off the rewards rather than restated, so a quest that
    // changes hands cannot leave the map pointing at the wrong door.
    for (const quest of ALL_QUEST_IDS.map((id) => QUESTS[id])) {
      const site = quest.reward.unlockSiteId;
      if (site !== undefined) expect(siteUnlockGiver(site)).toBe(quest.giverId);
    }
  });
});

describe("isQuestUnlocked", () => {
  it("unlocks a quest with no prerequisites", () => {
    const state = makeMeadowmereState();
    expect(isQuestUnlocked(state, QUESTS["a-bed-for-parsnips"])).toBe(true);
  });

  it("keeps a quest locked until its prerequisite is done", () => {
    const state = makeMeadowmereState();
    expect(isQuestUnlocked(state, QUESTS["down-to-the-riverbank"])).toBe(false);
  });

  it("unlocks once the prerequisite is complete", () => {
    const state = makeMeadowmereState({
      completedQuestIds: ["a-bed-for-parsnips"],
    });
    expect(isQuestUnlocked(state, QUESTS["down-to-the-riverbank"])).toBe(true);
  });
});

describe("meetsRequirement", () => {
  it("is met when the larder holds enough", () => {
    const state = makeMeadowmereState({ inventory: { "parsnip-root": 3 } });
    expect(meetsRequirement(state, QUESTS["a-bed-for-parsnips"])).toBe(true);
  });

  it("is unmet when the larder is short", () => {
    const state = makeMeadowmereState({ inventory: { "parsnip-root": 2 } });
    expect(meetsRequirement(state, QUESTS["a-bed-for-parsnips"])).toBe(false);
  });

  it("checks friendship requirements", () => {
    const met = makeMeadowmereState({
      neighbours: { marigold: { friendship: 45 } },
    });
    const short = makeMeadowmereState({
      neighbours: { marigold: { friendship: 44 } },
    });
    expect(meetsRequirement(met, QUESTS["sweet-on-you"])).toBe(true);
    expect(meetsRequirement(short, QUESTS["sweet-on-you"])).toBe(false);
  });
});

describe("questStatus", () => {
  it("reports locked, active, ready and completed in turn", () => {
    expect(questStatus(makeMeadowmereState(), "down-to-the-riverbank")).toBe(
      "locked",
    );
    expect(questStatus(makeMeadowmereState(), "a-bed-for-parsnips")).toBe(
      "active",
    );

    const ready = makeMeadowmereState({ inventory: { "parsnip-root": 3 } });
    expect(questStatus(ready, "a-bed-for-parsnips")).toBe("ready");

    const done = makeMeadowmereState({
      completedQuestIds: ["a-bed-for-parsnips"],
    });
    expect(questStatus(done, "a-bed-for-parsnips")).toBe("completed");
  });
});

describe("visibleQuests", () => {
  it("shows only the opening quest on a fresh farm", () => {
    expect(visibleQuests(makeMeadowmereState()).map((q) => q.id)).toEqual([
      "a-bed-for-parsnips",
    ]);
  });

  it("keeps completed quests visible alongside newly unlocked ones", () => {
    const state = makeMeadowmereState({
      completedQuestIds: ["a-bed-for-parsnips"],
    });
    expect(visibleQuests(state).map((q) => q.id)).toEqual([
      "a-bed-for-parsnips",
      "down-to-the-riverbank",
      "a-new-face-at-the-mill",
    ]);
  });
});

describe("questProgress", () => {
  it("reports a checklist line per required item", () => {
    const state = makeMeadowmereState({ inventory: { "parsnip-root": 1 } });
    expect(questProgress(state, QUESTS["a-bed-for-parsnips"])).toEqual([
      {
        key: "parsnip-root",
        label: "Parsnip",
        glyph: "🥕",
        have: 1,
        need: 3,
        met: false,
      },
    ]);
  });

  it("reports a line per friendship requirement", () => {
    const state = makeMeadowmereState({
      neighbours: { marigold: { friendship: 50 } },
    });
    const lines = questProgress(state, QUESTS["sweet-on-you"]);

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      key: "friendship-marigold",
      label: "Friendship with Marigold",
      have: 50,
      need: 45,
      met: true,
    });
  });
});

describe("claimQuest", () => {
  it("consumes the required items and records completion", () => {
    const state = makeMeadowmereState({ inventory: { "parsnip-root": 5 } });
    const next = claimQuest(state, "a-bed-for-parsnips");

    expect(next?.inventory["parsnip-root"]).toBe(2);
    expect(next?.completedQuestIds).toEqual(["a-bed-for-parsnips"]);
  });

  it("pays out seeds, a crop unlock and friendship", () => {
    const state = makeMeadowmereState({ inventory: { "parsnip-root": 3 } });
    const next = claimQuest(state, "a-bed-for-parsnips");

    expect(next?.seeds.cornflower).toBe(3);
    expect(next?.unlockedCropIds).toContain("cornflower");
    expect(next?.neighbours.nessa?.friendship).toBe(10);
  });

  it("unlocks a wild site", () => {
    const state = makeMeadowmereState({
      completedQuestIds: ["a-bed-for-parsnips"],
      inventory: { acorn: 2, "bramble-berry": 2 },
    });
    const next = claimQuest(state, "down-to-the-riverbank");
    expect(next?.unlockedSiteIds).toContain("riverbank");
  });

  it("adds plots", () => {
    const state = makeMeadowmereState({
      plots: makeEmptyPlots(6),
      completedQuestIds: ["a-bed-for-parsnips", "down-to-the-riverbank"],
      inventory: { "river-clay": 4, reed: 2 },
    });
    expect(claimQuest(state, "clay-for-the-kiln")?.plots).toHaveLength(9);
  });

  it("never takes the farm past MAX_PLOTS", () => {
    const state = makeMeadowmereState({
      plots: makeEmptyPlots(MAX_PLOTS - 1),
      completedQuestIds: ["a-bed-for-parsnips", "down-to-the-riverbank"],
      inventory: { "river-clay": 4, reed: 2 },
    });
    expect(claimQuest(state, "clay-for-the-kiln")?.plots).toHaveLength(
      MAX_PLOTS,
    );
  });

  it("leaves friendship requirements alone rather than spending them", () => {
    const state = makeMeadowmereState({
      completedQuestIds: [
        "a-bed-for-parsnips",
        "down-to-the-riverbank",
        "clay-for-the-kiln",
      ],
      neighbours: { marigold: { friendship: 50 } },
    });
    const next = claimQuest(state, "sweet-on-you");

    expect(next?.neighbours.marigold?.friendship).toBe(50);
    expect(next?.unlockedSiteIds).toContain("stonewood");
    expect(next?.unlockedCropIds).toContain("strawberry");
  });

  it("returns null when the quest is not ready", () => {
    expect(claimQuest(makeMeadowmereState(), "a-bed-for-parsnips")).toBeNull();
  });

  it("returns null when the quest is already completed", () => {
    const state = makeMeadowmereState({
      completedQuestIds: ["a-bed-for-parsnips"],
      inventory: { "parsnip-root": 3 },
    });
    expect(claimQuest(state, "a-bed-for-parsnips")).toBeNull();
  });

  it("does not re-add an unlock the player already has", () => {
    const state = makeMeadowmereState({
      inventory: { "parsnip-root": 3 },
      unlockedCropIds: ["parsnip", "cornflower"],
    });
    const next = claimQuest(state, "a-bed-for-parsnips");
    expect(next?.unlockedCropIds).toEqual(["parsnip", "cornflower"]);
  });
});

describe("earnedKeepsakes", () => {
  it("is empty on a fresh farm", () => {
    expect(earnedKeepsakes(makeMeadowmereState())).toEqual([]);
  });

  it("lists the keepsake of each completed quest that gives one", () => {
    const state = makeMeadowmereState({
      completedQuestIds: [
        "a-bed-for-parsnips",
        "a-scarecrow-for-the-field",
        "honey-for-the-hives",
      ],
    });
    expect(earnedKeepsakes(state)).toEqual(["scarecrow", "beehive"]);
  });

  it("is handed over by claiming the quest", () => {
    const state = makeMeadowmereState({
      completedQuestIds: ["a-bed-for-parsnips", "down-to-the-riverbank"],
      inventory: { feather: 3, reed: 2 },
    });
    const next = claimQuest(state, "a-scarecrow-for-the-field");
    if (next === null) throw new Error("not claimed");
    expect(earnedKeepsakes(next)).toEqual(["scarecrow"]);
  });
});

/**
 * The chain as a whole. With thirty quests it is easy to write one that asks
 * for something the player can't have yet, or that nothing ever unlocks, and
 * neither shows up until someone plays that far.
 */
describe("the quest chain", () => {
  const byId = (id: (typeof ALL_QUEST_IDS)[number]) => QUESTS[id];

  /** A quest and everything that has to be done before it can appear. */
  function prerequisitesOf(
    id: (typeof ALL_QUEST_IDS)[number],
    seen = new Set<string>(),
  ): Set<string> {
    for (const before of byId(id).unlock.afterQuestIds ?? []) {
      if (seen.has(before)) continue;
      seen.add(before);
      prerequisitesOf(before, seen);
    }
    return seen;
  }

  it("only names quests that exist as prerequisites", () => {
    for (const quest of ALL_QUEST_IDS.map(byId)) {
      for (const before of quest.unlock.afterQuestIds ?? []) {
        expect(ALL_QUEST_IDS, `${quest.id} waits on ${before}`).toContain(
          before,
        );
      }
    }
  });

  it("has no quest waiting on itself, however indirectly", () => {
    for (const id of ALL_QUEST_IDS) {
      expect(prerequisitesOf(id).has(id), id).toBe(false);
    }
  });

  it("only asks for items the player can get by the time it appears", () => {
    for (const quest of ALL_QUEST_IDS.map(byId)) {
      const done = [...prerequisitesOf(quest.id)].map((id) =>
        byId(id as (typeof ALL_QUEST_IDS)[number]),
      );
      const crops = new Set([
        "parsnip",
        ...done.flatMap((q) => q.reward.unlockCropId ?? []),
      ]);
      const sites = new Set([
        "hedgerow",
        ...done.flatMap((q) => q.reward.unlockSiteId ?? []),
      ]);
      const reachable = new Set([
        ...ALL_CROP_IDS.filter((id) => crops.has(id)).map(
          (id) => CROPS[id].produceId,
        ),
        ...ALL_SITE_IDS.filter((id) => sites.has(id)).flatMap(
          (id) => SITES[id].materials,
        ),
      ]);
      for (const itemId of Object.keys(quest.requirement.items ?? {})) {
        expect(
          reachable.has(itemId as never),
          `${quest.id} asks for ${itemId} before it can be had`,
        ).toBe(true);
      }
    }
  });

  it("unlocks every crop and every site somewhere along the way", () => {
    const crops = ALL_QUEST_IDS.flatMap(
      (id) => QUESTS[id].reward.unlockCropId ?? [],
    );
    const sites = ALL_QUEST_IDS.flatMap(
      (id) => QUESTS[id].reward.unlockSiteId ?? [],
    );
    expect(new Set(["parsnip", ...crops])).toEqual(new Set(ALL_CROP_IDS));
    expect(new Set(["hedgerow", ...sites])).toEqual(new Set(ALL_SITE_IDS));
  });

  it("gives each keepsake exactly once", () => {
    const given = ALL_QUEST_IDS.flatMap(
      (id) => QUESTS[id].reward.keepsakeId ?? [],
    );
    expect([...given].sort()).toEqual([...ALL_KEEPSAKE_IDS].sort());
  });

  it("hands over exactly enough land to fill the farm", () => {
    const extra = ALL_QUEST_IDS.reduce(
      (sum, id) => sum + (QUESTS[id].reward.extraPlots ?? 0),
      0,
    );
    expect(STARTING_PLOTS + extra).toBe(MAX_PLOTS);
  });

  it("never pays out seed the player hasn't been allowed to sow", () => {
    for (const quest of ALL_QUEST_IDS.map(byId)) {
      const done = [quest.id, ...prerequisitesOf(quest.id)].map((id) =>
        byId(id as (typeof ALL_QUEST_IDS)[number]),
      );
      const crops = new Set([
        "parsnip",
        ...done.flatMap((q) => q.reward.unlockCropId ?? []),
      ]);
      for (const cropId of Object.keys(quest.reward.seeds ?? {})) {
        expect(crops.has(cropId), `${quest.id} gives ${cropId} seed`).toBe(
          true,
        );
      }
    }
  });
});
