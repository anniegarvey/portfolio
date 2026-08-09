import type { BonsaiGameState } from "./schema";
import { getGrowthLabel } from "./schema";

/**
 * One tree's growth from a single daily advance: how much it gained, and the
 * stage it reached if the gain carried it into a new one.
 */
export interface GrowthEvent {
  treeId: string;
  daysGained: number;
  /** The new growth-stage label, or null when the tree stayed in its stage. */
  newStage: string | null;
}

/** How long a growth flourish plays before the event is dropped. */
export const GROWTH_CELEBRATION_MS = 2400;

/**
 * The trees that gained days between two states.
 *
 * Stage changes are detected by comparing labels rather than by testing the
 * new day count against a threshold: a growth tonic can add several days at
 * once and land past a boundary without ever equalling it.
 */
function days(count: number): string {
  return `${count} ${count === 1 ? "day" : "days"}`;
}

/**
 * The growth as a sentence for the page's live region. One announcement for
 * the whole garden, rather than one per tree: five trees growing overnight is
 * one piece of news, and five is enough to talk over.
 */
export function describeGrowth(
  events: GrowthEvent[],
  nameOf: (treeId: string) => string,
): string {
  if (events.length === 0) return "";

  const milestones = events
    .filter((event) => event.newStage !== null)
    .map((event) => `${nameOf(event.treeId)} is now a ${event.newStage}.`);

  if (events.length === 1) {
    const [only] = events;
    const grew = `${nameOf(only.treeId)} grew ${days(only.daysGained)}.`;
    return only.newStage ? `${grew} It is now a ${only.newStage}.` : grew;
  }

  return [`${events.length} trees grew today.`, ...milestones].join(" ");
}

export function diffGrowth(
  before: BonsaiGameState,
  after: BonsaiGameState,
): GrowthEvent[] {
  const daysBefore = new Map(
    before.trees.map((tree) => [tree.id, tree.activeDaysCount]),
  );

  return after.trees.flatMap((tree) => {
    const was = daysBefore.get(tree.id);
    // A tree the earlier state never held was planted, not grown.
    if (was === undefined || tree.activeDaysCount <= was) return [];
    const stage = getGrowthLabel(tree.activeDaysCount);
    return [
      {
        treeId: tree.id,
        daysGained: tree.activeDaysCount - was,
        newStage: stage === getGrowthLabel(was) ? null : stage,
      },
    ];
  });
}
