import {
  ALL_QUEST_IDS,
  type FriendshipCondition,
  ITEMS,
  MAX_PLOTS,
  NEIGHBOURS,
  QUESTS,
  type QuestConfig,
} from "./catalog";
import { addItems, addSeeds, hasItems, itemCount } from "./inventory";
import { addFriendship, friendshipOf } from "./neighboursModule";
import type { ItemId, MeadowmereState, QuestId } from "./schema";
import { makeEmptyPlots } from "./storage";

/**
 * Where a quest sits for the player. Derived from state on every read — the
 * only thing stored is `completedQuestIds`, so progress can never desync from
 * the larder it's counted against.
 */
export type QuestStatus = "locked" | "active" | "ready" | "completed";

function meetsFriendship(
  state: MeadowmereState,
  conditions: readonly FriendshipCondition[] | undefined,
): boolean {
  return (conditions ?? []).every(
    ({ neighbourId, level }) => friendshipOf(state, neighbourId) >= level,
  );
}

/** True when the quest's prerequisites are done and it should show on the board. */
export function isQuestUnlocked(
  state: MeadowmereState,
  quest: QuestConfig,
): boolean {
  const afterDone = (quest.unlock.afterQuestIds ?? []).every((id) =>
    state.completedQuestIds.includes(id),
  );
  return afterDone && meetsFriendship(state, quest.unlock.friendship);
}

/** True when everything the quest asks for is in hand right now. */
export function meetsRequirement(
  state: MeadowmereState,
  quest: QuestConfig,
): boolean {
  const items = quest.requirement.items ?? {};
  return (
    hasItems(state, items) &&
    meetsFriendship(state, quest.requirement.friendship)
  );
}

export function questStatus(
  state: MeadowmereState,
  questId: QuestId,
): QuestStatus {
  if (state.completedQuestIds.includes(questId)) return "completed";
  const quest = QUESTS[questId];
  if (!isQuestUnlocked(state, quest)) return "locked";
  return meetsRequirement(state, quest) ? "ready" : "active";
}

/** Quests the player can see: everything unlocked, in catalog order. */
export function visibleQuests(state: MeadowmereState): QuestConfig[] {
  return ALL_QUEST_IDS.map((id) => QUESTS[id]).filter(
    (quest) =>
      state.completedQuestIds.includes(quest.id) ||
      isQuestUnlocked(state, quest),
  );
}

/** One line of a quest's checklist, ready to render. */
export interface QuestProgressLine {
  key: string;
  label: string;
  glyph: string;
  have: number;
  need: number;
  met: boolean;
}

export function questProgress(
  state: MeadowmereState,
  quest: QuestConfig,
): QuestProgressLine[] {
  const itemLines = Object.entries(quest.requirement.items ?? {}).map(
    ([itemId, need]) => {
      const item = ITEMS[itemId as ItemId];
      const have = itemCount(state, itemId as ItemId);
      return {
        key: itemId,
        label: item.name,
        glyph: item.glyph,
        have,
        need,
        met: have >= need,
      };
    },
  );

  const friendshipLines = (quest.requirement.friendship ?? []).map(
    ({ neighbourId, level }) => {
      const have = friendshipOf(state, neighbourId);
      return {
        key: `friendship-${neighbourId}`,
        label: `Friendship with ${NEIGHBOURS[neighbourId].name}`,
        glyph: NEIGHBOURS[neighbourId].glyph,
        have,
        need: level,
        met: have >= level,
      };
    },
  );

  return [...itemLines, ...friendshipLines];
}

/**
 * Hands in a ready quest: consumes the items it asked for and applies its
 * reward. Rewards are seeds, items, land and goodwill — never points, so the
 * Energy Planner stays the only place points are minted (ADR 0003, ADR 0005).
 * Returns null when the quest isn't ready.
 */
export function claimQuest(
  state: MeadowmereState,
  questId: QuestId,
): MeadowmereState | null {
  if (questStatus(state, questId) !== "ready") return null;
  const quest = QUESTS[questId];
  const { reward } = quest;

  // Friendship requirements are a standing relationship, not a cost — only
  // the item half of the requirement is consumed.
  let next: MeadowmereState = {
    ...state,
    completedQuestIds: [...state.completedQuestIds, questId],
  };
  for (const [itemId, needed] of Object.entries(
    quest.requirement.items ?? {},
  )) {
    const id = itemId as ItemId;
    next = {
      ...next,
      inventory: {
        ...next.inventory,
        [id]: Math.max(0, itemCount(next, id) - needed),
      },
    };
  }

  if (reward.items) next = addItems(next, reward.items);
  if (reward.seeds) next = addSeeds(next, reward.seeds);
  if (
    reward.unlockCropId &&
    !next.unlockedCropIds.includes(reward.unlockCropId)
  )
    next = {
      ...next,
      unlockedCropIds: [...next.unlockedCropIds, reward.unlockCropId],
    };
  if (
    reward.unlockSiteId &&
    !next.unlockedSiteIds.includes(reward.unlockSiteId)
  )
    next = {
      ...next,
      unlockedSiteIds: [...next.unlockedSiteIds, reward.unlockSiteId],
    };
  if (reward.extraPlots) {
    const room = Math.max(0, MAX_PLOTS - next.plots.length);
    next = {
      ...next,
      plots: [
        ...next.plots,
        ...makeEmptyPlots(Math.min(reward.extraPlots, room)),
      ],
    };
  }
  if (reward.friendship)
    next = addFriendship(next, quest.giverId, reward.friendship);

  return next;
}
