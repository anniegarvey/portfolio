import type { Metadata } from "next";
import { styled } from "next-yak";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { PageHeader, PageTitle } from "@/components/PageHeader";
import { SuggestionForm } from "./SuggestionForm";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js metadata must be exported from layout
export const metadata: Metadata = {
  title: "Suggest an Improvement",
  description: "Suggest an improvement for this site as a GitHub issue.",
};

export default function SuggestionsPage() {
  return (
    <MaxWidthWrapper>
      <PageHeader>
        <PageTitle>Suggest an Improvement</PageTitle>
      </PageHeader>
      <Intro>
        Got an idea to make this site better? Describe it below — this opens
        GitHub in a new tab with a pre-filled issue for you to submit (a GitHub
        account is required).
      </Intro>
      <SuggestionForm />
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
