import type { Metadata } from "next";
import { BonsaiTimelapse } from "@/components/bonsai/BonsaiTimelapse";
import { ProjectPage } from "@/components/ProjectPage";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js metadata must be exported from layout
export const metadata: Metadata = {
  title: "Bonsai Garden",
  description:
    "A bonsai growing simulation with realistic procedural tree generation, gamification providing rewards for Energy Planner interaction",
};

export default function BonsaiProjectPage() {
  return (
    <ProjectPage
      accentColor="oklch(71.37% 0.118 144.54)"
      codeUrl="https://github.com/anniegarvey/portfolio/tree/main/src/components/bonsai"
      description={
        <>
          <p>
            Bonsai Garden is a gamified tree-growing simulation where you can
            spend your points earned from Energy Planner interactions to tend to
            miniature trees, and watch them grow over time. Making the trees
            look anything like the real thing — with authentic branching
            patterns, trunk shapes, and species-specific characteristics —
            turned out to be a fascinating design challenge.
          </p>
          <p>
            I put a lot of thought into how to guide the AI effectively on
            research for each species. Rather than asking broad questions, I
            gave specific direction on what botanical factors mattered most:
            branching angles, bark texture variation, seasonal foliage. This
            focus produced much richer species parameters than open-ended
            prompting would have.
          </p>
          <p>
            One of my favourite moments was the watering can cursor attempt. The
            first pass produced two entirely dysfunctional-looking cans — a tiny
            one for the cursor and a random large one stuck in the corner, with
            no water droplets anywhere in sight. I&apos;ve kept those early
            screenshots as a reminder that when an initial request is unclear,
            the AI will sometimes implement something entirely different rather
            than ask for clarification.
          </p>
          <p>
            This project also gave me my first real hands-on experience with
            Claude hooks and the remote control feature, which opened up
            exciting new possibilities for agent-driven development workflows.
          </p>
        </>
      }
      headerColor="oklch(26.2% 0.051 172.552)"
      highlights={[
        "Procedural SVG tree generation with species-specific parameters",
        "Researching botanical factors to guide realistic tree rendering",
        "Learned that specificity in AI prompting beats breadth",
        "First use of Claude hooks and remote control features",
        "Gamified loop with points, watering, and timelapse growth",
        "Funny early screenshots document the AI going off-script",
      ]}
      imageAlt="Tend view of a Maple Bonsai tree, with options to water and prune"
      imageRatio="2/3"
      imageSrc="/bonsai-garden.png"
      liveLabel="Visit the garden"
      liveUrl="/bonsai"
      subtitle="Personal Project"
      tagline="Getting AI to grow convincing trees turned out to be far trickier than expected — and far more entertaining."
      tags={[
        "Next.js",
        "React",
        "TypeScript",
        "SVG",
        "Procedural Generation",
        "next-yak",
        "Claude Code",
        "Claude Hooks",
        "localStorage",
      ]}
      title="Bonsai Garden"
      visualElement={<BonsaiTimelapse speciesId="maple" />}
    />
  );
}
