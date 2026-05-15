import type { BonsaiGameState } from "./schema";
import { SPECIES_CONFIG } from "./speciesConfig";
import { BRANCH_GROW_DURATION } from "./treeGenerator";

export function pruneBranch(
  state: BonsaiGameState,
  treeId: string,
  branchId: string,
): BonsaiGameState {
  return {
    ...state,
    trees: state.trees.map((t) =>
      t.id === treeId
        ? {
            ...t,
            prunedBranches: [
              ...t.prunedBranches.filter((p) => p.branchId !== branchId),
              { branchId, prunedAtDay: Math.floor(t.activeDaysCount) },
            ],
          }
        : t,
    ),
  };
}

/**
 * Removes pruned-branch entries only once the regrowth animation has finished
 * (regrowthDays to start regrowing + BRANCH_GROW_DURATION to fully regrow).
 * Keeping entries during the animation lets the generator compute staged progress.
 */
export function cleanRegrownBranches(state: BonsaiGameState): BonsaiGameState {
  const trees = state.trees.map((tree) => {
    const regrowthDays = SPECIES_CONFIG[tree.speciesId].regrowthDays;
    const prunedBranches = tree.prunedBranches.filter(
      (p) =>
        tree.activeDaysCount <
        p.prunedAtDay + regrowthDays + BRANCH_GROW_DURATION,
    );
    return prunedBranches.length === tree.prunedBranches.length
      ? tree
      : { ...tree, prunedBranches };
  });
  return { ...state, trees };
}
