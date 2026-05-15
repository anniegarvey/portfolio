import type { BonsaiGameState, BonsaiTree } from "./schema";

export function isTreeWatered(tree: BonsaiTree): boolean {
  if (tree.lastWateredDay === undefined) return false;
  const mk = tree.activeFertilisers?.moistureKeeper;
  const retentionDays =
    mk && tree.activeDaysCount < mk.expiresAtDay ? mk.retentionDays : 0;
  return tree.activeDaysCount - tree.lastWateredDay <= retentionDays;
}

export function cleanExpiredFertilisers(tree: BonsaiTree): BonsaiTree {
  if (!tree.activeFertilisers) return tree;
  const { growthTonic, moistureKeeper } = tree.activeFertilisers;
  const nextGT =
    growthTonic && tree.activeDaysCount < growthTonic.expiresAtDay
      ? growthTonic
      : undefined;
  const nextMK =
    moistureKeeper && tree.activeDaysCount < moistureKeeper.expiresAtDay
      ? moistureKeeper
      : undefined;
  if (nextGT === growthTonic && nextMK === moistureKeeper) return tree;
  const next =
    nextGT || nextMK
      ? { growthTonic: nextGT, moistureKeeper: nextMK }
      : undefined;
  return { ...tree, activeFertilisers: next };
}

export function growWateredTrees(
  state: BonsaiGameState,
  todayStr: string,
): BonsaiGameState {
  return {
    ...state,
    trees: state.trees.map((tree) => {
      if (!isTreeWatered(tree)) return tree;
      const gt = tree.activeFertilisers?.growthTonic;
      const bonus =
        gt && tree.activeDaysCount < gt.expiresAtDay ? gt.bonusPerTick : 0;
      const grown = {
        ...tree,
        activeDaysCount: tree.activeDaysCount + 1 + bonus,
        lastGrownDate: todayStr,
      };
      return cleanExpiredFertilisers(grown);
    }),
    lastGrowthCheckDate: todayStr,
  };
}
