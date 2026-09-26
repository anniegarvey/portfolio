"use client";

import { Check } from "lucide-react";
import { css, styled } from "next-yak";
import { getTodayDateString } from "@/lib/date";
import type { QuestConfig } from "@/lib/meadowmere/catalog";
import {
  ALL_KEEPSAKE_IDS,
  ALL_QUEST_IDS,
  CROPS,
  ERRAND_FRIENDSHIP,
  ERRAND_SEEDS,
  ITEMS,
  KEEPSAKES,
  NEIGHBOURS,
  SITES,
} from "@/lib/meadowmere/catalog";
import { useMeadowmere } from "@/lib/meadowmere/context";
import { errandStatus, todaysErrand } from "@/lib/meadowmere/errandsModule";
import { itemCount } from "@/lib/meadowmere/inventory";
import {
  earnedKeepsakes,
  questProgress,
  questStatus,
  visibleQuests,
} from "@/lib/meadowmere/questsModule";

/** Turns a quest's reward into a short human phrase for the card. */
function describeReward(quest: QuestConfig): string {
  const { reward } = quest;
  const parts: string[] = [];

  for (const [cropId, count] of Object.entries(reward.seeds ?? {})) {
    parts.push(`${count} × ${CROPS[cropId as keyof typeof CROPS].name} seeds`);
  }
  for (const [itemId, count] of Object.entries(reward.items ?? {})) {
    parts.push(`${count} × ${ITEMS[itemId as keyof typeof ITEMS].name}`);
  }
  if (reward.unlockCropId) {
    parts.push(`${CROPS[reward.unlockCropId].name} unlocked`);
  }
  if (reward.unlockSiteId) {
    parts.push(`${SITES[reward.unlockSiteId].name} opened`);
  }
  if (reward.extraPlots) {
    parts.push(`${reward.extraPlots} more plots`);
  }
  if (reward.keepsakeId) {
    parts.push(
      `a ${KEEPSAKES[reward.keepsakeId].name.toLowerCase()} for the farm`,
    );
  }
  if (reward.friendship) {
    parts.push(`+${reward.friendship} friendship`);
  }
  return parts.join(" · ");
}

/**
 * The day's errand, if there is one: who wants what, and whether it is done.
 * Read-only like the rest of the journal — it is handed in at their door.
 */
function ErrandSummary() {
  const { state } = useMeadowmere();
  const today = getTodayDateString();
  const errand = todaysErrand(state, today);
  if (errand === null) return null;

  const status = errandStatus(state, errand, today);
  const neighbour = NEIGHBOURS[errand.neighbourId];
  const item = ITEMS[errand.itemId];
  const have = Math.min(itemCount(state, errand.itemId), errand.amount);

  return (
    <QuestCard $done={status === "done"}>
      <QuestHeader>
        <QuestTitle>Today’s errand</QuestTitle>
        <Giver>
          <span aria-hidden>{neighbour.glyph}</span> {neighbour.name}
        </Giver>
      </QuestHeader>
      <QuestText>
        {status === "done"
          ? `Done for today. ${neighbour.name} will think of something else tomorrow.`
          : `${neighbour.name} could do with ${errand.amount} × ${item.name}.`}
      </QuestText>
      {status !== "done" && (
        <ChecklistItem $met={status === "ready"}>
          <span aria-hidden>{item.glyph}</span> {item.name}{" "}
          <Counts>
            {have}/{errand.amount}
          </Counts>
          {status === "ready" && <Check aria-hidden size={14} />}
        </ChecklistItem>
      )}
      <Reward>
        Reward: {ERRAND_SEEDS} × {CROPS[errand.rewardCropId].name} seeds · +
        {ERRAND_FRIENDSHIP} friendship
      </Reward>
      {status === "done" ? (
        <DoneBadge>
          <Check aria-hidden size={14} /> Done today
        </DoneBadge>
      ) : (
        <Status>
          {status === "ready"
            ? `Ready — call on ${neighbour.name} to hand it in.`
            : "A new errand every day."}
        </Status>
      )}
    </QuestCard>
  );
}

/**
 * The journal: every quest the neighbours have set and how far along it is.
 * Read-only — a quest is handed in by calling on whoever asked for it. Open
 * quests come first; settled ones sink to the bottom, so the longer the chain
 * gets the less the player has to scroll past to find what is next.
 */
export function QuestLog() {
  const { state } = useMeadowmere();
  const quests = visibleQuests(state);
  const ordered = [
    ...quests.filter((quest) => !state.completedQuestIds.includes(quest.id)),
    ...quests.filter((quest) => state.completedQuestIds.includes(quest.id)),
  ];
  const completed = ALL_QUEST_IDS.filter((id) =>
    state.completedQuestIds.includes(id),
  ).length;

  return (
    <Journal>
      <Tally>
        {completed} of {ALL_QUEST_IDS.length} quests completed ·{" "}
        {earnedKeepsakes(state).length} of {ALL_KEEPSAKE_IDS.length} keepsakes
        found
      </Tally>
      <List>
        <ErrandSummary />
        {ordered.map((quest) => {
          const status = questStatus(state, quest.id);
          const done = status === "completed";
          const lines = questProgress(state, quest);

          return (
            <QuestCard $done={done} key={quest.id}>
              <QuestHeader>
                <QuestTitle>{quest.title}</QuestTitle>
                <Giver>
                  <span aria-hidden>{NEIGHBOURS[quest.giverId].glyph}</span>{" "}
                  {NEIGHBOURS[quest.giverId].name}
                </Giver>
              </QuestHeader>

              <QuestText>{done ? quest.thanks : quest.description}</QuestText>

              {!done && (
                <Checklist>
                  {lines.map((line) => (
                    <ChecklistItem $met={line.met} key={line.key}>
                      <span aria-hidden>{line.glyph}</span> {line.label}{" "}
                      <Counts>
                        {Math.min(line.have, line.need)}/{line.need}
                      </Counts>
                      {line.met && <Check aria-hidden size={14} />}
                    </ChecklistItem>
                  ))}
                </Checklist>
              )}

              <Reward>Reward: {describeReward(quest)}</Reward>

              {done ? (
                <DoneBadge>
                  <Check aria-hidden size={14} /> Completed
                </DoneBadge>
              ) : (
                <Status>
                  {status === "ready"
                    ? `Ready — call on ${NEIGHBOURS[quest.giverId].name} to hand it in.`
                    : "Still gathering."}
                </Status>
              )}
            </QuestCard>
          );
        })}
      </List>
    </Journal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Journal = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Tally = styled.p`
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;

const List = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(290px, 100%), 1fr));
  gap: 1rem;
`;

const QuestCard = styled.div<{ $done: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 1rem;
  border-radius: 12px;
  background: light-dark(var(--color-grey-50), var(--color-grey-800));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));

  ${({ $done }) =>
    $done &&
    css`
      opacity: 0.75;
    `}
`;

const QuestHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const QuestTitle = styled.h3`
  margin: 0;
  font-size: 1.05rem;
`;

const Giver = styled.span`
  font-size: 0.8rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const QuestText = styled.p`
  margin: 0;
  font-size: 0.87rem;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;

const Checklist = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
`;

const ChecklistItem = styled.li<{ $met: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: ${({ $met }) =>
    $met
      ? "light-dark(var(--color-secondary-700), var(--color-secondary-300))"
      : "light-dark(var(--color-grey-600), var(--color-grey-400))"};
`;

const Counts = styled.span`
  font-variant-numeric: tabular-nums;
  font-weight: 600;
`;

const Reward = styled.span`
  font-size: 0.8rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const DoneBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: light-dark(var(--color-secondary-700), var(--color-secondary-300));
`;

const Status = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;
