import { styled } from "next-yak";

export const SectionTitle = styled.h2`
  font-family: var(--font-tangerine), cursive;
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 700;
  margin-bottom: 48px;
  color: light-dark(var(--color-primary-800), var(--color-primary-300));
  position: relative;

  /* Giant ghost watermark behind the heading */
  &::before {
    content: attr(data-ghost);
    position: absolute;
    top: 50%;
    left: -0.05em;
    transform: translateY(-50%);
    font-family: var(--font-tangerine), cursive;
    font-size: clamp(8rem, 22vw, 18rem);
    font-weight: 700;
    line-height: 1;
    color: light-dark(var(--color-primary-700), var(--color-primary-300));
    opacity: 0.055;
    pointer-events: none;
    white-space: nowrap;
    z-index: 0;
  }
`;
