"use client";

import {
  Landmark,
  Ruler,
  Sparkles,
  Terminal,
  TrendingUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import { keyframes, styled } from "next-yak";
import type { CSSProperties } from "react";
import { useState } from "react";
import { BlueprintScene } from "@/components/happy-birthday-james/BlueprintScene";
import { CalibrationDial } from "@/components/happy-birthday-james/CalibrationDial";
import { InterestCard } from "@/components/happy-birthday-james/InterestCard";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { QUERIES } from "@/lib/constants";

export function HappyBirthdayCard() {
  const [celebrated, setCelebrated] = useState(false);
  const [muted, setMuted] = useState(false);

  return (
    <Page>
      <MaxWidthWrapper as="main" padding="20px">
        <SoundToggleRow>
          <SoundToggleButton
            aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
            onClick={() => setMuted((m) => !m)}
            title={muted ? "Unmute sound effects" : "Mute sound effects"}
            type="button"
          >
            {muted ? (
              <VolumeX aria-hidden="true" size={18} />
            ) : (
              <Volume2 aria-hidden="true" size={18} />
            )}
          </SoundToggleButton>
        </SoundToggleRow>

        <Hero>
          <BlueprintScene />
          <Sparkle aria-hidden="true" style={{ left: "1rem" } as CSSProperties}>
            <Sparkles size={28} />
          </Sparkle>
          <Sparkle
            aria-hidden="true"
            style={{ right: "1rem", animationDelay: "1.1s" } as CSSProperties}
          >
            <Sparkles size={22} />
          </Sparkle>

          <Annotations>
            <span>SUBJECT: JAMES</span>
            <span>REVISION: 33.0</span>
            <span>STATUS: STILL OPERATIONAL</span>
          </Annotations>

          <Title>Happy 33rd Birthday, James!</Title>
          <Subtitle>Engineered to last. No manual included.</Subtitle>
        </Hero>

        <DialSection>
          <CalibrationDial
            muted={muted}
            onCelebrate={() => setCelebrated(true)}
          />

          {celebrated && (
            <Message>
              <MessageText>
                Happy birthday to the guy who can machine a part to a tolerance
                of ±0.01mm, debug a Python script at midnight for fun, out-argue
                anyone on politics with sources on hand, and still find time to
                track the markets. Here&apos;s to another year of building,
                tinkering, and being generally brilliant at it.
              </MessageText>
              <Signature>With love, Annie</Signature>
            </Message>
          )}
        </DialSection>

        <SectionLabel>James, by specification</SectionLabel>
        <CardGrid>
          <InterestCard
            accent="primary"
            detail="Machine shop by 34?"
            icon={<Ruler aria-hidden="true" size={22} />}
            muted={muted}
            tagline="Precision, always"
            title="CAD & Machining"
          />
          <InterestCard
            accent="teal"
            detail="print(f&quot;Happy Birthday, {name}!&quot;) — probably still debugging a script at 2am!"
            icon={<Terminal aria-hidden="true" size={22} />}
            muted={muted}
            tagline="Probably automating something right now"
            title="Hobby Pythonista"
          />
          <InterestCard
            accent="secondary"
            detail="33 and still compounding — in birthdays and portfolio gains. May your returns always outpace your candles."
            icon={<TrendingUp aria-hidden="true" size={22} />}
            muted={muted}
            tagline="Reads the market like a spec sheet"
            title="Investing"
          />
          <InterestCard
            accent="rose"
            detail="Here's to another year of extremely well-researched opinions and debates!"
            icon={<Landmark aria-hidden="true" size={22} />}
            muted={muted}
            tagline="Has a take, and receipts"
            title="Politics"
          />
        </CardGrid>

        <Footer>
          Happy birthday, James. Hope 33 is your best revision yet.
        </Footer>
      </MaxWidthWrapper>
    </Page>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const Page = styled.div`
  padding-block: 2.5rem 4rem;
`;

const SoundToggleRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
`;

const SoundToggleButton = styled.button`
  background: none;
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  border-radius: 6px;
  color: light-dark(var(--color-grey-700), var(--color-grey-100));
  cursor: pointer;
  padding: 0.5rem;
  min-width: 44px;
  min-height: 44px;
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

const Hero = styled.div`
  position: relative;
  z-index: 0;
  overflow: hidden;
  text-align: center;
  border: 2px dashed light-dark(var(--color-grey-300), var(--color-grey-600));
  border-radius: 16px;
  padding: 2.5rem 1.5rem 2rem;
  margin-bottom: 2.5rem;
`;

const Sparkle = styled.span`
  position: absolute;
  top: 1rem;
  color: var(--color-orange-400);

  @media (prefers-reduced-motion: no-preference) {
    animation: hbd-twinkle 2.4s ease-in-out infinite;
  }

  @keyframes hbd-twinkle {
    0%,
    100% {
      opacity: 0.4;
      transform: scale(0.9);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
  }
`;

const Annotations = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1rem;
  font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  font-size: clamp(1.8rem, 6vw, 2.8rem);
  font-weight: 700;
  color: light-dark(var(--color-secondary-700), var(--color-secondary-400));
  margin: 0 0 0.5rem;
  text-wrap: balance;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-300));
  margin: 0;
`;

const DialSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const fadeInUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(8px) scale(0.92);
  }
  60% {
    opacity: 1;
    transform: translateY(-3px) scale(1.03);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const Message = styled.div`
  max-width: 46ch;
  text-align: center;
  animation: ${fadeInUp} 650ms var(--ease-out) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const MessageText = styled.p`
  font-size: 1.05rem;
  line-height: 1.6;
  color: light-dark(var(--color-grey-700), var(--color-grey-200));
  margin: 0 0 0.75rem;
`;

const Signature = styled.p`
  font-family: var(--font-tangerine), cursive;
  font-size: 2rem;
  color: light-dark(var(--color-primary-600), var(--color-primary-300));
  margin: 0;
`;

const SectionLabel = styled.h2`
  text-align: center;
  font-size: 1.4rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-800), var(--color-grey-100));
  margin: 0 0 1.25rem;
  text-wrap: balance;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 3rem;

  @media (${QUERIES.PHABLET_UP}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const Footer = styled.p`
  text-align: center;
  font-size: 0.95rem;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
`;
