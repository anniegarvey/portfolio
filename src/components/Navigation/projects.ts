// src/components/Navigation/projects.ts

export type ProjectLink = {
  slug: string;
  title: string;
  blurb: string;
  href: string;
  accent: string;
};

export const LIVE_APPS: readonly ProjectLink[] = [
  {
    slug: "energy-planner",
    title: "Energy Planner",
    blurb: "Plan today's spoons",
    href: "/energy-planner",
    accent: "var(--color-primary-400)",
  },
  {
    slug: "bonsai",
    title: "Bonsai Garden",
    blurb: "Spend points, grow trees",
    href: "/bonsai",
    accent: "var(--color-secondary-400)",
  },
] as const;

export const CASE_STUDIES: readonly ProjectLink[] = [
  {
    slug: "energy-planner",
    title: "Energy Planner",
    blurb: "Spoon-theory daily planner",
    href: "/projects/energy-planner",
    accent: "var(--color-primary-400)",
  },
  {
    slug: "bonsai",
    title: "Bonsai Garden",
    blurb: "Procedural growing simulation",
    href: "/projects/bonsai",
    accent: "var(--color-secondary-400)",
  },
  {
    slug: "one-anthem",
    title: "One Anthem",
    blurb: "Multilingual song of unity",
    href: "/projects/one-anthem",
    accent: "var(--color-teal-400)",
  },
  {
    slug: "windtp",
    title: "WindTP",
    blurb: "Wind-energy startup site",
    href: "/projects/windtp",
    accent: "var(--color-orange-400)",
  },
] as const;

export const PLAYGROUND_LABEL = "Playground";
export const PLAYGROUND_TAGLINE = "Gamified energy management — play to plan.";
export const CASE_STUDIES_TAGLINE = "Process, decisions, and what I learned.";
