import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { styled } from "next-yak";
import type React from "react";
import { FadeIn } from "@/components/FadeIn";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { QUERIES } from "@/lib/constants";

export interface ProjectPageProps {
  title: string;
  subtitle: string;
  /** Short hook sentence shown in the header */
  tagline: string;
  /** Main narrative — pass JSX for rich text */
  description: React.ReactNode;
  /** Key highlights/learnings shown in the second section */
  highlights: string[];
  /** Technology / tool tags shown as a visual block in the second section */
  tags: string[];
  /** URL to a live version of the project */
  liveUrl?: string;
  /** Label for the live URL button (default: "Try it out") */
  liveLabel?: string;
  /** Optional URL to the code repository, shown as a secondary link in the header */
  codeUrl?: string;
  /** Path to a screenshot image in /public */
  imageSrc?: string;
  imageAlt?: string;
  imageRatio?: string;
  /** Gradient for the first section visual when no screenshot is available */
  placeholderGradient?: string;
  /**
   * Dark background colour for the project header.
   * Defaults to --color-primary-950 (deep violet).
   */
  headerColor?: string;
  /**
   * Light accent colour used for the back-link, highlight arrows,
   * and "Tech & Tools" heading.
   * Defaults to --color-primary-400.
   */
  accentColor?: string;
}

export function ProjectPage({
  title,
  subtitle,
  tagline,
  description,
  highlights,
  tags,
  liveUrl,
  liveLabel = "Try it out",
  imageSrc,
  imageAlt,
  imageRatio,
  placeholderGradient = "linear-gradient(135deg, var(--color-primary-950) 0%, var(--color-secondary-950) 100%)",
  headerColor = "var(--color-primary-950)",
  accentColor = "var(--color-primary-400)",
  codeUrl,
}: ProjectPageProps) {
  return (
    <article
      style={
        {
          "--project-header-bg": headerColor,
          "--project-accent": accentColor,
        } as React.CSSProperties
      }
    >
      {/* ── Header ────────────────────────────────────────────────── */}
      <ProjectHeader>
        <MaxWidthWrapper padding="48px">
          <BackLink href="/">
            <ArrowLeft aria-hidden="true" size={18} />
            Back to portfolio
          </BackLink>
          <HeaderText>
            <ProjectSubtitle>{subtitle}</ProjectSubtitle>
            <ProjectTitle>{title}</ProjectTitle>
            <ProjectTagline>{tagline}</ProjectTagline>
            <Links>
              {liveUrl && (
                <LiveLink
                  href={liveUrl}
                  rel={
                    liveUrl.startsWith("/") ? undefined : "noopener noreferrer"
                  }
                  target={liveUrl.startsWith("/") ? undefined : "_blank"}
                >
                  {liveLabel}
                  {!liveUrl.startsWith("/") && (
                    <ExternalLink aria-hidden="true" size={16} />
                  )}
                </LiveLink>
              )}
              {codeUrl && (
                <LiveLink
                  href={codeUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Github aria-hidden="true" size={20} />
                  Codebase
                  {<ExternalLink aria-hidden="true" size={16} />}
                </LiveLink>
              )}
            </Links>
          </HeaderText>
        </MaxWidthWrapper>
      </ProjectHeader>

      {/* ── Section 1: Visual LEFT · Description RIGHT ────────────── */}
      <ContentSection>
        <MaxWidthWrapper padding="48px">
          <FadeIn>
            <ContentRow>
              <VisualColumn>
                <VisualArea
                  style={
                    {
                      "--imageRatio": imageRatio ? imageRatio : String(4 / 3),
                      ...(imageSrc
                        ? undefined
                        : { background: placeholderGradient }),
                    } as React.CSSProperties
                  }
                >
                  {imageSrc && (
                    <Image
                      alt={imageAlt ?? title}
                      fill
                      src={imageSrc}
                      style={{ objectFit: "cover" }}
                    />
                  )}
                </VisualArea>
              </VisualColumn>
              <TextColumn>
                <SectionHeading>About the Project</SectionHeading>
                <Prose>{description}</Prose>
              </TextColumn>
            </ContentRow>
          </FadeIn>
        </MaxWidthWrapper>
      </ContentSection>

      {/* ── Section 2: Highlights LEFT · Tags visual RIGHT ────────── */}
      <ContentSectionAlt>
        <MaxWidthWrapper padding="48px">
          <FadeIn delay={100}>
            <ContentRow>
              <TextColumn>
                <SectionHeading>Key Highlights</SectionHeading>
                <HighlightsList>
                  {highlights.map((item) => (
                    <HighlightItem key={item}>{item}</HighlightItem>
                  ))}
                </HighlightsList>
              </TextColumn>
              <VisualColumn>
                <TagsVisual>
                  <TagsVisualHeading>Tech &amp; Tools</TagsVisualHeading>
                  <TagsGrid>
                    {tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </TagsGrid>
                </TagsVisual>
              </VisualColumn>
            </ContentRow>
          </FadeIn>
        </MaxWidthWrapper>
      </ContentSectionAlt>
    </article>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

const ProjectHeader = styled.div`
  background-color: var(--project-header-bg, var(--color-primary-950));
  color: var(--color-primary-100);
  padding-top: 56px;
  padding-bottom: 56px;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--project-accent, var(--color-primary-400));
  text-decoration: none;
  margin-bottom: 32px;
  transition: color 0.2s;

  &:hover {
    color: var(--color-primary-200);
  }
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 65ch;
`;

const ProjectSubtitle = styled.p`
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--project-accent, var(--color-primary-400));
  animation: fadeSlideUp 0.5s var(--ease-out) 0ms both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const ProjectTitle = styled.h1`
  font-family: var(--font-tangerine), cursive;
  font-size: clamp(3rem, 7vw, 5rem);
  font-weight: 700;
  line-height: 1;
  color: var(--color-primary-100);
  animation: fadeSlideUp 0.5s var(--ease-out) 80ms both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const ProjectTagline = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--color-primary-200);
  animation: fadeSlideUp 0.5s var(--ease-out) 160ms both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Links = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
`;

const LiveLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-grey-950);
  background-color: var(--project-accent, var(--color-primary-300));
  text-decoration: none;
  width: fit-content;
  margin-top: 8px;
  transition:
    background-color 0.2s var(--ease-out),
    transform 0.2s var(--ease-out);
  animation: fadeSlideUp 0.5s var(--ease-out) 240ms both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  &:hover {
    filter: brightness(1.15);
    transform: translateY(-2px);
  }
`;

// ─── Content sections ─────────────────────────────────────────────────────────

const ContentSection = styled.section`
  padding-top: 56px;
  padding-bottom: 56px;
  position: relative;
  background-color: light-dark(var(--color-grey-50), var(--color-grey-950));
`;

const ContentSectionAlt = styled.section`
  padding-block: 56px;
  background-color: light-dark(var(--color-grey-100), var(--color-grey-900));
`;

const ContentRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 56px;

  @media (${QUERIES.DESKTOP_UP}) {
    flex-direction: row;
    align-items: flex-start;
  }
`;

const VisualColumn = styled.div`
  flex: 0 0 auto;
  width: 100%;

  @media (${QUERIES.DESKTOP_UP}) {
    width: 380px;
  }
`;

const VisualArea = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: var(--imageRatio);
  border-radius: 12px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const TextColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionHeading = styled.h2`
  font-size: 1.3rem;
  font-weight: 700;
  color: light-dark(var(--color-primary-800), var(--color-primary-300));
  margin-bottom: 4px;
`;

const Prose = styled.div`
  font-size: 1rem;
  line-height: 1.8;
  color: light-dark(var(--color-grey-800), var(--color-grey-200));

  p {
    margin-bottom: 16px;
  }

  p:last-child {
    margin-bottom: 0;
  }
`;

// ─── Highlights ───────────────────────────────────────────────────────────────

const HighlightsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HighlightItem = styled.li`
  padding-left: 20px;
  position: relative;
  font-size: 0.95rem;
  line-height: 1.5;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));

  &::before {
    content: "→";
    position: absolute;
    left: -0.3rem;
    color: var(--project-accent, var(--color-primary-500));
    font-weight: 700;
  }
`;

// ─── Tags visual ──────────────────────────────────────────────────────────────

const TagsVisual = styled.div`
  width: 100%;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    var(--project-header-bg, var(--color-primary-950)) 0%,
    color-mix(in oklch, var(--project-header-bg, var(--color-primary-950)) 60%, var(--color-secondary-950) 40%) 100%
  );
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
`;

const TagsVisualHeading = styled.p`
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--project-accent, var(--color-primary-400));
`;

const TagsGrid = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const Tag = styled.li`
  padding: 6px 16px;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 600;
  background-color: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.15);
`;
