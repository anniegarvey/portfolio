"use client";

import { styled } from "next-yak";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { DailyDigest } from "@/components/meadowmere/DailyDigest";
import { ValeWorld } from "@/components/meadowmere/ValeWorld";
import { PageHeader, PageTitle } from "@/components/PageHeader";

export function MeadowmerePage() {
  return (
    <MaxWidthWrapper as="main">
      <PageHeader>
        <PageTitle>Meadowmere</PageTitle>
      </PageHeader>

      <Layout>
        <Intro>
          A smallholding at the edge of the valley. Walk the Vale, grow what you
          can, forage what you can&rsquo;t, and get to know the neighbours.
        </Intro>

        <DailyDigest />
        <ValeWorld />
      </Layout>
    </MaxWidthWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-bottom: 3rem;
`;

const Intro = styled.p`
  margin: 0;
  max-width: 60ch;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;
