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
        Reset the glade to the very beginning: wild visitors, residents, skills,
        and the pantry are all wiped. Points are not affected.
      </Description>
      <Button
        intent="secondary"
        onClick={() => setConfirming(true)}
        variant="outline"
      >
        Reset glade
      </Button>

      <Modal
        description="This action cannot be undone. All wild visitors, residents, skill progress, and pantry stock will be permanently lost."
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        showDescription
        title="Reset the glade?"
      >
        <ConfirmationActions>
          <Button
            intent="danger"
            onClick={() => {
              resetGlade();
              setConfirming(false);
            }}
          >
            Reset glade
          </Button>
          <Button
            intent="secondary"
            onClick={() => setConfirming(false)}
            variant="outline"
          >
            Cancel
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
  gap: 12px;
  margin-top: 24px;
`;
