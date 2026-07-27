"use client";

import { Droplet } from "lucide-react";
import { css, keyframes, styled } from "next-yak";
import { Button } from "@/components/Button";
import { getTodayDateString } from "@/lib/date";
import { CROPS } from "@/lib/meadowmere/catalog";
import { useMeadowmere } from "@/lib/meadowmere/context";
import {
  canPlant,
  canWater,
  growthProgress,
  growthStageOf,
  harvestYield,
  isRipe,
} from "@/lib/meadowmere/farmingModule";
import type { CropId, Plot } from "@/lib/meadowmere/schema";

/** How ready-to-lift a plot looks, driving the tile's colour and border. */
function toneFor(plot: Plot, today: string): "empty" | "growing" | "ripe" {
  if (!plot.planting) return "empty";
  return isRipe(plot.planting, today) ? "ripe" : "growing";
}

export interface PlotTileProps {
  plot: Plot;
  index: number;
  /** The seed currently chosen in the seed tray, or null if none is. */
  selectedCropId: CropId | null;
}

export function PlotTile({ plot, index, selectedCropId }: PlotTileProps) {
  const { state, waterPlot, harvestPlot, plantSeed } = useMeadowmere();
  const today = getTodayDateString();
  const tone = toneFor(plot, today);
  const label = `Plot ${index + 1}`;

  if (!plot.planting) {
    const sowable =
      selectedCropId !== null && canPlant(state, plot.id, selectedCropId);
    return (
      <Tile $tone="empty">
        <PlotLabel>{label}</PlotLabel>
        <EmptyGlyph aria-hidden>🟫</EmptyGlyph>
        <Stage>Bare soil</Stage>
        <Actions>
          <Button
            disabled={!sowable}
            onClick={() =>
              selectedCropId !== null && plantSeed(plot.id, selectedCropId)
            }
            size="sm"
            variant="outline"
          >
            {selectedCropId === null
              ? "Pick a seed"
              : `Plant ${CROPS[selectedCropId].name}`}
          </Button>
        </Actions>
      </Tile>
    );
  }

  const { planting } = plot;
  const crop = CROPS[planting.cropId];
  const stage = growthStageOf(planting, today);
  const ripe = tone === "ripe";
  const waterable = canWater(planting, today);

  return (
    <Tile $tone={tone}>
      <PlotLabel>{label}</PlotLabel>
      <CropGlyph $ripe={ripe} aria-hidden>
        {crop.glyph}
      </CropGlyph>
      <CropName>{crop.name}</CropName>
      <Stage>{ripe ? "Ready to harvest" : stage}</Stage>

      {!ripe && (
        <GrowthTrack
          aria-label={`${crop.name} growth`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(growthProgress(planting, today) * 100)}
          role="progressbar"
        >
          <GrowthFill
            style={{ width: `${growthProgress(planting, today) * 100}%` }}
          />
        </GrowthTrack>
      )}

      <Yield>
        Yields {harvestYield(planting)} · watered {planting.wateredDays}×
      </Yield>

      <Actions>
        {ripe ? (
          <Button onClick={() => harvestPlot(plot.id)} size="sm">
            Harvest
          </Button>
        ) : (
          <Button
            disabled={!waterable}
            onClick={() => waterPlot(plot.id)}
            size="sm"
            variant="outline"
          >
            <Droplet aria-hidden size={13} />
            {waterable ? "Water" : "Watered"}
          </Button>
        )}
      </Actions>
    </Tile>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Tile = styled.div<{ $tone: "empty" | "growing" | "ripe" }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.75rem 0.6rem;
  border-radius: 12px;
  text-align: center;
  background: light-dark(var(--color-grey-50), var(--color-grey-800));
  border: 2px solid light-dark(var(--color-grey-200), var(--color-grey-700));

  ${({ $tone }) =>
    $tone === "ripe" &&
    css`
      background: light-dark(var(--color-orange-50), var(--color-grey-800));
      border-color: light-dark(
        var(--color-orange-500),
        var(--color-orange-400)
      );
    `}
`;

const PlotLabel = styled.span`
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
`;

const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
`;

const CropGlyph = styled.span<{ $ripe: boolean }>`
  font-size: 2rem;
  line-height: 1;

  ${({ $ripe }) =>
    $ripe &&
    css`
      animation: ${bob} 1.8s ease-in-out infinite;

      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    `}
`;

const EmptyGlyph = styled.span`
  font-size: 2rem;
  line-height: 1;
  opacity: 0.45;
`;

const CropName = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
`;

const Stage = styled.span`
  font-size: 0.78rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const GrowthTrack = styled.div`
  width: 100%;
  height: 5px;
  border-radius: 999px;
  overflow: hidden;
  background: light-dark(var(--color-grey-200), var(--color-grey-700));
`;

const GrowthFill = styled.div`
  height: 100%;
  border-radius: 999px;
  background: light-dark(var(--color-secondary-400), var(--color-secondary-400));
  transition: width 200ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Yield = styled.span`
  font-size: 0.72rem;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
`;

const Actions = styled.div`
  margin-top: 0.15rem;
`;
