"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { styled } from "next-yak";
import { useId } from "react";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { DailyDigest } from "@/components/meadowmere/DailyDigest";
import { FarmPanel } from "@/components/meadowmere/FarmPanel";
import { NeighboursPanel } from "@/components/meadowmere/NeighboursPanel";
import { QuestLog } from "@/components/meadowmere/QuestLog";
import { WildsPanel } from "@/components/meadowmere/WildsPanel";
import { PageHeader, PageTitle } from "@/components/PageHeader";
import { QUERIES } from "@/lib/constants";
import { CROPS } from "@/lib/meadowmere/catalog";
import { useMeadowmere } from "@/lib/meadowmere/context";
import { questStatus, visibleQuests } from "@/lib/meadowmere/questsModule";

export function MeadowmerePage() {
  const { state, notice } = useMeadowmere();
  const summaryId = useId();

  const readyQuests = visibleQuests(state).filter(
    (quest) => questStatus(state, quest.id) === "ready",
  ).length;

  return (
    <MaxWidthWrapper as="main">
      <PageHeader>
        <PageTitle>Meadowmere</PageTitle>
      </PageHeader>

      <Announcement aria-atomic="true" aria-live="polite" id={summaryId}>
        {notice?.kind === "harvest"
          ? `Harvested ${notice.amount} × ${CROPS[notice.cropId].name}.`
          : ""}
      </Announcement>

      <Layout>
        <Intro>
          A smallholding at the edge of the valley. Grow what you can, forage
          what you can&apos;t, and get to know the neighbours.
        </Intro>

        <DailyDigest />

        <PageTabs defaultValue="farm">
          <PageTabsList aria-label="Meadowmere sections">
            <PageTab value="farm">Farm</PageTab>
            <PageTab value="wilds">Wilds</PageTab>
            <PageTab value="neighbours">Neighbours</PageTab>
            <PageTab value="quests">
              Quests
              {readyQuests > 0 && (
                <ReadyDot aria-label={`${readyQuests} ready to hand in`} />
              )}
            </PageTab>
          </PageTabsList>

          <Tabs.Content value="farm">
            <FarmPanel />
          </Tabs.Content>
          <Tabs.Content value="wilds">
            <WildsPanel />
          </Tabs.Content>
          <Tabs.Content value="neighbours">
            <NeighboursPanel />
          </Tabs.Content>
          <Tabs.Content value="quests">
            <QuestLog />
          </Tabs.Content>
        </PageTabs>
      </Layout>
    </MaxWidthWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Announcement = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 3rem;
`;

const Intro = styled.p`
  margin: 0;
  max-width: 60ch;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;

const PageTabs = styled(Tabs.Root)`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const PageTabsList = styled(Tabs.List)`
  display: flex;
  border-bottom: 2px solid
    light-dark(var(--color-grey-200), var(--color-grey-700));
  overflow-x: auto;
  overflow-y: hidden;
`;

const PageTab = styled(Tabs.Trigger)`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: none;
  padding: 0.6rem 0.85rem;
  font-size: 1.2rem;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;

  @media ${QUERIES.PHABLET_UP} {
    padding: 0.6rem 1.25rem;
    font-size: 1.5rem;
  }
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: color 150ms ease, border-color 150ms ease;

  &[data-state="active"] {
    color: light-dark(var(--color-orange-700), var(--color-orange-400));
    border-bottom-color: light-dark(
      var(--color-orange-700),
      var(--color-orange-400)
    );
  }

  &:hover:not([data-state="active"]) {
    color: light-dark(var(--color-grey-700), var(--color-grey-200));
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
    border-radius: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const ReadyDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: light-dark(var(--color-orange-600), var(--color-orange-400));
`;
