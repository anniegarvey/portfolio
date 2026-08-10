import { Lightbulb } from "lucide-react";
import Link from "next/link";
import { styled } from "next-yak";

const LABEL = "Suggest an improvement";

export function SuggestionButton() {
  return (
    <StyledLink aria-label={LABEL} href="/suggestions" title={LABEL}>
      <Lightbulb aria-hidden="true" size={20} />
    </StyledLink>
  );
}

const StyledLink = styled(Link)`
  background: none;
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  border-radius: 6px;
  color: light-dark(var(--color-grey-700), var(--color-grey-100));
  cursor: pointer;
  padding: 8px;
  min-width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
  transition: background-color 200ms ease, color 200ms ease,
    border-color 200ms ease;

  &:hover {
    background-color: var(--color-primary-700);
    border-color: var(--color-primary-500);
    color: var(--color-primary-100);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
