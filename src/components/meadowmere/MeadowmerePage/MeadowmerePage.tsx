"use client";

import { HelpCircle } from "lucide-react";
import { styled } from "next-yak";
import { useCallback, useEffect, useId, useState } from "react";
import { Button } from "@/components/Button";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { Modal } from "@/components/Modal";
import { DailyDigest } from "@/components/meadowmere/DailyDigest";
import { HOW_TO_PLAY_TEXT, ValeWorld } from "@/components/meadowmere/ValeWorld";
import { PageHeader, PageTitle } from "@/components/PageHeader";
import {
  hasSeenInstructions,
  markInstructionsSeen,
} from "@/lib/meadowmere/storage";

/**
 * What a forage trip is and what it buys you. Fixed wording, because it is the
 * loop rather than the state that needs explaining. Lives in the how-to-play
 * modal alongside HOW_TO_PLAY_TEXT rather than always-visible in the HUD.
 */
const FORAGING_HINT =
  "Walk up to a wild place and use it to spend a trip and bring a material " +
  "home. Materials are what neighbours want as gifts and what quests ask for. " +
  "Trips refill each morning, and more places open up as quests are handed in.";

export function MeadowmerePage() {
  const instructionsId = useId();

  /**
   * The how-to-play modal. Closed on the server and on first client render —
   * so hydration matches — and opened right after if this device has never
   * dismissed it, which is what makes it a first-visit tutorial rather than
   * something the player has to go looking for.
   */
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  useEffect(() => {
    if (!hasSeenInstructions()) setInstructionsOpen(true);
  }, []);
  const closeInstructions = useCallback(() => {
    setInstructionsOpen(false);
    markInstructionsSeen();
  }, []);

  return (
    <MaxWidthWrapper as="main">
      <PageHeader>
        <PageTitle>Meadowmere</PageTitle>
      </PageHeader>

      <Layout>
        <IntroRow>
          <Intro>
            A smallholding at the edge of the valley. Walk the Vale, grow what
            you can, forage what you can&rsquo;t, and get to know the
            neighbours.
          </Intro>
          <HelpTrigger onClick={() => setInstructionsOpen(true)} type="button">
            <HelpCircle aria-hidden size={14} />
            How to play
          </HelpTrigger>
        </IntroRow>

        <DailyDigest />
        <ValeWorld instructionsId={instructionsId} />
      </Layout>

      <Modal
        description={HOW_TO_PLAY_TEXT}
        isOpen={instructionsOpen}
        onClose={closeInstructions}
        showDescription
        title="How to play"
      >
        <ForagingNote>{FORAGING_HINT}</ForagingNote>
        <ModalActions>
          <Button onClick={closeInstructions} size="sm">
            Got it
          </Button>
        </ModalActions>
      </Modal>
    </MaxWidthWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-bottom: 3rem;
`;

const IntroRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
`;

const Intro = styled.p`
  margin: 0;
  max-width: 60ch;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;

const HelpTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  min-height: 44px;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  background: light-dark(var(--color-grey-50), var(--color-grey-800));
  color: light-dark(var(--color-grey-700), var(--color-grey-300));

  @media (hover: hover) {
    &:hover {
      border-color: light-dark(var(--color-grey-500), var(--color-grey-400));
    }
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }
`;

const ForagingNote = styled.p`
  margin: 0 0 1rem;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;
