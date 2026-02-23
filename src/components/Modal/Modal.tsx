"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import { keyframes, styled } from "next-yak";
import type { ReactNode } from "react";
import { QUERIES } from "@/lib/constants";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description: string;
  showDescription?: boolean;
  onOpenAutoFocus?: (event: Event) => void;
}

/* v8 ignore start */
const preventOutsideInteractions = (e: Event) => e.preventDefault();
/* v8 ignore end */

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  description,
  showDescription,
  onOpenAutoFocus,
}: ModalProps) {
  const DescriptionWrapper = showDescription
    ? Description
    : ({ children }: { children: ReactNode }) => (
        <VisuallyHidden>
          <Dialog.DialogDescription>{children}</Dialog.DialogDescription>
        </VisuallyHidden>
      );

  return (
    <Dialog.Root onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <Dialog.Portal>
        <Overlay />
        <Content
          onInteractOutside={preventOutsideInteractions}
          onOpenAutoFocus={onOpenAutoFocus}
          onPointerDownOutside={preventOutsideInteractions}
        >
          <Header>
            <Dialog.Title asChild>
              <Title>{title}</Title>
            </Dialog.Title>
            <Dialog.Close asChild>
              <CloseButton aria-label="Close modal">
                <X size={20} />
              </CloseButton>
            </Dialog.Close>
          </Header>
          <Body>
            <DescriptionWrapper>{description}</DescriptionWrapper>
            {children}
          </Body>
        </Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translate(-50%, -48%) scale(0.96); opacity: 0; }
  to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
`;

const Description = styled(Dialog.DialogDescription)`
  margin-bottom: 16px;
`;

const Overlay = styled(Dialog.Overlay)`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: ${fadeIn} 0.2s ease-out;
  backdrop-filter: blur(2px);
`;

const Content = styled(Dialog.Content)`
  background-color: light-dark(var(--color-grey-50), var(--color-grey-900));
  border-radius: 0.5rem;
  width: 90vw; /* Changed from 100% to 90vw for better mobile default, max-width still applies */
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 10px 15px rgba(0, 0, 0, 0.1);
  animation: ${slideIn} 0.3s ease-out;
  border: 1px solid var(--color-grey-200);

  /* Fixed positioning to center on screen */
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  
  /* Ensure it doesn't overflow if centered with flexbox on Overlay */
  &:focus {
    outline: none;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-grey-200);

  @media (${QUERIES.PHABLET_UP}) {
    padding: 1rem 1.5rem;
  }
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
  color: light-dark(var(--color-grey-900), var(--color-grey-50));
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-grey-500);
  padding: 0.5rem; // Larger tap target
  border-radius: 0.25rem;
  margin-right: -0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: var(--color-grey-200);
    color: var(--color-grey-700);
  }
`;

const Body = styled.div`
  padding: 1rem;
  overflow-y: auto;

  @media (${QUERIES.PHABLET_UP}) {
    padding: 1.5rem;
  }
`;
