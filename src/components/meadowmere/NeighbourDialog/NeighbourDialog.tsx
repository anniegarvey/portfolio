"use client";

import { Check } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { NeighbourCard } from "@/components/meadowmere/NeighbourCard";
import { NEIGHBOURS } from "@/lib/meadowmere/catalog";
import { useMeadowmere } from "@/lib/meadowmere/context";
import {
  questProgress,
  questStatus,
  visibleQuests,
} from "@/lib/meadowmere/questsModule";
import type { NeighbourId } from "@/lib/meadowmere/schema";

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
  const { state, claimQuest } = useMeadowmere();
  if (neighbourId === null) return null;

  const neighbour = NEIGHBOURS[neighbourId];
  const theirQuests = visibleQuests(state).filter(
    (quest) => quest.giverId === neighbourId,
  );

  return (
    <Modal
      description={`Give ${neighbour.name} a gift, or hand in what they asked for.`}
      isOpen
      onClose={onClose}
      title={neighbour.name}
    >
      <Body>
        <NeighbourCard neighbourId={neighbourId} />

        <Asks>
          <AsksTitle>What {neighbour.name} has asked for</AsksTitle>
          {theirQuests.length === 0 ? (
            <Muted>Nothing at the moment.</Muted>
          ) : (
            theirQuests.map((quest) => {
              const status = questStatus(state, quest.id);
              const done = status === "completed";
              return (
                <Ask key={quest.id}>
                  <AskTitle>{quest.title}</AskTitle>
                  <AskText>{done ? quest.thanks : quest.description}</AskText>
                  {!done && (
                    <Checklist>
                      {questProgress(state, quest).map((line) => (
                        <Line $met={line.met} key={line.key}>
                          <span aria-hidden>{line.glyph}</span> {line.label}{" "}
                          {Math.min(line.have, line.need)}/{line.need}
                          {line.met && <Check aria-hidden size={14} />}
                        </Line>
                      ))}
                    </Checklist>
                  )}
                  {done ? (
                    <DoneBadge>
                      <Check aria-hidden size={14} /> Handed in
                    </DoneBadge>
                  ) : (
                    <Button
                      disabled={status !== "ready"}
                      onClick={() => claimQuest(quest.id)}
                      size="sm"
                    >
                      {status === "ready"
                        ? `Hand in “${quest.title}”`
                        : "Not ready yet"}
                    </Button>
                  )}
                </Ask>
              );
            })
          )}
        </Asks>
      </Body>
    </Modal>
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

const DoneBadge = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: light-dark(var(--color-green-700), var(--color-green-400));
`;

const Muted = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;
