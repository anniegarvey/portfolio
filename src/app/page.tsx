import { Github, Linkedin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { styled } from "next-yak";
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
    color: "oklch(28.3% 0.141 291.089)",
  },
  {
    slug: "bonsai",
    title: "Bonsai Garden",
    description:
      "A gamified bonsai growing simulation with realistic procedural tree generation",
    color: "oklch(26.2% 0.051 172.552)",
  },
  {
    slug: "one-anthem",
    title: "One Anthem",
    description:
      "A multilingual song of unity created in response to the invasion of Ukraine",
    color: "oklch(27.7% 0.046 192.524)",
  },
  {
    slug: "windtp",
    title: "WindTP",
    description:
      "A WordPress site for a wind energy startup — still live today",
    color: "oklch(26.6% 0.079 36.259)",
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
        <HeroImage
          alt="Annie — independent, curious, professional"
          height={550}
          src="/IndependentCuriousProfessional.png"
          width={550}
        />
      </Hero>

      <AboutSection>
        <MaxWidthWrapper padding="48px">
          <FadeIn>
            <SectionTitle>About Me</SectionTitle>
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
                {/* TODO: replace with a real image */}
                <AboutImagePlaceholder aria-hidden="true" />
              </AboutRow>
            </FadeIn>
          </AboutRows>
        </MaxWidthWrapper>
      </AboutSection>

      <ProjectsSection>
        <MaxWidthWrapper padding="48px">
          <FadeIn>
            <SectionTitle>Projects</SectionTitle>
          </FadeIn>
        </MaxWidthWrapper>
        <ProjectsGrid>
          {projects.map((project, i) => (
            <FadeIn delay={i * 80} key={project.slug}>
              <ProjectCard href={`/projects/${project.slug}`}>
                {/* TODO: replace with screenshot — public/projects/{slug}.png */}
                <ProjectBackground style={{ background: project.color }} />
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
  overflow: clip;

  @media (${QUERIES.TABLET_UP}) {
    flex-direction: row;
    justify-content: space-between;
    padding-bottom: 0;
  }
`;

const HeroContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 55ch;
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
  letter-spacing: 0.05em;
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
    background-color 0.2s var(--ease-out),
    transform 0.2s var(--ease-out);

  &:hover {
    background-color: var(--color-primary-100);
    transform: translateY(-2px);
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

  @media (${QUERIES.TABLET_UP}) {
    margin-right: -48px;
  }
`;

// ─── About ────────────────────────────────────────────────────────────────────

const AboutSection = styled.section`
  padding-block: 80px;
  background-color: light-dark(var(--color-grey-50), var(--color-grey-950));
`;

const SectionTitle = styled.h2`
  font-family: var(--font-tangerine), cursive;
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 700;
  margin-bottom: 48px;
  color: light-dark(var(--color-primary-800), var(--color-primary-300));
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
  font-size: 1.4rem;
  font-weight: 700;
  color: light-dark(var(--color-primary-800), var(--color-primary-300));
  margin-bottom: 8px;
`;

const AboutImageWrapper = styled.div`
  flex: 0 0 auto;
  width: min(320px, 100%);

  @media (${QUERIES.TABLET_UP}) {
    width: 340px;
  }
`;

const AboutImagePlaceholder = styled.div`
  flex: 0 0 auto;
  width: min(320px, 100%);
  height: 320px;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    var(--color-teal-800) 0%,
    var(--color-secondary-800) 100%
  );
  opacity: 0.8;

  @media (${QUERIES.TABLET_UP}) {
    width: 340px;
    height: 340px;
  }
`;

// ─── Projects ─────────────────────────────────────────────────────────────────

const ProjectsSection = styled.section`
  padding-bottom: 80px;
  background-color: light-dark(var(--color-grey-100), var(--color-grey-900));
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
  background-color: rgba(0, 0, 0, 0.35);
  transition: background-color 0.3s var(--ease-out);
`;

const ProjectCard = styled(Link)`
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  text-decoration: none;
  color: white;

  &:hover ${ProjectBackground},
  &:focus-visible ${ProjectBackground} {
    transform: scale(1.07);
  }

  &:hover ${ProjectOverlay},
  &:focus-visible ${ProjectOverlay} {
    background-color: rgba(0, 0, 0, 0.2);
  }

  &:focus-visible {
    outline: 3px solid var(--color-primary-400);
    outline-offset: -3px;
  }
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
`;
