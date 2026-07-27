"use client";

import { styled } from "next-yak";
import { useId } from "react";
import { Button } from "@/components/Button";
import { ALL_SITE_IDS, ITEMS, SITES } from "@/lib/meadowmere/catalog";
import { useMeadowmere } from "@/lib/meadowmere/context";
import { canForage, foragesLeft } from "@/lib/meadowmere/foragingModule";

export function WildsPanel() {
  const { state, notice, forage } = useMeadowmere();
  const sitesHeadingId = useId();
  const larderHeadingId = useId();
  const left = foragesLeft(state);

  const larder = Object.entries(state.inventory)
    .filter(([, count]) => count > 0)
    .map(([itemId, count]) => ({
      item: ITEMS[itemId as keyof typeof ITEMS],
      count,
    }));

  return (
    <Panel>
      <Section aria-labelledby={sitesHeadingId}>
        <SectionTitle id={sitesHeadingId}>The wilds</SectionTitle>
        <Hint>
          {left > 0
            ? `${left} forage ${left === 1 ? "trip" : "trips"} left today.`
            : "You’re out of forage trips — more tomorrow."}
        </Hint>

        <SiteGrid>
          {ALL_SITE_IDS.map((siteId) => {
            const site = SITES[siteId];
            const unlocked = state.unlockedSiteIds.includes(siteId);
            return (
              <SiteCard key={siteId}>
                <SiteGlyph aria-hidden>{site.glyph}</SiteGlyph>
                <SiteName>{site.name}</SiteName>
                <SiteBlurb>{site.blurb}</SiteBlurb>
                {unlocked ? (
                  <>
                    <SiteMeta>
                      {site.materials.map((id) => ITEMS[id].name).join(", ")}
                    </SiteMeta>
                    <Button
                      disabled={!canForage(state, siteId)}
                      onClick={() => forage(siteId)}
                      size="sm"
                    >
                      Forage
                    </Button>
                  </>
                ) : (
                  <SiteMeta>
                    Locked — a neighbour will show you the way.
                  </SiteMeta>
                )}
              </SiteCard>
            );
          })}
        </SiteGrid>

        <ForageResult aria-atomic="true" aria-live="polite">
          {notice?.kind === "forage"
            ? `Foraged ${notice.amount} × ${ITEMS[notice.itemId].name} at ${SITES[notice.siteId].name}.`
            : ""}
        </ForageResult>
      </Section>

      <Section aria-labelledby={larderHeadingId}>
        <SectionTitle id={larderHeadingId}>Larder</SectionTitle>
        {larder.length === 0 ? (
          <Empty>
            Nothing in the larder yet — harvest or forage something.
          </Empty>
        ) : (
          <LarderGrid>
            {larder.map(({ item, count }) => (
              <LarderItem key={item.id}>
                <span aria-hidden>{item.glyph}</span> {item.name} ×{count}
              </LarderItem>
            ))}
          </LarderGrid>
        )}
      </Section>
    </Panel>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
`;

const Hint = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const Empty = styled.p`
  margin: 0;
  font-style: italic;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const SiteGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
`;

const SiteCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  padding: 0.9rem;
  border-radius: 12px;
  background: light-dark(var(--color-grey-50), var(--color-grey-800));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
`;

const SiteGlyph = styled.span`
  font-size: 1.8rem;
  line-height: 1;
`;

const SiteName = styled.span`
  font-weight: 700;
  font-size: 1rem;
`;

const SiteBlurb = styled.span`
  font-size: 0.83rem;
  font-style: italic;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const SiteMeta = styled.span`
  font-size: 0.8rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const ForageResult = styled.p`
  margin: 0;
  min-height: 1.3rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: light-dark(var(--color-secondary-700), var(--color-secondary-300));
`;

const LarderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
`;

const LarderItem = styled.span`
  padding: 0.45rem 0.6rem;
  border-radius: 8px;
  font-size: 0.88rem;
  background: light-dark(var(--color-grey-50), var(--color-grey-800));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
`;
