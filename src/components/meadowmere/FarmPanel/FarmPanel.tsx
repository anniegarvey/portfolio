"use client";

import { Coins } from "lucide-react";
import { styled } from "next-yak";
import { useId, useState } from "react";
import { Button } from "@/components/Button";
import { PlotTile } from "@/components/meadowmere/PlotTile";
import { ALL_CROP_IDS, CROPS } from "@/lib/meadowmere/catalog";
import { useMeadowmere } from "@/lib/meadowmere/context";
import { seedCount } from "@/lib/meadowmere/inventory";
import type { CropId } from "@/lib/meadowmere/schema";
import { usePoints } from "@/lib/points/context";

export function FarmPanel() {
  const { state, buySeed } = useMeadowmere();
  const { points } = usePoints();
  const [selectedCropId, setSelectedCropId] = useState<CropId | null>(null);
  const trayHeadingId = useId();
  const plotsHeadingId = useId();
  const shopHeadingId = useId();

  const unlocked = ALL_CROP_IDS.filter((id) =>
    state.unlockedCropIds.includes(id),
  );

  return (
    <Panel>
      <Section aria-labelledby={trayHeadingId}>
        <SectionTitle id={trayHeadingId}>Seed tray</SectionTitle>
        <Hint>Choose a seed, then plant it in any bare plot.</Hint>
        {unlocked.length === 0 ? (
          <Empty>No seeds yet.</Empty>
        ) : (
          <Tray>
            {unlocked.map((cropId) => {
              const count = seedCount(state, cropId);
              const selected = selectedCropId === cropId;
              return (
                <SeedChip
                  aria-label={`${CROPS[cropId].name}, ${count} ${
                    count === 1 ? "seed" : "seeds"
                  }`}
                  aria-pressed={selected}
                  disabled={count === 0}
                  key={cropId}
                  onClick={() => setSelectedCropId(selected ? null : cropId)}
                  type="button"
                >
                  <ChipGlyph aria-hidden>{CROPS[cropId].glyph}</ChipGlyph>
                  <ChipName>{CROPS[cropId].name}</ChipName>
                  <ChipCount>×{count}</ChipCount>
                </SeedChip>
              );
            })}
          </Tray>
        )}
      </Section>

      <Section aria-labelledby={plotsHeadingId}>
        <SectionTitle id={plotsHeadingId}>Plots</SectionTitle>
        <PlotGrid>
          {state.plots.map((plot, index) => (
            <PlotTile
              index={index}
              key={plot.id}
              plot={plot}
              selectedCropId={selectedCropId}
            />
          ))}
        </PlotGrid>
      </Section>

      <Section aria-labelledby={shopHeadingId}>
        <SectionTitle id={shopHeadingId}>Seed shop</SectionTitle>
        <Hint>
          Seeds are bought with points earned in the Energy Planner. Nothing
          here pays points back — the farm is somewhere to spend them.
        </Hint>
        <ShopGrid>
          {ALL_CROP_IDS.map((cropId) => {
            const crop = CROPS[cropId];
            const locked = !state.unlockedCropIds.includes(cropId);
            return (
              <ShopItem key={cropId}>
                <ShopName>
                  <span aria-hidden>{crop.glyph}</span> {crop.name}
                </ShopName>
                <ShopMeta>
                  {crop.daysToMature} days · yields {crop.baseYield}+
                </ShopMeta>
                <ShopBlurb>{crop.blurb}</ShopBlurb>
                {locked ? (
                  <ShopMeta>Locked — earned through a quest.</ShopMeta>
                ) : (
                  <Button
                    disabled={points < crop.seedCost}
                    onClick={() => buySeed(cropId)}
                    size="sm"
                    variant="outline"
                  >
                    Buy seed <Coins aria-hidden size={13} /> {crop.seedCost}
                  </Button>
                )}
              </ShopItem>
            );
          })}
        </ShopGrid>
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

const Tray = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SeedChip = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  background: light-dark(var(--color-grey-50), var(--color-grey-800));
  border: 2px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  color: inherit;
  transition: border-color 150ms ease, background 150ms ease;

  &[aria-pressed="true"] {
    border-color: light-dark(var(--color-orange-500), var(--color-orange-400));
    background: light-dark(var(--color-orange-50), var(--color-grey-700));
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const ChipGlyph = styled.span`
  font-size: 1.1rem;
  line-height: 1;
`;

const ChipName = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
`;

const ChipCount = styled.span`
  font-size: 0.8rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const PlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
`;

const ShopGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 0.75rem;
`;

const ShopItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  padding: 0.75rem;
  border-radius: 10px;
  background: light-dark(var(--color-grey-50), var(--color-grey-800));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
`;

const ShopName = styled.span`
  font-weight: 600;
  font-size: 0.95rem;
`;

const ShopMeta = styled.span`
  font-size: 0.8rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const ShopBlurb = styled.span`
  font-size: 0.8rem;
  font-style: italic;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;
