"use client";

import { Flower2, MicVocal, WavesLadder } from "lucide-react";
import { keyframes, styled } from "next-yak";
import { useState } from "react";
import { Clarinet } from "@/components/happy-birthday-mum/Clarinet";
import { SingAlongGarden } from "@/components/happy-birthday-mum/SingAlongGarden";
import { StaffScene } from "@/components/happy-birthday-mum/StaffScene";
import {
  playBirdsong,
  playBubbles,
  playClarinetRun,
  playSingingFlourish,
} from "@/components/happy-birthday-mum/sounds";
import { VerseCard } from "@/components/happy-birthday-mum/VerseCard";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { QUERIES } from "@/lib/constants";

export function BirthdayMumCard() {
  const [celebrated, setCelebrated] = useState(false);

  return (
    <Page>
      <MaxWidthWrapper as="main" padding="20px">
        <Hero>
          <StaffScene />
          <Markings>
            <span>Allegro con amore</span>
            <span>In the key of Mum major</span>
            <span>
              <em>ff</em> fortissimo
            </span>
          </Markings>
          <Title>Happy Birthday, Mum!</Title>
          <Subtitle>
            Today&apos;s forecast: high notes, full blooms and a long, lovely
            swim.
          </Subtitle>
        </Hero>

        <SongSection>
          <SingAlongGarden onCelebrate={() => setCelebrated(true)} />

          {celebrated && (
            <Message>
              <MessageText>
                Happy birthday to the woman who fills every room with music,
                whether that&apos;s a song, a clarinet solo or humming along in
                the garden. Thank you for everything. Here&apos;s to a year as
                bright as your borders, as calm as an early morning swim, and as
                joyful as your favourite song.
              </MessageText>
              <Signature>With love, Annie</Signature>
            </Message>
          )}
        </SongSection>

        <SectionLabel>Mum, in four movements</SectionLabel>
        <CardGrid>
          <VerseCard
            accent="rose"
            detail="Here's to another year of harmonies, high notes, and singing in the kitchen like it's the Royal Albert Hall."
            flourish="notes"
            icon={<MicVocal aria-hidden="true" size={24} />}
            onReveal={playSingingFlourish}
            tagline="Never misses a high note"
            title="Singing"
          />
          <VerseCard
            accent="primary"
            detail="From the lowest chalumeau to the top of the clarion: may this year be all sweet notes and no squeaks."
            flourish="notes"
            icon={<Clarinet size={24} />}
            onReveal={playClarinetRun}
            tagline="Woodwind section's finest"
            title="Clarinet"
          />
          <VerseCard
            accent="secondary"
            detail="May everything you plant this year bloom, and may every slug take its business elsewhere."
            flourish="petals"
            icon={<Flower2 aria-hidden="true" size={24} />}
            onReveal={playBirdsong}
            tagline="Green fingers, full borders"
            title="Gardening"
          />
          <VerseCard
            accent="teal"
            detail="Another lap around the sun! Wishing you warm water, an empty lane and as many lengths as you like."
            flourish="bubbles"
            icon={<WavesLadder aria-hidden="true" size={24} />}
            onReveal={playBubbles}
            tagline="Lengths before breakfast"
            title="Swimming"
          />
        </CardGrid>

        <Footer>Happy birthday, Mum. Take a bow, and then an encore!</Footer>
      </MaxWidthWrapper>
    </Page>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const Page = styled.div`
  padding-block: 2.5rem 4rem;
`;

const Hero = styled.div`
  position: relative;
  z-index: 0;
  overflow: hidden;
  text-align: center;
  border: 1px solid light-dark(var(--color-rose-200), var(--color-rose-900));
  border-radius: 32px;
  padding: 2.5rem 1.5rem 2.25rem;
  margin-bottom: 2.5rem;
`;

const Markings = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.25rem 1.25rem;
  font-style: italic;
  font-size: 0.85rem;
  color: light-dark(var(--color-primary-600), var(--color-primary-300));
  margin-bottom: 0.5rem;

  & em {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 700;
  }
`;

const shimmer = keyframes`
  from { background-position: 0% 50%; }
  to { background-position: 200% 50%; }
`;

const Title = styled.h1`
  font-family: var(--font-tangerine), cursive;
  font-size: clamp(3.4rem, 13vw, 5.5rem);
  font-weight: 700;
  line-height: 1.05;
  margin: 0 0 0.5rem;
  text-wrap: balance;
  color: light-dark(var(--color-rose-600), var(--color-rose-300));
  background: linear-gradient(
    90deg,
    light-dark(var(--color-rose-600), var(--color-rose-300)),
    light-dark(var(--color-primary-600), var(--color-primary-300)),
    light-dark(var(--color-rose-600), var(--color-rose-300))
  );
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (prefers-reduced-motion: no-preference) {
    animation: ${shimmer} 8s linear infinite;
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: light-dark(var(--color-grey-700), var(--color-grey-200));
  margin: 0 auto;
  max-width: 36ch;
`;

const SongSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const fadeInUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Message = styled.div`
  max-width: 46ch;
  text-align: center;
  animation: ${fadeInUp} 800ms var(--ease-out) both;

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
  font-size: 2.2rem;
  color: light-dark(var(--color-rose-600), var(--color-rose-300));
  margin: 0;
`;

const SectionLabel = styled.h2`
  text-align: center;
  font-family: var(--font-tangerine), cursive;
  font-size: 2.6rem;
  font-weight: 700;
  color: light-dark(var(--color-primary-700), var(--color-primary-300));
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
