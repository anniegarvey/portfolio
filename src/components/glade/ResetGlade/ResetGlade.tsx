"use client";

import { styled } from "next-yak";
import { useId, useState } from "react";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { useGlade } from "@/lib/glade/context";

export function ResetGlade() {
  const { resetGlade } = useGlade();
  const [confirming, setConfirming] = useState(false);
  const headingId = useId();

  return (
    <Section aria-labelledby={headingId}>
      <Heading id={headingId}>Danger zone</Heading>
      <Description>
        Reset the glade to its very first day: residents and skill progress are
        lost, discovered species return to the Collection's unknowns, and wild
        visitors and the pantry go back to their starting state. Points are not
        affected.
      </Description>
      <Button
        intent="secondary"
        onClick={() => setConfirming(true)}
        size="sm"
        variant="outline"
      >
        Reset glade
      </Button>

      <Modal
        description="This action cannot be undone. Residents, skill progress, and discovered species will be permanently lost."
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        showDescription
        title="Reset the glade?"
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
              resetGlade();
              setConfirming(false);
            }}
            size="sm"
          >
            Reset glade
          </Button>
        </ConfirmationActions>
      </Modal>
    </Section>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Section = styled.section`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 1rem;
  border-radius: 12px;
  border: 1px dashed light-dark(var(--color-rose-300), var(--color-rose-800));
`;

const Heading = styled.h2`
  margin: 0;
  font-size: 1.1rem;
  color: light-dark(var(--color-rose-700), var(--color-rose-400));
`;

const Description = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const ConfirmationActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;
