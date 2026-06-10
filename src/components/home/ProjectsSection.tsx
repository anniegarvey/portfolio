import Link from "next/link";
import { styled } from "next-yak";
import type React from "react";
import { FadeIn } from "@/components/FadeIn";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { QUERIES } from "@/lib/constants";
import { SectionTitle } from "./SectionTitle";

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
    glow: "var(--glow-accent-primary)",
  },
  {
    slug: "bonsai",
    title: "Bonsai Garden",
    description:
      "A bonsai growing simulation with realistic procedural tree generation, gamification providing rewards for Energy Planner interaction",
    // Secondary green-700→500; scattered dot pattern (organic/earthy)
    background:
      "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(135deg, oklch(51.02% 0.143 144.23) 0%, oklch(60.41% 0.161 144.17) 100%)",
    accent: "oklch(71.37% 0.118 144.54)", // secondary-300
    glow: "var(--glow-accent-secondary)",
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
    glow: "var(--glow-accent-teal)",
  },
  {
    slug: "windtp",
    title: "WindTP",
    description:
      "A WordPress site for a Wind Energy Storage startup — still live today",
    // Orange-700→500; diagonal ray pattern (wind turbine)
    background:
      "repeating-linear-gradient(60deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 20px), linear-gradient(135deg, oklch(55.3% 0.195 38.402) 0%, oklch(70.5% 0.213 47.604) 100%)",
    accent: "oklch(83.7% 0.128 66.29)", // orange-300
    glow: "var(--glow-accent-orange)",
  },
] as const;

export function ProjectsSection() {
  return (
    <Projects>
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
                {
                  "--project-accent": project.accent,
                  "--project-glow": project.glow,
                } as React.CSSProperties
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
    </Projects>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Projects = styled.section`
  padding-top: 60px;
  padding-bottom: 80px;
  overflow: hidden;
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
`;

const ProjectCard = styled(Link)`
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  text-decoration: none;
  color: white;
  box-shadow: light-dark(var(--shadow-sm), var(--project-glow));
  transition:
    box-shadow 0.3s var(--ease-out),
    filter 0.3s var(--ease-out);

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

  &:hover,
  &:focus-visible {
    box-shadow: light-dark(var(--shadow-md), var(--project-glow));
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

  /* Subtle whole-card lift for pointer/keyboard users — additive, not
     revelatory. The description is already visible at rest, so this only
     enriches the resting state rather than uncovering hidden content. */
  &:focus-within {
    filter: brightness(1.08);
  }

  @media (hover: hover) {
    &:hover {
      filter: brightness(1.08);
    }
  }

  &:focus-visible {
    outline: 3px solid var(--color-primary-400);
    outline-offset: -3px;
  }

  @media (prefers-reduced-motion: reduce) {
    /* Keep the card-shadow transition (unchanged behaviour) but drop the
       animated brightness transition for the lift enhancement. */
    transition: box-shadow 0.3s var(--ease-out);
  }
`;
