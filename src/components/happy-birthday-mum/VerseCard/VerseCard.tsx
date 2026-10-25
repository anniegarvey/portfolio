"use client";

import { css, keyframes, styled } from "next-yak";
import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";

type Accent = "rose" | "primary" | "secondary" | "teal";
type Flourish = "notes" | "petals" | "bubbles";

interface VerseCardProps {
  icon: ReactNode;
  title: string;
  tagline: string;
  detail: string;
  accent: Accent;
  flourish: Flourish;
  onReveal: () => void;
}

const FLOURISH_GLYPHS: Record<Flourish, string[]> = {
  notes: ["♪", "♫", "♩", "♬", "♪", "♫", "♩"],
  petals: ["✿", "❀", "✿", "❁", "❀", "✿", "❀"],
  bubbles: ["○", "◦", "○", "◯", "◦", "○", "◦"],
};

/**
 * One of Mum's interests. Tapping it plays a little sound of its own (a
 * clarinet run, birdsong, bubbles…), sends a puff of notes, petals or
 * bubbles floating up, and cross-fades the front over to the message —
 * a soft reveal in place rather than a card flip. It's a real <button>, so
 * it works the same by touch, mouse and keyboard.
 *
 * Accent colors arrive as CSS custom properties because next-yak extracts
 * these templates statically and can't read a member expression in them.
 */
export function VerseCard({
  icon,
  title,
  tagline,
  detail,
  accent,
  flourish,
  onReveal,
}: VerseCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [puffs, setPuffs] = useState(0);

  return (
    <Card
      aria-pressed={revealed}
      data-revealed={revealed || undefined}
      onClick={() => {
        setRevealed((r) => !r);
        if (!revealed) {
          setPuffs((p) => p + 1);
          onReveal();
        }
      }}
      style={ACCENT_VARS[accent]}
      type="button"
    >
      <Front aria-hidden={revealed}>
        <IconWrap>{icon}</IconWrap>
        <Title>{title}</Title>
        <Tagline>{tagline}</Tagline>
        <Hint>Tap for a verse</Hint>
      </Front>
      <Back aria-hidden={!revealed}>
        <Detail>{detail}</Detail>
      </Back>
      {puffs > 0 && (
        <Puffs aria-hidden="true" key={puffs}>
          {FLOURISH_GLYPHS[flourish].map((glyph, i) => (
            <Puff
              // biome-ignore lint/suspicious/noArrayIndexKey: a fixed, never-reordered set
              key={i}
              style={
                {
                  "--x": `${8 + i * 14}%`,
                  "--delay": `${(i % 3) * 90}ms`,
                  "--rise": `${110 + (i % 4) * 25}px`,
                } as CSSProperties
              }
            >
              {glyph}
            </Puff>
          ))}
        </Puffs>
      )}
    </Card>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const ACCENT_VARS: Record<Accent, CSSProperties> = {
  rose: {
    "--card-fg": "light-dark(var(--color-rose-700), var(--color-rose-300))",
    "--card-bg": "light-dark(var(--color-rose-50), var(--color-rose-950))",
    "--card-solid": "light-dark(var(--color-rose-600), var(--color-rose-800))",
  } as CSSProperties,
  primary: {
    "--card-fg":
      "light-dark(var(--color-primary-700), var(--color-primary-300))",
    "--card-bg":
      "light-dark(var(--color-primary-50), var(--color-primary-950))",
    "--card-solid":
      "light-dark(var(--color-primary-600), var(--color-primary-800))",
  } as CSSProperties,
  secondary: {
    "--card-fg":
      "light-dark(var(--color-secondary-700), var(--color-secondary-300))",
    "--card-bg":
      "light-dark(var(--color-secondary-50), var(--color-secondary-950))",
    "--card-solid":
      "light-dark(var(--color-secondary-700), var(--color-secondary-800))",
  } as CSSProperties,
  teal: {
    "--card-fg": "light-dark(var(--color-teal-700), var(--color-teal-300))",
    "--card-bg": "light-dark(var(--color-teal-50), var(--color-teal-950))",
    "--card-solid": "light-dark(var(--color-teal-700), var(--color-teal-800))",
  } as CSSProperties,
};

const Card = styled.button`
  position: relative;
  display: grid;
  width: 100%;
  min-height: 220px;
  padding: 0;
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  border-radius: 24px 24px 24px 6px;
  background: light-dark(white, var(--color-grey-800));
  box-shadow: var(--elevation-xs);
  font: inherit;
  text-align: center;
  cursor: pointer;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: background-color 500ms ease, border-color 500ms ease,
    transform 200ms ease;

  &[data-revealed] {
    background: var(--card-solid);
    border-color: var(--card-solid);
  }

  &:hover {
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover {
      transform: none;
    }
  }
`;

// Both faces share one grid cell, so the card is always as tall as the
// longer of the two and the cross-fade never jumps in height.
const face = css`
  grid-area: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 1.25rem 1.25rem;
  transition: opacity 400ms ease, transform 500ms var(--ease-out);
`;

const Front = styled.span`
  ${face}

  ${Card}[data-revealed] & {
    opacity: 0;
    transform: translateY(-12px);
  }
`;

const Back = styled.span`
  ${face}
  opacity: 0;
  transform: translateY(12px);
  color: white;

  ${Card}[data-revealed] & {
    opacity: 1;
    transform: translateY(0);
  }
`;

const IconWrap = styled.span`
  display: inline-flex;
  color: var(--card-fg);
  background: var(--card-bg);
  padding: 0.7rem;
  border-radius: 50%;
`;

const Title = styled.span`
  font-weight: 700;
  font-size: 1.1rem;
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
`;

const Tagline = styled.span`
  font-size: 0.9rem;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
`;

const Hint = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--card-fg);
  margin-top: 0.3rem;
`;

const Detail = styled.span`
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5;
  max-width: 34ch;
`;

const floatUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(0) scale(0.6);
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(calc(-1 * var(--rise))) scale(1.2) rotate(20deg);
  }
`;

const Puffs = styled.span`
  position: absolute;
  inset: 0;
  pointer-events: none;

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

const Puff = styled.span`
  position: absolute;
  bottom: 0.5rem;
  left: var(--x);
  font-size: 1.3rem;
  color: white;
  opacity: 0;
  animation: ${floatUp} 1400ms ease-out var(--delay) forwards;
`;
