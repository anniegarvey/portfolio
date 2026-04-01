import { Github, Linkedin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { styled } from "next-yak";
import type React from "react";
import { FadeIn } from "@/components/FadeIn";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { QUERIES } from "@/lib/constants";

const GITHUB_URL = "https://github.com/anniegarvey";
const LINKEDIN_URL = "https://www.linkedin.com/in/annie-garvey-208895110/";

const projects = [
  {
    slug: "energy-planner",
    title: "Energy Planner",
    description:
      "An extended spoon theory tool for managing daily energy and activities",
    // Lightened to primary-700→500; diagonal planner-grid pattern on top
    background:
      "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 16px), linear-gradient(135deg, oklch(49.1% 0.27 292.581) 0%, oklch(60.6% 0.25 292.717) 100%)",
    accent: "oklch(81.1% 0.111 293.571)", // primary-300
  },
  {
    slug: "bonsai",
    title: "Bonsai Garden",
    description:
      "A gamified bonsai growing simulation with realistic procedural tree generation",
    // Secondary green-700→500; scattered dot pattern (organic/earthy)
    background:
      "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(135deg, oklch(51.02% 0.143 144.23) 0%, oklch(60.41% 0.161 144.17) 100%)",
    accent: "oklch(71.37% 0.118 144.54)", // secondary-300
  },
  {
    slug: "one-anthem",
    title: "One Anthem",
    description:
      "A multilingual song of unity created in response to the invasion of Ukraine",
    // Teal-700→500; horizontal staff-line pattern (music)
    background:
      "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 20px), linear-gradient(135deg, oklch(51.1% 0.096 186.391) 0%, oklch(70.4% 0.14 182.503) 100%)",
    accent: "oklch(85.5% 0.138 181.071)", // teal-300
  },
  {
    slug: "windtp",
    title: "WindTP",
    description:
      "A WordPress site for a wind energy startup — still live today",
    // Orange-700→500; diagonal ray pattern (wind turbine)
    background:
      "repeating-linear-gradient(60deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 20px), linear-gradient(135deg, oklch(55.3% 0.195 38.402) 0%, oklch(70.5% 0.213 47.604) 100%)",
    accent: "oklch(83.7% 0.128 66.29)", // orange-300
  },
] as const;

export default function Home() {
  return (
    <main>
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
            height={550}
            src="/IndependentCuriousProfessional2.png"
            width={550}
          />
        </HeroImageWrapper>
      </Hero>

      <AboutSection>
        <MaxWidthWrapper padding="48px">
          <FadeIn>
            <SectionTitle data-ghost="About Me">About Me</SectionTitle>
          </FadeIn>
          <AboutRows>
            <FadeIn>
              <AboutRow>
                {/* Image is FIRST in DOM → LEFT on desktop */}
                <AboutImageWrapper>
                  <Image
                    alt="Annie — independent, curious, professional"
                    height={400}
                    src="/IndependentCuriousProfessional.png"
                    style={{
                      objectFit: "contain",
                      width: "100%",
                      height: "auto",
                    }}
                    width={400}
                  />
                </AboutImageWrapper>
                <AboutText>
                  <AboutSubtitle>Building for Everyone</AboutSubtitle>
                  <p>
                    I&apos;m passionate about accessibility and making a great
                    user experience for everyone. As an AuDHD developer, I bring
                    a lived perspective to neurodiversity — I know firsthand
                    that the &ldquo;standard user&rdquo; doesn&apos;t exist, and
                    I design accordingly.
                  </p>
                  <p>
                    I advocate for inclusive, sensory-aware interfaces and
                    believe the best products are the ones that don&apos;t leave
                    anyone behind. Neurodiversity knowledge and awareness is
                    something I care about both professionally and personally.
                  </p>
                </AboutText>
              </AboutRow>
            </FadeIn>

            <FadeIn delay={100}>
              <AboutRow>
                {/* Text is FIRST in DOM → LEFT on desktop; image placeholder → RIGHT */}
                <AboutText>
                  <AboutSubtitle>Life Beyond the Keyboard</AboutSubtitle>
                  <p>
                    When I step away from the IDE, you&apos;ll find me singing,
                    dancing, kayaking, baking, or trying out whatever new craft
                    has caught my eye. I&apos;m proud of my Irish heritage and
                    love losing myself in sci-fi (post-apocalyptic tales and
                    space operas especially) and fantasy (bonus points for
                    dragons or faeries!).
                  </p>
                  <p>
                    I&apos;m also passionate about protecting the environment
                    and building technology that contributes something real to
                    the world. Currently enjoying learning{" "}
                    <a
                      href="https://www.joshwcomeau.com/blog/whimsical-animations/"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      whimsical animations
                    </a>{" "}
                    by Josh Comeau.
                  </p>
                </AboutText>
                <HobbyBoard>
                  <HobbyChip $bg="var(--color-rose-400)" $rotate="-2deg">
                    🎵 Singing
                  </HobbyChip>
                  <HobbyChip $bg="var(--color-teal-500)" $rotate="1.5deg">
                    🛶 Kayaking
                  </HobbyChip>
                  <HobbyChip $bg="var(--color-orange-400)" $rotate="-1deg">
                    🍰 Baking
                  </HobbyChip>
                  <HobbyChip $bg="var(--color-secondary-500)" $rotate="2deg">
                    ☘️ Irish Heritage
                  </HobbyChip>
                  <HobbyChip $bg="var(--color-primary-500)" $rotate="-1.5deg">
                    🐉 Sci-fi & Fantasy
                  </HobbyChip>
                  <HobbyChip $bg="var(--color-teal-600)" $rotate="1deg">
                    🌍 Environment
                  </HobbyChip>
                  <HobbyChip $bg="var(--color-rose-500)" $rotate="2.5deg">
                    🕺 Dancing
                  </HobbyChip>
                  <HobbyChip $bg="var(--color-secondary-600)" $rotate="-2deg">
                    🧁 Crafts
                  </HobbyChip>
                </HobbyBoard>
              </AboutRow>
            </FadeIn>
          </AboutRows>
        </MaxWidthWrapper>
      </AboutSection>

      <ProjectsSection>
        <MaxWidthWrapper padding="48px">
          <FadeIn>
            <SectionTitle data-ghost="Projects">Projects</SectionTitle>
          </FadeIn>
        </MaxWidthWrapper>
        <ProjectsGrid>
          {projects.map((project, i) => (
            <FadeIn delay={i * 80} key={project.slug}>
              <ProjectCard
                href={`/projects/${project.slug}`}
                style={
                  { "--project-accent": project.accent } as React.CSSProperties
                }
              >
                {/* TODO: replace with screenshot — public/projects/{slug}.png */}
                <ProjectBackground style={{ background: project.background }} />
                <ProjectOverlay>
                  <ProjectCardTitle>{project.title}</ProjectCardTitle>
                  <ProjectCardDescription>
                    {project.description}
                  </ProjectCardDescription>
                </ProjectOverlay>
              </ProjectCard>
            </FadeIn>
          ))}
        </ProjectsGrid>
      </ProjectsSection>
    </main>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

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
       x-positions HeroContent occupies; 40px gives comfortable clearance. */
    padding-bottom: 40px;
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
 * Wrapper carries the float animation and is nudged 12 px downward so
 * the image base always sits at or below the Hero clip boundary.
 * float peak = translateY(-12px) → base exactly at the boundary.
 * float trough = translateY(0)   → base 12 px below (clipped by overflow:clip).
 */
const HeroImageWrapper = styled.div`
  position: relative;
  z-index: 1;
  /* On mobile, dip slightly below clip so image base doesn't show a gap */
  margin-bottom: -12px;
  animation: float 5s ease-in-out 1.2s infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    margin-bottom: 0;
  }

  @media (${QUERIES.TABLET_UP}) {
    margin-right: -48px;
  }
`;

const HeroImage = styled(Image)`
  display: block;
  max-height: clamp(100px, 50vw, 66vh);
  filter: drop-shadow(2px 4px 32px rgba(0, 0, 0, 0.8));
  object-fit: contain;
  animation: fadeSlideUp 1s var(--ease-out) 10ms both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// ─── About ────────────────────────────────────────────────────────────────────

const AboutSection = styled.section`
  padding-top: calc(80px + 60px);
  padding-bottom: 80px;
  background-color: light-dark(var(--color-grey-50), var(--color-grey-950));
  /* Diagonal slash from Hero: high on left, low on right */
  clip-path: polygon(0 0, 100% 60px, 100% 100%, 0 100%);
  margin-top: -60px;
`;

const SectionTitle = styled.h2`
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

const AboutRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 80px;
`;

const AboutRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 48px;

  @media (${QUERIES.TABLET_UP}) {
    flex-direction: row;
    align-items: center;
  }
`;

const AboutText = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-size: 1.05rem;
  line-height: 1.7;

  p {
    margin: 0;
  }

  a {
    color: light-dark(var(--color-primary-700), var(--color-primary-400));
    text-decoration: underline;
  }
`;

const AboutSubtitle = styled.h3`
  font-family: var(--font-tangerine), cursive;
  font-size: 2.2rem;
  font-weight: 700;
  color: light-dark(var(--color-primary-800), var(--color-primary-300));
  margin-bottom: 4px;
  line-height: 1.1;
`;

const AboutImageWrapper = styled.div`
  flex: 0 0 auto;
  width: min(320px, 100%);

  @media (${QUERIES.TABLET_UP}) {
    width: 340px;
  }
`;

const HobbyBoard = styled.div`
  flex: 0 0 auto;
  width: min(320px, 100%);
  min-height: 280px;
  border-radius: 16px;
  background: light-dark(var(--color-grey-100), var(--color-grey-900));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  padding: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-content: center;

  @media (${QUERIES.TABLET_UP}) {
    width: 340px;
  }
`;

const HobbyChip = styled.span<{ $bg: string; $rotate: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 99px;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  background: ${({ $bg }) => $bg};
  transform: rotate(${({ $rotate }) => $rotate});
  transition: transform 0.2s var(--ease-out);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);

  &:hover {
    transform: rotate(0deg) scale(1.06);
  }
`;

// ─── Projects ─────────────────────────────────────────────────────────────────

const ProjectsSection = styled.section`
  padding-top: 60px;
  padding-bottom: 80px;
  background-color: light-dark(var(--color-grey-100), var(--color-grey-900));
  /* Opposite diagonal from About: low on left, high on right */
  clip-path: polygon(0 60px, 100% 0, 100% 100%, 0 100%);
  margin-top: -60px;
`;

const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;

  @media (${QUERIES.PHABLET_UP}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ProjectBackground = styled.div`
  position: absolute;
  inset: 0;
  transition: transform 0.5s var(--ease-out);
  will-change: transform;
`;

const ProjectOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 32px;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.65) 0%,
    rgba(0, 0, 0, 0.15) 50%,
    rgba(0, 0, 0, 0.1) 100%
  );
  transition: background 0.3s var(--ease-out);
`;

const ProjectCardTitle = styled.h3`
  font-size: clamp(1.1rem, 3vw, 1.5rem);
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
`;

const ProjectCardDescription = styled.p`
  font-size: clamp(0.8rem, 1.5vw, 0.95rem);
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
  max-width: 32ch;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 0.3s var(--ease-out),
    transform 0.3s var(--ease-out);
`;

const ProjectCard = styled(Link)`
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  text-decoration: none;
  color: white;

  /* Per-project coloured accent bar */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--project-accent);
    z-index: 2;
  }

  &:hover ${ProjectBackground},
  &:focus-visible ${ProjectBackground} {
    transform: scale(1.07);
  }

  &:hover ${ProjectOverlay},
  &:focus-visible ${ProjectOverlay} {
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.5) 0%,
      rgba(0, 0, 0, 0.08) 50%,
      rgba(0, 0, 0, 0.05) 100%
    );
  }

  &:hover ${ProjectCardDescription},
  &:focus-visible ${ProjectCardDescription} {
    opacity: 1;
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 3px solid var(--color-primary-400);
    outline-offset: -3px;
  }
`;
