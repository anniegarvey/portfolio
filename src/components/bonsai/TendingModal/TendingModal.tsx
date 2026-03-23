"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import { keyframes, styled } from "next-yak";
import { TreeView } from "@/components/bonsai/TreeView";
import { useBonsai } from "@/lib/bonsai/context";
import type { BonsaiTree } from "@/lib/bonsai/schema";
import { SPECIES_CONFIG } from "@/lib/bonsai/schema";

interface TendingModalProps {
  tree: BonsaiTree | null;
  onClose: () => void;
}

export function TendingModal({ tree, onClose }: TendingModalProps) {
  const { advanceDay } = useBonsai();

  return (
    <Dialog.Root
      onOpenChange={(open) => !open && onClose()}
      open={tree !== null}
    >
      <Dialog.Portal>
        <Overlay />
        <Content aria-describedby={undefined}>
          <VisuallyHidden.Root asChild>
            <Dialog.Title>
              {tree
                ? `Tending ${SPECIES_CONFIG[tree.speciesId].label}`
                : "Tending tree"}
            </Dialog.Title>
          </VisuallyHidden.Root>

          <Header>
            <AdvanceDayButton
              onClick={advanceDay}
              title="Advance this tree by one day (requires watering)"
              type="button"
            >
              ⏩ Advance Day
            </AdvanceDayButton>
            <Dialog.Close asChild>
              <CloseButton aria-label="Close" type="button">
                <X size={20} />
              </CloseButton>
            </Dialog.Close>
          </Header>

          <Body>{tree && <TreeView tree={tree} />}</Body>
        </Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translate(-50%, -48%); }
  to { opacity: 1; transform: translate(-50%, -50%); }
`;

// ─── Styles ───────────────────────────────────────────────────────────────────

const Overlay = styled(Dialog.Overlay)`
  position: fixed;
  inset: 0;
  z-index: 50;
  background: light-dark(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6));
  animation: ${fadeIn} 150ms ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Content = styled(Dialog.Content)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 51;
  width: min(520px, calc(100vw - 2rem));
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
  background: light-dark(var(--color-grey-50), var(--color-grey-900));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  animation: ${slideIn} 150ms ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  &:focus-visible {
    outline: none;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1rem 0;
`;

const Body = styled.div`
  padding: 0.5rem 1.5rem 1.5rem;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  cursor: pointer;
  border-radius: 6px;
  padding: 0.3rem;
  transition: color 150ms ease, background 150ms ease;

  &:hover {
    color: light-dark(var(--color-grey-800), var(--color-grey-100));
    background: light-dark(var(--color-grey-100), var(--color-grey-800));
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const AdvanceDayButton = styled.button`
  background: none;
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  border-radius: 6px;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.3rem 0.6rem;
  transition: border-color 150ms ease, color 150ms ease;

  &:hover {
    border-color: light-dark(var(--color-primary-400), var(--color-primary-500));
    color: light-dark(var(--color-primary-600), var(--color-primary-400));
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
