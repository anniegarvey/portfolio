"use client";

import { Check } from "lucide-react";
import { keyframes, styled } from "next-yak";
import { type RefObject, useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { NeighbourCard } from "@/components/meadowmere/NeighbourCard";
import { getTodayDateString } from "@/lib/date";
import type { QuestConfig } from "@/lib/meadowmere/catalog";
import {
  CROPS,
  ERRAND_FRIENDSHIP,
  ERRAND_SEEDS,
  ITEMS,
  NEIGHBOURS,
} from "@/lib/meadowmere/catalog";
import { useMeadowmere } from "@/lib/meadowmere/context";
import {
  type Errand,
  errandStatus,
  todaysErrand,
} from "@/lib/meadowmere/errandsModule";
import { itemCount } from "@/lib/meadowmere/inventory";
import {
  questProgress,
  questStatus,
  visibleQuests,
} from "@/lib/meadowmere/questsModule";
import type { NeighbourId, QuestId } from "@/lib/meadowmere/schema";

/**
 * What happens when the farmer knocks on a door: how things stand with this
 * neighbour, a gift, and whatever they have asked you for.
 *
 * Quests are handed in here rather than from the journal — you settle up with
 * the person who asked, the same way you would in Stardew. The journal stays a
 * read-only account of the whole chain.
 */
export interface NeighbourDialogProps {
  /** The neighbour being called on, or null when the door is shut. */
  neighbourId: NeighbourId | null;
  onClose: () => void;
}

export function NeighbourDialog({
  neighbourId,
  onClose,
}: NeighbourDialogProps) {
  const { state, claimQuest, clearNotice } = useMeadowmere();
  // Handing in a quest swaps the button that was focused for static text, so
  // focus would fall back to the dialog. Move it to the outcome instead.
  const [justHandedIn, setJustHandedIn] = useState<QuestId | null>(null);
  const handedInRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (justHandedIn !== null) handedInRef.current?.focus();
  }, [justHandedIn]);

  if (neighbourId === null) return null;

  const neighbour = NEIGHBOURS[neighbourId];
  const theirQuests = visibleQuests(state).filter(
    (quest) => quest.giverId === neighbourId,
  );
  const errand = todaysErrand(state, getTodayDateString());
  const theirErrand = errand?.neighbourId === neighbourId ? errand : null;

  return (
    <Modal
      description={`Give ${neighbour.name} a gift, or hand in what they asked for.`}
      isOpen
      onClose={() => {
        // The gift reaction is read from the shared notice, which nothing else
        // clears — without this, reopening a door replays an old thank-you as
        // though it had just happened.
        clearNotice();
        // Same reasoning, for the same reason it is easy to miss: this dialog
        // is always mounted and only renders nothing while the door is shut,
        // so its state outlives the visit it belongs to. Left set, the badge on
        // a quest handed in last week would announce itself on every call.
        setJustHandedIn(null);
        onClose();
      }}
      title={neighbour.name}
    >
      <Body>
        <NeighbourCard neighbourId={neighbourId} />

        <Asks>
          <AsksTitle>What {neighbour.name} has asked for</AsksTitle>
          {theirErrand !== null && (
            <Ask>
              <ErrandAsk errand={theirErrand} />
            </Ask>
          )}
          {theirQuests.length === 0
            ? theirErrand === null && <Muted>Nothing at the moment.</Muted>
            : theirQuests.map((quest) => (
                <Ask key={quest.id}>
                  <QuestAsk
                    badgeRef={handedInRef}
                    justHandedIn={quest.id === justHandedIn}
                    onHandIn={() => {
                      claimQuest(quest.id);
                      setJustHandedIn(quest.id);
                    }}
                    quest={quest}
                  />
                </Ask>
              ))}
        </Asks>
      </Body>
    </Modal>
  );
}

/**
 * One thing a neighbour has asked for: what it is, how far along it is, and
 * the button that settles it.
 */
function QuestAsk({
  quest,
  justHandedIn,
  badgeRef,
  onHandIn,
}: {
  quest: QuestConfig;
  /** True only for a quest handed in on this visit, not one settled earlier. */
  justHandedIn: boolean;
  /**
   * The dialog's one focus target, taken by whichever quest was just handed
   * in. Claimed here rather than at the call site so the badge that is marked
   * fresh and the badge that takes focus can't drift apart.
   */
  badgeRef: RefObject<HTMLParagraphElement | null>;
  onHandIn: () => void;
}) {
  const { state } = useMeadowmere();
  const status = questStatus(state, quest.id);

  if (status === "completed") {
    return (
      <>
        <AskTitle>{quest.title}</AskTitle>
        <AskText>{quest.thanks}</AskText>
        {/* Calling on a neighbour whose quest was settled last week shows a
            badge that has been sitting there for days, not news. */}
        <DoneBadge
          data-fresh={justHandedIn || undefined}
          ref={justHandedIn ? badgeRef : undefined}
          tabIndex={-1}
        >
          <Check aria-hidden size={14} /> Handed in
        </DoneBadge>
      </>
    );
  }

  return (
    <>
      <AskTitle>{quest.title}</AskTitle>
      <AskText>{quest.description}</AskText>
      <Checklist>
        {questProgress(state, quest).map((line) => (
          <Line $met={line.met} key={line.key}>
            <span aria-hidden>{line.glyph}</span> {line.label}{" "}
            {Math.min(line.have, line.need)}/{line.need}
            {line.met && <Check aria-hidden size={14} />}
          </Line>
        ))}
      </Checklist>
      <Button disabled={status !== "ready"} onClick={onHandIn} size="sm">
        {status === "ready" ? `Hand in “${quest.title}”` : "Not ready yet"}
      </Button>
    </>
  );
}
/**
 * Today's errand, when it is this neighbour's turn to ask. Handed in here like
 * a quest; once done it stays until tomorrow's errand replaces it.
 */
function ErrandAsk({ errand }: { errand: Errand }) {
  const { state, claimErrand } = useMeadowmere();
  const today = getTodayDateString();
  // Handing in swaps the focused button for the badge, as with a quest — so
  // focus goes to the outcome rather than falling back to the dialog.
  const [justHandedIn, setJustHandedIn] = useState(false);
  const badgeRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (justHandedIn) badgeRef.current?.focus();
  }, [justHandedIn]);
  const status = errandStatus(state, errand, today);
  const item = ITEMS[errand.itemId];
  const have = Math.min(itemCount(state, errand.itemId), errand.amount);

  return (
    <>
      <AskTitle>Today’s errand</AskTitle>
      <AskText>
        {status === "done"
          ? "Thank you — that’s just what was needed. Come back tomorrow."
          : `Could you spare ${errand.amount} × ${item.name}? There are ${ERRAND_SEEDS} ${CROPS[errand.rewardCropId].name} seeds and +${ERRAND_FRIENDSHIP} friendship in it.`}
      </AskText>
      {status === "done" ? (
        <DoneBadge
          data-fresh={justHandedIn || undefined}
          ref={badgeRef}
          tabIndex={-1}
        >
          <Check aria-hidden size={14} /> Done today
        </DoneBadge>
      ) : (
        <>
          <Checklist>
            <Line $met={status === "ready"}>
              <span aria-hidden>{item.glyph}</span> {item.name} {have}/
              {errand.amount}
              {status === "ready" && <Check aria-hidden size={14} />}
            </Line>
          </Checklist>
          <Button
            disabled={status !== "ready"}
            onClick={() => {
              claimErrand();
              setJustHandedIn(true);
            }}
            size="sm"
          >
            {status === "ready" ? "Hand in today’s errand" : "Not ready yet"}
          </Button>
        </>
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Asks = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const AsksTitle = styled.h3`
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const Ask = styled.article`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.85rem;
  border-radius: 10px;
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
`;

const AskTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
`;

const AskText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;

const Checklist = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Line = styled.li<{ $met: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.875rem;
  color: ${({ $met }) =>
    $met
      ? "light-dark(var(--color-green-700), var(--color-green-400))"
      : "light-dark(var(--color-grey-700), var(--color-grey-300))"};
`;

const riseIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const DoneBadge = styled.p`
  display: inline-flex;
  outline-offset: 3px;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: light-dark(var(--color-green-700), var(--color-green-400));

  &[data-fresh="true"] {
    animation: ${riseIn} 240ms var(--ease-out) both;
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-fresh="true"] {
      animation: none;
    }
  }
`;

const Muted = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;
