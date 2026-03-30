import { ArrowLeft, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { styled } from "next-yak";
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
  /** Path to a screenshot image in /public */
  imageSrc?: string;
  imageAlt?: string;
  /** Gradient for the first section visual when no screenshot is available */
  placeholderGradient?: string;
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
  placeholderGradient = "linear-gradient(135deg, var(--color-primary-950) 0%, var(--color-secondary-950) 100%)",
}: ProjectPageProps) {
  return (
    <article>
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
                    imageSrc ? undefined : { background: placeholderGradient }
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
  background-color: var(--color-primary-950);
  color: var(--color-primary-100);
  padding-block: 56px;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--color-primary-400);
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
  color: var(--color-primary-400);
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

const LiveLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-primary-950);
  background-color: var(--color-primary-300);
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
    background-color: var(--color-primary-100);
    transform: translateY(-2px);
  }
`;

// ─── Content sections ─────────────────────────────────────────────────────────

const ContentSection = styled.section`
  padding-block: 80px;
  background-color: light-dark(var(--color-grey-50), var(--color-grey-950));
`;

const ContentSectionAlt = styled.section`
  padding-block: 80px;
  background-color: light-dark(var(--color-grey-100), var(--color-grey-900));
`;

const ContentRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 48px;

  @media (${QUERIES.TABLET_UP}) {
    flex-direction: row;
    align-items: center;
  }
`;

const VisualColumn = styled.div`
  flex: 0 0 auto;
  width: 100%;

  @media (${QUERIES.TABLET_UP}) {
    width: 380px;
  }
`;

const VisualArea = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 12px;
  overflow: hidden;
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
    left: 0;
    color: var(--color-primary-500);
    font-weight: 700;
  }
`;

// ─── Tags visual ──────────────────────────────────────────────────────────────

const TagsVisual = styled.div`
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    var(--color-primary-950) 0%,
    var(--color-secondary-950) 100%
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
  color: var(--color-primary-400);
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
