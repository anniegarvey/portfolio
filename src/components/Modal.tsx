"use client";

import { X } from "lucide-react";
import { keyframes, styled } from "next-yak";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <Overlay onClick={onClose} ref={overlayRef}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>{title}</Title>
          <CloseButton aria-label="Close modal" onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </Header>
        <Body>{children}</Body>
      </ModalContent>
    </Overlay>,
    document.body,
  );
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
  backdrop-filter: blur(2px);
`;

const ModalContent = styled.div`
  background-color: light-dark(var(--color-grey-50), var(--color-grey-900));
  border-radius: 0.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 10px 15px rgba(0, 0, 0, 0.1);
  animation: ${slideIn} 0.3s ease-out;
  border: 1px solid var(--color-grey-200);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-grey-200);
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-grey-500);
  padding: 0.25rem;
  border-radius: 0.25rem;
  margin-right: -0.5rem;

  &:hover {
    background-color: var(--color-grey-200);
    color: var(--color-grey-700);
  }
`;

const Body = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
`;
