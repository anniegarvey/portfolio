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
      description={
        <>
          <p>
            Extended spoon theory is a framework for understanding and managing
            energy across multiple dimensions — not just physical, but mental,
            emotional, and social too. As someone with ADHD and autism, I found
            this deeply resonant. But every tool I tried fell short in some way,
            so I decided to build exactly the one I wanted.
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
            Tests were, of course, essential. But I also discovered mutation
            testing (via Stryker) as a way to validate test quality without
            having to manually review every line. It surfaced gaps I
            wouldn&apos;t have noticed, and gave me real confidence in the test
            suite — a great example of &ldquo;harness engineering&rdquo;.
          </p>
          <p>
            I also compared two AI coding tools side by side: Antigravity had
            promising browser interaction but too many teething issues, while
            Claude Code was a genuine joy to work with. Having spent years
            reviewing other people&apos;s code professionally, I found that
            experience transferred directly — I just had to remind myself
            it&apos;s fine to jump in and fix things directly, since I&apos;m
            not robbing anyone of a learning opportunity but myself!
          </p>
        </>
      }
      highlights={[
        "First major project built primarily with AI coding agents",
        "Explored the balance between directing vs delegating to an AI agent",
        "Mutation testing (Stryker) to ensure test suite quality",
        "Reusable skill library as a key force multiplier for AI agents",
        "Side-by-side comparison of Antigravity vs Claude Code",
        "Designed for neurodivergent users, by a neurodivergent developer",
      ]}
      liveLabel="Open the app"
      liveUrl="/energy-planner"
      placeholderGradient="linear-gradient(135deg, oklch(28.3% 0.141 291.089) 0%, oklch(38% 0.189 293.745) 100%)"
      subtitle="Personal Project"
      tagline="After reading about extended spoon theory I was eager to try it out — but none of the tools I could find fully supported it, so I built my own."
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
      ]}
      title="Energy Planner"
    />
  );
}
