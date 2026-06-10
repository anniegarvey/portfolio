"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { styled } from "next-yak";
import { useEffect, useId } from "react";
import { CollectionPanel } from "@/components/glade/CollectionPanel";
import { GladeScene } from "@/components/glade/GladeScene";
import { KitchenPanel } from "@/components/glade/KitchenPanel";
import { SkillsPanel } from "@/components/glade/SkillsPanel";
import { VisitorCard } from "@/components/glade/VisitorCard";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { PageHeader, PageTitle } from "@/components/PageHeader";
import { QUERIES } from "@/lib/constants";
import { useGlade } from "@/lib/glade/context";

export function GladePage() {
  const { state, advanceDay } = useGlade();
  const visitorsHeadingId = useId();

  // Same dev shortcut as the Bonsai Garden: "d" ticks the day forward.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (
        e.target instanceof HTMLElement &&
        (e.target.matches("input, textarea, select") ||
          e.target.isContentEditable)
      )
        return;
      if (e.key.toLowerCase() === "d") advanceDay();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [advanceDay]);

  return (
    <MaxWidthWrapper as="main">
      <PageHeader>
        <PageTitle>Creature Glade</PageTitle>
      </PageHeader>

      <Layout>
        <GladeScene />

        <section aria-labelledby={visitorsHeadingId}>
          <SectionTitle id={visitorsHeadingId}>Wild visitors</SectionTitle>
          {state.visitors.length === 0 ? (
            <EmptyVisitors>
              No wild creatures right now — someone new may wander in tomorrow.
            </EmptyVisitors>
          ) : (
            <VisitorGrid>
              {state.visitors.map((visitor) => (
                <VisitorCard key={visitor.id} visitor={visitor} />
              ))}
            </VisitorGrid>
          )}
        </section>

        <PageTabs defaultValue="kitchen">
          <PageTabsList aria-label="Glade sections">
            <PageTab value="kitchen">Kitchen</PageTab>
            <PageTab value="skills">Skills</PageTab>
            <PageTab value="collection">Collection</PageTab>
          </PageTabsList>

          <Tabs.Content value="kitchen">
            <KitchenPanel />
          </Tabs.Content>
          <Tabs.Content value="skills">
            <SkillsPanel />
          </Tabs.Content>
          <Tabs.Content value="collection">
            <CollectionPanel />
          </Tabs.Content>
        </PageTabs>
      </Layout>
    </MaxWidthWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  margin: 0 0 0.75rem;
  font-size: 1.5rem;
`;

const EmptyVisitors = styled.p`
  margin: 0;
  font-style: italic;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const VisitorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
`;

const PageTabs = styled(Tabs.Root)`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const PageTabsList = styled(Tabs.List)`
  display: flex;
  border-bottom: 2px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  overflow-x: auto;
  overflow-y: hidden;
`;

const PageTab = styled(Tabs.Trigger)`
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
    color: light-dark(var(--color-primary-600), var(--color-primary-400));
    border-bottom-color: light-dark(var(--color-primary-600), var(--color-primary-400));
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
