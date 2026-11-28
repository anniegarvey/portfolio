import type { Metadata } from "next";
import { styled } from "next-yak";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { PageHeader, PageTitle } from "@/components/PageHeader";
import { SoundCheck } from "./SoundCheck";

// An unlisted page for auditioning every game sound on a phone, for example
// on a pull request's preview build. Nothing links to it.
// biome-ignore lint/style/useComponentExportOnlyModules: Next.js metadata must be exported from a page
export const metadata: Metadata = {
  title: "Sound Check",
  robots: { index: false, follow: false },
};

export default function SoundCheckPage() {
  return (
    <MaxWidthWrapper>
      <PageHeader>
        <PageTitle>Sound Check</PageTitle>
      </PageHeader>
      <Intro>
        Every sound in the games, played exactly as the games play them. Tap one
        to hear it. If you hear nothing, check the sound toggle in the nav and,
        on an iPhone, the silent switch.
      </Intro>
      <SoundCheck />
    </MaxWidthWrapper>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const Intro = styled.p`
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
  max-width: 40rem;
  margin-inline: auto;
  margin-bottom: 1.5rem;
`;
