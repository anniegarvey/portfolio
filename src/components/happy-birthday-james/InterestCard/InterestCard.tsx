"use client";

import { css, styled } from "next-yak";
import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { playCardFlip } from "@/components/happy-birthday-james/sounds";

type Accent = "primary" | "teal" | "secondary" | "rose";

interface InterestCardProps {
  icon: ReactNode;
  title: string;
  tagline: string;
  detail: string;
  accent: Accent;
  muted: boolean;
}

/**
 * A flip card for one of James's interests. Flips on tap/click rather than
 * hover so it behaves the same on touch and desktop, and stays keyboard
 * operable as a real <button>.
 *
 * Accent colors are passed down as CSS custom properties (rather than read
 * inside the styled templates via `ACCENT_VARS[accent]`) because next-yak
 * extracts these templates statically and can't parse a member expression.
 */
export function InterestCard({
  icon,
  title,
  tagline,
  detail,
  accent,
  muted,
}: InterestCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <Scene>
      <Card
        aria-pressed={flipped}
        data-flipped={flipped || undefined}
        onClick={() => {
          setFlipped((f) => !f);
          if (!muted) playCardFlip();
        }}
        style={ACCENT_VARS[accent]}
        type="button"
      >
        <Face aria-hidden={flipped}>
          <IconWrap>{icon}</IconWrap>
          <Title>{title}</Title>
          <Tagline>{tagline}</Tagline>
          <Hint>Tap to reveal</Hint>
        </Face>
        <BackFace aria-hidden={!flipped}>
          <Detail>{detail}</Detail>
        </BackFace>
      </Card>
    </Scene>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const ACCENT_VARS: Record<Accent, CSSProperties> = {
  primary: {
    "--card-fg":
      "light-dark(var(--color-primary-700), var(--color-primary-300))",
    "--card-bg":
      "light-dark(var(--color-primary-50), var(--color-primary-950))",
    "--card-solid":
      "light-dark(var(--color-primary-600), var(--color-primary-700))",
  } as CSSProperties,
  teal: {
    "--card-fg": "light-dark(var(--color-teal-700), var(--color-teal-300))",
    "--card-bg": "light-dark(var(--color-teal-50), var(--color-teal-950))",
    "--card-solid": "light-dark(var(--color-teal-600), var(--color-teal-700))",
  } as CSSProperties,
  secondary: {
    "--card-fg":
      "light-dark(var(--color-secondary-700), var(--color-secondary-300))",
    "--card-bg":
      "light-dark(var(--color-secondary-50), var(--color-secondary-950))",
    "--card-solid":
      "light-dark(var(--color-secondary-600), var(--color-secondary-700))",
  } as CSSProperties,
  rose: {
    "--card-fg": "light-dark(var(--color-rose-700), var(--color-rose-300))",
    "--card-bg": "light-dark(var(--color-rose-50), var(--color-rose-950))",
    "--card-solid": "light-dark(var(--color-rose-600), var(--color-rose-700))",
  } as CSSProperties,
};

const Scene = styled.div`
  perspective: 1200px;
  height: 220px;
`;

const Card = styled.button`
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  padding: 0;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  -webkit-transform-style: preserve-3d;
  transform-style: preserve-3d;
  transition: transform 700ms cubic-bezier(0.22, 0.98, 0.32, 1);

  &[data-flipped] {
    -webkit-transform: rotateY(180deg);
    transform: rotateY(180deg);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const facePosition = css`
  position: absolute;
  inset: 0;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border-radius: 12px;
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.4rem;

  /*
   * Hover feedback lives on the faces, not on Card: opacity (or any other
   * compositing trigger — filter, mask, mix-blend-mode) on the same element
   * as transform-style: preserve-3d forces that element's 3D context to
   * flatten per spec, which breaks the flip and re-reveals the mirrored
   * front face while hovering.
   */
  ${Card}:hover & {
    opacity: 0.94;
  }
`;

const Face = styled.span`
  ${facePosition}
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  background: light-dark(white, var(--color-grey-800));
  box-shadow: var(--elevation-xs);
`;

const BackFace = styled.span`
  ${facePosition}
  -webkit-transform: rotateY(180deg);
  transform: rotateY(180deg);
  background: var(--card-solid);
  color: white;
`;

const IconWrap = styled.span`
  display: inline-flex;
  color: var(--card-fg);
  background: var(--card-bg);
  padding: 0.6rem;
  border-radius: 50%;
`;

const Title = styled.span`
  font-weight: 700;
  font-size: 1.05rem;
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
`;

const Tagline = styled.span`
  font-size: 0.85rem;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
`;

const Hint = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: light-dark(var(--color-grey-400), var(--color-grey-500));
  margin-top: 0.3rem;
`;

const Detail = styled.span`
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.4;
`;
