import type { Metadata } from "next";
import { ProjectPage } from "@/components/ProjectPage";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js metadata must be exported from layout
export const metadata: Metadata = {
  title: "Energy Planner",
  description:
    "An extended spoon theory tool for managing daily energy and activities",
};

export default function EnergyPlannerProjectPage() {
  return (
    <ProjectPage
      accentColor="oklch(81.1% 0.111 293.571)"
      codeUrl="https://github.com/anniegarvey/portfolio/tree/main/src/components/energy-planner"
      description={
        <>
          <p>
            While working through the{" "}
            <a
              href="https://www.simonandschuster.co.uk/books/The-Autistic-Burnout-Workbook/Megan-Anna-Neff/Self-Care-for-Autistic-People/9781507223062"
              rel="noopener noreferrer"
              target="_blank"
            >
              Autistic Burnout Workbook
            </a>
            I found the idea of applying spoon theory to different types of
            energy - such as physical, social and executive functioning - to be
            really helpful. I thought surely a tool must exist to help me put it
            into practice, but I couldn&apos;t find anything that quite fit the
            bill. So I built my own!
          </p>
          <p>
            This was also my first substantial build leaning heavily into AI
            agents, and I used it as a deliberate experiment: where is the right
            balance between directing the agent with precision versus letting it
            run? I found that having a library of well-crafted, reusable skills
            was enormously helpful — the agent produced far better output when
            given clear, specific patterns to follow.
          </p>
          <p>
            Tests were, of course, essential - "vibe coding" new features
            quickly breaks old ones without a solid test suite! I found mutation
            testing (via Stryker) is a great way to validate test quality
            without having to manually review every line. It surfaced gaps I
            wouldn&apos;t have noticed, and gave me real confidence in the test
            suite — a great intro to &ldquo;harness engineering&rdquo;.
          </p>
          <p>
            I tried out two major AI coding tools on the project: Antigravity
            had promising browser interaction but too many teething issues on
            WSL, while Claude Code was a genuine joy to work with. Having spent
            years reviewing other people&apos;s code professionally, I found
            that experience transferred directly — I just had to remind myself
            it&apos;s fine to jump in and fix things directly, since I&apos;m
            not robbing anyone of a learning opportunity but myself!
          </p>
        </>
      }
      headerColor="oklch(28.3% 0.141 291.089)"
      highlights={[
        "First major project built primarily with AI coding agents",
        "Explored the balance between directing vs delegating to an AI agent",
        "Mutation testing (Stryker) to ensure test suite quality",
        "Reusable skill library as a key force multiplier for AI agents",
        "Side-by-side comparison of Antigravity vs Claude Code",
        "Designed for neurodivergent users, by a neurodivergent developer",
      ]}
      imageAlt="Energy Planner Home page, showing energy capacity and usage for the day, and activities planned into zones"
      imageRatio="1.2"
      imageSrc="/energy-planner.png"
      liveLabel="Open the app"
      liveUrl="/energy-planner"
      placeholderGradient="linear-gradient(135deg, oklch(28.3% 0.141 291.089) 0%, oklch(38% 0.189 293.745) 100%)"
      subtitle="Personal Project"
      tagline="Explored the art of the possible with AI coding agents, while building a tool to help myself and others manage energy in a more holistic way"
      tags={[
        "Next.js",
        "React",
        "TypeScript",
        "next-yak",
        "Vitest",
        "Playwright",
        "Stryker",
        "dnd-kit",
        "IndexedDB",
        "Claude Code",
        "Antigravity",
      ]}
      title="Energy Planner"
    />
  );
}
