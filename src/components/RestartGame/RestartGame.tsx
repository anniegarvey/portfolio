"use client";

import { Sparkles } from "lucide-react";
import { styled } from "next-yak";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import {
  formatMultiplier,
  type RestartGame as Game,
  usePointsMultiplier,
  useRestartCount,
} from "@/lib/points/prestige";

interface RestartGameProps {
  game: Game;
  /** The confirm dialog's title and button, e.g. "Restart the farm". */
  label: string;
  /** What restarting now adds to the multiplier, in percent. */
  bonusPercent: number;
  /** Null once a restart is offered; otherwise what's still needed. */
  stillNeeded: string | null;
  /** What goes and what stays, shown before the player confirms. */
  description: string;
  onRestart: () => void;
}

function restartedLine(count: number): string {
  if (count === 0) return "";
  return count === 1
    ? " Restarted once so far."
    : ` Restarted ${count} times so far.`;
}

/**
 * Trading a game's progress for a lasting bonus on every point the Energy
 * Planner awards. Shows what the bonus would be now, even before a restart is
 * offered, so the player can see what staying longer is worth (ADR 0009).
 */
export function RestartGame({
  game,
  label,
  bonusPercent,
  stillNeeded,
  description,
  onRestart,
}: RestartGameProps) {
  const [confirming, setConfirming] = useState(false);
  const multiplier = usePointsMultiplier();
  const restarts = useRestartCount(game);
  const after = multiplier + bonusPercent / 100;

  return (
    <Panel aria-labelledby={`${game}-restart-heading`}>
      <Heading id={`${game}-restart-heading`}>
        <Sparkles aria-hidden size={16} /> Start afresh
      </Heading>
      <Body>
        Energy Planner points are worth {formatMultiplier(multiplier)} right
        now.{restartedLine(restarts)} Restarting here would make them{" "}
        <strong>{formatMultiplier(after)}</strong> for good.
      </Body>
      {stillNeeded === null ? (
        <div>
          <Button onClick={() => setConfirming(true)} size="sm">
            {label}…
          </Button>
        </div>
      ) : (
        <Muted>{stillNeeded}</Muted>
      )}

      <Modal
        description={`${description} Your points multiplier goes from ${formatMultiplier(multiplier)} to ${formatMultiplier(after)}, and your points are kept.`}
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        showDescription
        title={`${label}?`}
      >
        <Actions>
          <Button
            intent="secondary"
            onClick={() => setConfirming(false)}
            size="sm"
            variant="outline"
          >
            Not yet
          </Button>
          <Button
            onClick={() => {
              onRestart();
              setConfirming(false);
            }}
            size="sm"
          >
            {label}
          </Button>
        </Actions>
      </Modal>
    </Panel>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid color-mix(in oklch, var(--color-points) 40%, transparent);
  background: color-mix(in oklch, var(--color-points) 6%, transparent);
`;

const Heading = styled.h2`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  font-size: 1rem;
`;

const Body = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: light-dark(var(--color-grey-800), var(--color-grey-200));
`;

const Muted = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;
