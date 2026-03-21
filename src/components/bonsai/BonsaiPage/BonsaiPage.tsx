"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { styled } from "next-yak";
import { BonsaiShop } from "@/components/bonsai/BonsaiShop";
import { InventoryPanel } from "@/components/bonsai/InventoryPanel";
import { TreeCollection } from "@/components/bonsai/TreeCollection";
import { TreeView } from "@/components/bonsai/TreeView";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { PageHeader, PageTitle } from "@/components/PageHeader";
import { useBonsai } from "@/lib/bonsai/context";
import { QUERIES } from "@/lib/constants";

export function BonsaiPage() {
  const { activePlantedTree, advanceDay } = useBonsai();

  return (
    <MaxWidthWrapper as="main">
      <PageHeader>
        <PageTitle>Bonsai Garden</PageTitle>
        <AdvanceDayButton
          onClick={advanceDay}
          title="Advance the active tree by one day"
          type="button"
        >
          ⏩ Advance Day
        </AdvanceDayButton>
      </PageHeader>

      <Layout>
        <LeftColumn>
          <TreeView tree={activePlantedTree} />
        </LeftColumn>

        <RightColumn>
          <PageTabs defaultValue="shop">
            <PageTabsList aria-label="Bonsai sections">
              <PageTab value="shop">Shop</PageTab>
              <PageTab value="collection">Collection</PageTab>
              <PageTab value="inventory">Inventory</PageTab>
            </PageTabsList>

            <Tabs.Content value="shop">
              <BonsaiShop />
            </Tabs.Content>
            <Tabs.Content value="collection">
              <TreeCollection />
            </Tabs.Content>
            <Tabs.Content value="inventory">
              <InventoryPanel />
            </Tabs.Content>
          </PageTabs>
        </RightColumn>
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

  @media (${QUERIES.TABLET_UP}) {
    flex-direction: row;
    align-items: flex-start;
    gap: 2rem;
  }
`;

const LeftColumn = styled.div`
  display: flex;
  justify-content: center;

  @media (${QUERIES.TABLET_UP}) {
    flex: 1 1 0;
  }

  @media (${QUERIES.DESKTOP_UP}) {
    position: sticky;
    top: 2rem;
  }
`;

const RightColumn = styled.div`
  flex: 1 1 0;
  min-width: 0;
`;

const AdvanceDayButton = styled.button`
  background: none;
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  border-radius: 6px;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.4rem 0.75rem;
  transition: border-color 150ms ease, color 150ms ease;

  &:hover {
    border-color: light-dark(var(--color-primary-400), var(--color-primary-500));
    color: light-dark(var(--color-primary-600), var(--color-primary-400));
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
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
