"use client";

import { keyframes, styled } from "next-yak";
import { StaticTreeSVG } from "@/components/bonsai/TreeSVG";
import type { BonsaiTree, SpeciesId } from "@/lib/bonsai/schema";
import { SPECIES_CONFIG } from "@/lib/bonsai/speciesConfig";

// ─── Growth Stage Frames ──────────────────────────────────────────────────────

// Day values match the GROWTH_LABEL_THRESHOLDS in schema.ts exactly.
const STAGES = [
  { days: 0, label: "Seed" },
  { days: 3, label: "Seedling" },
  { days: 10, label: "Sapling" },
  { days: 25, label: "Young Tree" },
  { days: 50, label: "Mature Tree" },
  { days: 100, label: "Ancient Tree" },
] as const;

// Fixed tree IDs per species — deterministic shape, consistent across renders.
const TIMELAPSE_TREE_IDS: Record<SpeciesId, string> = {
  maple: "timelapse-maple",
  pine: "timelapse-pine",
  "cherry-blossom": "timelapse-cherry-blossom",
  juniper: "timelapse-juniper",
  oak: "timelapse-oak",
  wisteria: "timelapse-wisteria",
  "flame-tree": "timelapse-flame-tree",
};

function makeTimelapseTree(speciesId: SpeciesId, days: number): BonsaiTree {
  return {
    id: TIMELAPSE_TREE_IDS[speciesId],
    speciesId,
    activeDaysCount: days,
    acquiredAt: "2024-01-01",
    prunedBranches: [],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BonsaiTimelapse({ speciesId }: { speciesId: SpeciesId }) {
  const speciesLabel = SPECIES_CONFIG[speciesId].label;
  return (
    <Wrapper data-light-mode="true">
      <FrameStack
        aria-label={`${speciesLabel} bonsai growing from seed to ancient tree`}
        role="img"
      >
        {STAGES.map(({ days }, i) => (
          <Frame $index={i} data-frame={i} key={days}>
            <StaticTreeSVG
              cropTop
              style={{ width: "auto", height: "100%", maxWidth: "100%" }}
              tree={makeTimelapseTree(speciesId, days)}
            />
          </Frame>
        ))}
      </FrameStack>
      <CaptionTrack aria-hidden="true">
        {STAGES.map(({ label }, i) => (
          <Caption $index={i} data-frame={i} key={label}>
            {label}
          </Caption>
        ))}
      </CaptionTrack>
    </Wrapper>
  );
}

// ─── Animation ────────────────────────────────────────────────────────────────

// Each frame is visible for 1/FRAME_COUNT of the cycle (~16.67%).
// Fast fade in at start (0.67%), hold, fast fade out before next frame.
// Percentages are pre-computed: frameDurationPct=16.67%, *0.04=0.67%, *0.82=13.67%, *0.98=16.33%
const showFrame = keyframes`
  0%      { opacity: 0; }
  0.67%   { opacity: 1; }
  13.67%  { opacity: 1; }
  16.33%  { opacity: 0; }
  100%    { opacity: 0; }
`;

// ─── Styles ───────────────────────────────────────────────────────────────────

/** Forces light mode throughout the timelapse, regardless of system preference. */
const Wrapper = styled.div`
  color-scheme: light;
  background: oklch(97% 0.005 120);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem 1rem;
  width: 100%;
  height: 100%;
`;

const FrameStack = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
`;

const Frame = styled.div<{ $index: number }>`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  animation: ${showFrame} 12s ease-in-out infinite;
  animation-delay: calc(${(p) => p.$index} * 2s);
  /* both: frame 0 starts visible; backwards: delay frames start hidden */
  animation-fill-mode: both;

  @media (prefers-reduced-motion: reduce) {
    display: none;
    animation: none;

    &[data-frame="5"] {
      display: flex;
      opacity: 1;
    }
  }
`;

const CaptionTrack = styled.div`
  position: relative;
  height: 1.4rem;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Caption = styled.span<{ $index: number }>`
  position: absolute;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: oklch(45% 0.08 130);
  opacity: 0;
  animation: ${showFrame} 12s ease-in-out infinite;
  animation-delay: calc(${(p) => p.$index} * 2s);
  animation-fill-mode: both;

  @media (prefers-reduced-motion: reduce) {
    display: none;
    animation: none;

    &[data-frame="5"] {
      display: block;
      opacity: 1;
    }
  }
`;
