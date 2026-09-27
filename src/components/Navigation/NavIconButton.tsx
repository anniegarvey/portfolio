import { styled } from "next-yak";

/** The bordered icon button the nav's theme and sound toggles share. */
export const NavIconButton = styled.button`
  background: none;
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  border-radius: 6px;
  color: light-dark(var(--color-grey-700), var(--color-grey-100));
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  display: flex;
  align-items: center;
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
