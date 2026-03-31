import type { Metadata } from "next";
import { ProjectPage } from "@/components/ProjectPage";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js metadata must be exported from layout
export const metadata: Metadata = {
  title: "WindTP",
  description: "A WordPress site for a wind energy startup — still live today",
};

export default function WindTPProjectPage() {
  return (
    <ProjectPage
      accentColor="oklch(83.7% 0.128 66.29)"
      description={
        <>
          <p>
            WindTP needed a professional online presence to help investors
            discover and evaluate the company. I took on the full project:
            domain management, hosting setup, and building the site in
            WordPress.
          </p>
          <p>
            The UI designer had selected a theme but called for significant
            customisations that pushed well beyond what the theme was
            architected to support. Working within those constraints was an
            interesting challenge — finding ways to achieve the desired visual
            result while respecting the framework&apos;s boundaries, and knowing
            when to push through versus when to find a more pragmatic solution.
          </p>
          <p>
            This was an early project in my career, and it taught me a lot about
            managing client expectations, collaborating with designers, and the
            realities of shipping a production site that people actually rely
            on. The fact that the site is still live is something I find
            genuinely satisfying.
          </p>
        </>
      }
      headerColor="oklch(26.6% 0.079 36.259)"
      highlights={[
        "Investor-facing site — quality and professionalism were paramount",
        "Significant theme customisation beyond the design system's original scope",
        "Learned WordPress, hosting, and domain management end-to-end",
        "Collaborated closely with a UI designer",
        "Still live and in use today",
      ]}
      placeholderGradient="linear-gradient(135deg, oklch(26.6% 0.079 36.259) 0%, oklch(40.8% 0.123 38.172) 100%)"
      subtitle="Professional Project"
      tagline="A polished investor-facing website for a wind energy startup — built with WordPress, customised beyond what any theme was designed to do, and still live today."
      tags={[
        "WordPress",
        "PHP",
        "CSS",
        "JavaScript",
        "Domain Management",
        "Hosting",
        "UI Customisation",
      ]}
      title="WindTP"
    />
  );
}
