"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { styled } from "next-yak";
import { useEffect, useState } from "react";
import { BonsaiShop } from "@/components/bonsai/BonsaiShop";
import { GardenView } from "@/components/bonsai/GardenView";
import { InventoryPanel } from "@/components/bonsai/InventoryPanel";
import { TendingModal } from "@/components/bonsai/TendingModal";
import { TreeCollection } from "@/components/bonsai/TreeCollection";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { PageHeader, PageTitle } from "@/components/PageHeader";
import { useBonsai } from "@/lib/bonsai/context";
import type { BonsaiTree } from "@/lib/bonsai/schema";

export function BonsaiPage() {
  const { state, advanceDay } = useBonsai();
  const [tendingTreeId, setTendingTreeId] = useState<string | null>(null);

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

  const tendingTree =
    tendingTreeId !== null
      ? (state.trees.find((t) => t.id === tendingTreeId) ?? null)
      : null;

  return (
    <MaxWidthWrapper as="main">
      <PageHeader>
        <PageTitle>Bonsai Garden</PageTitle>
      </PageHeader>

      <Layout>
        <GardenView
          onOpenTree={(tree: BonsaiTree) => setTendingTreeId(tree.id)}
        />

        <PageTabs defaultValue="collection">
          <PageTabsList aria-label="Bonsai sections">
            <PageTab value="collection">Collection</PageTab>
            <PageTab value="shop">Shop</PageTab>
            <PageTab value="inventory">Inventory</PageTab>
          </PageTabsList>

          <Tabs.Content value="collection">
            <TreeCollection
              onOpenTree={(tree: BonsaiTree) => setTendingTreeId(tree.id)}
            />
          </Tabs.Content>
          <Tabs.Content value="shop">
            <BonsaiShop />
          </Tabs.Content>
          <Tabs.Content value="inventory">
            <InventoryPanel />
          </Tabs.Content>
        </PageTabs>
      </Layout>

      <TendingModal onClose={() => setTendingTreeId(null)} tree={tendingTree} />
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

const PageTabs = styled(Tabs.Root)`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const PageTabsList = styled(Tabs.List)`
  display: flex;
  border-bottom: 2px solid light-dark(var(--color-grey-200), var(--color-grey-700));
`;

const PageTab = styled(Tabs.Trigger)`
  background: none;
  border: none;
  padding: 0.6rem 1.25rem;
  font-size: 1.5rem;
  font-weight: 700;
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
