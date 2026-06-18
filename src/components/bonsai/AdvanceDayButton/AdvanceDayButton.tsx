"use client";

import { Sunrise } from "lucide-react";
import { styled } from "next-yak";
import { useBonsai } from "@/lib/bonsai/context";

/**
 * Visible control for advancing the garden to the next day. The "D" keyboard
 * shortcut remains, but a button is the only path on touch devices and the
 * only discoverable one for keyboard/assistive-tech users.
 */
export function AdvanceDayButton({ className }: { className?: string }) {
  const { advanceDay } = useBonsai();
  return (
    <Btn
      className={className}
      onClick={advanceDay}
      title="Advance to the next day (shortcut: D)"
      type="button"
    >
      <Sunrise aria-hidden="true" size={16} />
      Advance day
    </Btn>
  );
}

const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 44px;
  padding: 0.4rem 1rem;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid transparent;
  color: light-dark(var(--color-grey-50), var(--color-grey-950));
  background: light-dark(var(--color-secondary-700), var(--color-secondary-400));
  transition: background 0.15s;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  &:hover {
    background: light-dark(var(--color-secondary-800), var(--color-secondary-300));
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }
`;
