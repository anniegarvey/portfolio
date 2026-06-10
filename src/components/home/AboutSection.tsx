import Image from "next/image";
import { styled } from "next-yak";
import { FadeIn } from "@/components/FadeIn";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { QUERIES } from "@/lib/constants";
import { SectionTitle } from "./SectionTitle";

export function AboutSection() {
  return (
    <About>
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
                  user experience for everyone. As an AuDHD developer, I bring a
                  lived perspective to neurodiversity — I know firsthand that
                  the &ldquo;standard user&rdquo; doesn&apos;t exist, and I
                  design accordingly.
                </p>
                <p>
                  I advocate for inclusive, sensory-aware interfaces and believe
                  the best products are the ones that don&apos;t leave anyone
                  behind. Neurodiversity knowledge and awareness is something I
                  care about both professionally and personally.
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
                  love losing myself in sci-fi (post-apocalyptic tales and space
                  operas especially) and fantasy (bonus points for dragons or
                  faeries!).
                </p>
                <p>
                  I&apos;m also passionate about protecting the environment and
                  building technology that contributes something real to the
                  world. Currently enjoying learning{" "}
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
    </About>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const About = styled.section`
  padding-top: calc(80px + 60px);
  padding-bottom: 80px;
  overflow: hidden;
  background-color: light-dark(var(--color-grey-50), var(--color-grey-950));
  /* Diagonal slash from Hero: high on left, low on right */
  clip-path: polygon(0 0, 100% 60px, 100% 100%, 0 100%);
  margin-top: -60px;
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
