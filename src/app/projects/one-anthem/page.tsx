import type { Metadata } from "next";
import { ProjectPage } from "@/components/ProjectPage";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js metadata must be exported from layout
export const metadata: Metadata = {
  title: "One Anthem",
  description:
    "A multilingual song of unity created in response to the invasion of Ukraine",
};

export default function OneAnthemProjectPage() {
  return (
    <ProjectPage
      description={
        <>
          <p>
            One Anthem was born from a group of people deeply affected by the
            Russian invasion of Ukraine, who wanted to actively bring people
            together rather than just watch from the sidelines. They wrote and
            recorded an original song of unity and had it translated into as
            many languages as possible to share with the world.
          </p>
          <p>
            My role was to build the platform that housed it all. That meant
            processing translations in dozens of languages, writing formatting
            scripts to ensure consistency across all of them, and handling the
            particular challenges of right-to-left languages like Arabic and
            Hebrew — a fascinating first for me.
          </p>
          <p>
            It was also my first serious attempt at UI design from scratch,
            which pushed me well outside my comfort zone in the best possible
            way. Getting a feel for typography, spacing, and visual hierarchy
            without a designer to lean on was genuinely humbling — and
            rewarding.
          </p>
          <p>
            The project also included a time-sync feature that would play the
            song simultaneously across all connected devices anywhere in the
            world — a small but meaningful gesture of collective unity. That
            synchronisation challenge was particularly satisfying to solve.
          </p>
        </>
      }
      highlights={[
        "Multilingual platform with translations in dozens of languages",
        "Right-to-left language support (Arabic, Hebrew, etc.)",
        "Scripted translation processing and formatting pipeline",
        "First attempt at UI design from scratch",
        "Global time-sync feature to play the song simultaneously across devices",
        "Built in response to a real-world humanitarian crisis",
      ]}
      placeholderGradient="linear-gradient(135deg, oklch(27.7% 0.046 192.524) 0%, oklch(38.6% 0.063 188.416) 100%)"
      subtitle="Collaborative Project"
      tagline="A small group wanted to do something meaningful in response to the Russian invasion of Ukraine. They wrote a song of unity — and I helped bring it to the world."
      tags={[
        "React",
        "TypeScript",
        "Internationalisation",
        "RTL Languages",
        "WebSockets",
        "UI Design",
        "Scripting",
      ]}
      title="One Anthem"
      headerColor="oklch(27.7% 0.046 192.524)"
      accentColor="oklch(85.5% 0.138 181.071)"
    />
  );
}
