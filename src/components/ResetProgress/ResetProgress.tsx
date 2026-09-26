"use client";

import { RotateCcw } from "lucide-react";
import { styled } from "next-yak";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";

interface ResetProgressProps {
  /** Names the action, on both the trigger and the dialog's confirm button. */
  label: string;
  /** The confirmation dialog's title, phrased as a question. */
  title: string;
  /** What the reset wipes (and keeps), shown only once the player asks. */
  description: string;
  onReset: () => void;
}

/**
 * A small, quiet trigger for wiping a game's progress. Nothing happens until
 * the player confirms in a dialog, which is also where the consequences are
 * spelled out — so the page itself only spends one line on it.
 */
export function ResetProgress({
  label,
  title,
  description,
  onReset,
}: ResetProgressProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <Wrapper>
      <Button
        intent="secondary"
        leftIcon={<RotateCcw aria-hidden size={14} />}
        onClick={() => setConfirming(true)}
        size="sm"
        variant="ghost"
      >
        {label}
      </Button>

      <Modal
        description={`${description} This can't be undone.`}
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        showDescription
        title={title}
      >
        <ConfirmationActions>
          {/* Cancel first in DOM/tab order, ahead of the destructive
              action, matching most confirm dialogs elsewhere in the app. */}
          <Button
            intent="secondary"
            onClick={() => setConfirming(false)}
            size="sm"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            intent="danger"
            onClick={() => {
              onReset();
              setConfirming(false);
            }}
            size="sm"
          >
            {label}
          </Button>
        </ConfirmationActions>
      </Modal>
    </Wrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const ConfirmationActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;
