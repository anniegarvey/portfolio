import { Github, Linkedin } from "lucide-react";
import Image from "next/image";
import { styled } from "next-yak";
import { GITHUB_URL, LINKEDIN_URL, QUERIES } from "@/lib/constants";

export function HeroSection() {
  return (
    <Hero>
      <HeroContent>
        <HeroTitle>Hi, I&apos;m Annie Garvey!</HeroTitle>
        <HeroSubtitle>Front End Engineer</HeroSubtitle>
        <HeroTagline>
          Specialising in accessible, delightful user experiences with a
          neurodiversity-informed perspective.
        </HeroTagline>
        <ContactLinks>
          <ContactLink
            aria-label="GitHub profile"
            href={GITHUB_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Github aria-hidden="true" size={20} />
            GitHub
          </ContactLink>
          <ContactLink
            aria-label="LinkedIn profile"
            href={LINKEDIN_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Linkedin aria-hidden="true" size={20} />
            LinkedIn
          </ContactLink>
        </ContactLinks>
      </HeroContent>
      <HeroImageWrapper>
        <HeroImage
          alt="Annie — independent, curious, professional"
          height={523}
          src="/IndependentCuriousProfessional2.png"
          width={378}
        />
      </HeroImageWrapper>
    </Hero>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Hero = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 64px 48px 0;
  background-color: var(--color-primary-950);
  color: var(--color-primary-100);
  /* Diagonal bottom matching the About section's top: high on left, low on right */
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 60px), 0 100%);
  position: relative;

  /* Animated aurora gradient mesh */
  &::before {
    content: "";
    position: absolute;
    inset: -50%;
    background:
      radial-gradient(ellipse at 20% 80%, oklch(43.2% 0.232 292.759 / 0.7) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 20%, oklch(35.88% 0.114 144.5 / 0.5) 0%, transparent 55%),
      radial-gradient(ellipse at 60% 55%, oklch(38.6% 0.063 188.416 / 0.4) 0%, transparent 50%);
    animation: aurora 14s ease-in-out infinite alternate;
    z-index: 0;
    pointer-events: none;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }

  @media (${QUERIES.TABLET_UP}) {
    flex-direction: row;
    justify-content: space-between;
    padding-bottom: 0;
    align-items: center;
  }
`;

const HeroContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 55ch;
  position: relative;
  z-index: 1;

  @media (${QUERIES.TABLET_UP}) {
    /* Keep contact links above the diagonal clip at all viewport widths.
       The diagonal cuts at most ~30px from the hero bottom at the left-side
       x-positions HeroContent occupies; 52px gives comfortable clearance. */
    padding-bottom: 52px;
  }
`;

const HeroTitle = styled.h1`
  font-family: var(--font-tangerine), cursive;
  font-size: clamp(3rem, 8vw, 5rem);
  font-weight: 700;
  line-height: 1;
  animation: fadeSlideUp 0.6s var(--ease-out) 200ms both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary-300);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  animation: fadeSlideUp 0.8s var(--ease-out) 400ms both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const HeroTagline = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--color-primary-200);
  animation: fadeSlideUp 0.8s var(--ease-out) 600ms both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const ContactLinks = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 8px;
  animation: fadeSlideUp 0.8s var(--ease-out) 800ms both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const ContactLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-primary-950);
  background-color: var(--color-primary-200);
  text-decoration: none;
  transition:
    filter 0.2s var(--ease-out),
    transform 0.2s var(--ease-out);

  &:hover {
    filter: brightness(1.12);
    transform: translateY(-2px);
  }
`;

/**
 * Wrapper carries the float animation and is nudged 6 px downward so
 * the image base always sits at or below the Hero clip boundary.
 * float peak = translateY(-6px) → base exactly at the boundary.
 * float trough = translateY(0)  → base 6 px below (clipped by overflow:clip).
 */
const HeroImageWrapper = styled.div`
  position: relative;
  z-index: 1;
  margin-bottom: -6px;
  animation: float 5s ease-in-out 1.2s infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    margin-bottom: 0;
  }
`;

const HeroImage = styled(Image)`
  display: block;
  max-height: clamp(100px, 50vw, 66vh);
  /* width: auto lets the element shrink to match the height-constrained
     proportions. Without it the element box stays at the intrinsic width
     (378px) even when max-height scales the visible image down, leaving
     invisible extra space that crowds HeroContent. */
  width: auto;
  filter: drop-shadow(2px 4px 32px rgba(0, 0, 0, 0.8));
  object-fit: contain;
  animation: fadeSlideUp 1s var(--ease-out) 10ms both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
