"use client";

import { styled } from "next-yak";
import { FarmerSVG } from "@/components/meadowmere/ValeArt/FarmerSVG";
import {
  CottageArt,
  PlotArt,
  SiteArt,
  StallArt,
} from "@/components/meadowmere/ValeArt/FeatureArt";
import { TerrainLayer } from "@/components/meadowmere/ValeArt/TerrainLayer";
import { growthStageOf } from "@/lib/meadowmere/farmingModule";
import type { Interaction } from "@/lib/meadowmere/interaction";
import { interactionFor } from "@/lib/meadowmere/interaction";
import type { FarmerPose } from "@/lib/meadowmere/movement";
import type { CropId, MeadowmereState } from "@/lib/meadowmere/schema";
import type { Feature } from "@/lib/meadowmere/valeMap";
import {
  fallowPlotTiles,
  TILE_SIZE,
  VALE_HEIGHT,
  VALE_WIDTH,
  valeFeatures,
} from "@/lib/meadowmere/valeMap";

/**
 * The Vale, drawn. Everything visible is derived from game state and the
 * farmer's pose — the scene holds no state of its own.
 *
 * Each feature carries a real, transparent button laid over its tile, so the
 * map is reachable by pointer and by Tab as well as by walking. Activating one
 * is the same event either way: the world walks the farmer there and acts.
 */

const SCENE_WIDTH = VALE_WIDTH * TILE_SIZE;
const SCENE_HEIGHT = VALE_HEIGHT * TILE_SIZE;

/** Percentage geometry for a tile, so hotspots track the SVG as it scales. */
function tileBox(x: number, y: number) {
  return {
    left: `${(x / VALE_WIDTH) * 100}%`,
    top: `${(y / VALE_HEIGHT) * 100}%`,
    width: `${(1 / VALE_WIDTH) * 100}%`,
    height: `${(1 / VALE_HEIGHT) * 100}%`,
  };
}

function FeatureBody({
  feature,
  state,
  today,
}: {
  feature: Feature;
  state: MeadowmereState;
  today: string;
  // Annotated so a new Feature kind fails the build here rather than silently
  // rendering nothing.
}): React.JSX.Element {
  switch (feature.kind) {
    case "plot": {
      const { planting } = state.plots[feature.index];
      return (
        <PlotArt
          cropId={planting?.cropId ?? null}
          stage={planting ? growthStageOf(planting, today) : null}
          wateredToday={planting?.lastWateredDate === today}
        />
      );
    }
    case "site":
      return (
        <SiteArt
          locked={!state.unlockedSiteIds.includes(feature.siteId)}
          siteId={feature.siteId}
        />
      );
    case "cottage":
      return <CottageArt neighbourId={feature.neighbourId} />;
    case "stall":
      return <StallArt />;
  }
}

export interface ValeSceneProps {
  state: MeadowmereState;
  pose: FarmerPose;
  walking: boolean;
  selectedCropId: CropId | null;
  today: string;
  /** Fired by clicking or activating a feature's button. */
  onActivateFeature: (feature: Feature) => void;
  /**
   * The interaction the keyboard has landed on, or null when focus leaves the
   * map. A hotspot's label is invisible by design, so this is how a sighted
   * keyboard player learns what the tile they have tabbed to would do.
   */
  onFocusFeature: (interaction: Interaction | null) => void;
}

export function ValeScene({
  state,
  pose,
  walking,
  selectedCropId,
  today,
  onActivateFeature,
  onFocusFeature,
}: ValeSceneProps) {
  const features = valeFeatures(state);
  // Painted back to front, so a cottage roof overlaps the grass behind it.
  const sorted = [...features].sort((a, b) => a.y - b.y);

  return (
    <Stage>
      <Canvas
        aria-hidden
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
      >
        <TerrainLayer />
        {fallowPlotTiles(state).map((tile) => (
          <g
            key={`fallow-${tile.x}-${tile.y}`}
            transform={`translate(${tile.x * TILE_SIZE} ${tile.y * TILE_SIZE})`}
          >
            <rect
              fill="var(--vale-fallow)"
              height="22"
              rx="3"
              width="24"
              x="4"
              y="6"
            />
          </g>
        ))}
        {sorted.map((feature) => (
          <g
            key={`${feature.kind}-${feature.x}-${feature.y}`}
            transform={`translate(${feature.x * TILE_SIZE} ${feature.y * TILE_SIZE})`}
          >
            <FeatureBody feature={feature} state={state} today={today} />
          </g>
        ))}

        {/*
          Drawn last, so the farmer is never hidden by scenery. Positioned with
          a CSS transform rather than the transform attribute so a step can be
          eased; the node keeps its place in the tree, so the transition
          survives every move.
        */}
        <Farmer
          style={{
            transform: `translate(${pose.x * TILE_SIZE}px, ${pose.y * TILE_SIZE - 6}px)`,
          }}
        >
          <FarmerSVG facing={pose.facing} walking={walking} />
        </Farmer>
      </Canvas>

      <Hotspots>
        {features.map((feature) => {
          const interaction = interactionFor(
            state,
            feature,
            selectedCropId,
            today,
          );
          return (
            <Hotspot
              key={`${feature.kind}-${feature.x}-${feature.y}`}
              onBlur={() => onFocusFeature(null)}
              onClick={() => onActivateFeature(feature)}
              onFocus={() => onFocusFeature(interaction)}
              style={tileBox(feature.x, feature.y)}
              type="button"
            >
              {interaction.label}
            </Hotspot>
          );
        })}
      </Hotspots>
    </Stage>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Stage = styled.div`
  position: relative;
  width: 100%;
  /* The grid is 16 tiles by 12 — kept in step by valeMap.test.ts. */
  aspect-ratio: 4 / 3;

  /* One palette for every shape in the scene, so the valley shifts to dusk in
     dark mode without a second set of drawings. */
  --vale-grass: light-dark(#93c26d, #46653f);
  --vale-grass-alt: light-dark(#7fb35c, #3a5636);
  --vale-path: light-dark(#dcc79f, #6f6047);
  --vale-path-grit: light-dark(#c8ae82, #5d5039);
  --vale-water: light-dark(#7ec8e3, #2d566d);
  --vale-water-glint: light-dark(#b6e4f2, #47788f);
  --vale-hedge: light-dark(#3f7a3d, #24422a);
  --vale-hedge-lit: light-dark(#519349, #2e5433);
  --vale-rock: light-dark(#a8a49c, #565349);
  --vale-rock-lit: light-dark(#c2beb5, #6a665c);
  --vale-soil: light-dark(#9b7350, #4f3a29);
  --vale-soil-dark: light-dark(#7a5739, #3a2a1d);
  --vale-fallow: light-dark(#8aab68, #3d5738);

  /* Buildings get their own dusk values rather than staying daylight-bright
     against a darkened valley. The farmer keeps fixed colours: the one thing
     that should never recede is the character you are steering. */
  --vale-farmhouse-wall: light-dark(#d8c39c, #7b6a4e);
  --vale-farmhouse-roof: light-dark(#a9553f, #6d3628);
  --vale-farmhouse-roof-lit: light-dark(#bd6349, #7d4231);
  --vale-window: light-dark(#8fc4d8, #d9b25a);
  --vale-door: light-dark(#6d4c41, #47301f);
  --vale-chimney: light-dark(#8a7f6d, #5b5346);

  --vale-nessa-wall: light-dark(#e0cfae, #82755c);
  --vale-nessa-roof: light-dark(#b5583f, #71382a);
  --vale-nessa-roof-lit: light-dark(#c96a4d, #874536);
  --vale-bram-wall: light-dark(#b58a5e, #6b5238);
  --vale-bram-roof: light-dark(#5f6f4a, #3c4730);
  --vale-bram-roof-lit: light-dark(#71835a, #4a5a3c);
  --vale-marigold-wall: light-dark(#dcd0e2, #766a80);
  --vale-marigold-roof: light-dark(#7a6a9c, #4c4265);
  --vale-marigold-roof-lit: light-dark(#8f7fb0, #5d5178);

  --vale-stall-post: light-dark(#7a5a3a, #4e3a25);
  --vale-stall-counter: light-dark(#a9814f, #6b5233);
  --vale-stall-awning: light-dark(#c2703f, #7d4728);
  --vale-stall-cloth: light-dark(#f0e3c8, #9b917e);

  /* Foliage, the same reasoning as the buildings. Ripe crops keep their vivid
     catalog colours in both themes — a ready harvest is the thing the player
     is scanning the farm for. */
  --vale-leaf: light-dark(#5d9c4a, #3f6b36);
  --vale-leaf-dark: light-dark(#3f7a34, #2c5227);
  --vale-stem: light-dark(#4a8038, #34592a);
  --vale-bark: light-dark(#6b4a30, #45301f);
  --vale-canopy: light-dark(#2f6b3a, #1f4526);
  --vale-canopy-lit: light-dark(#3f7f46, #2a5730);
  --vale-reed: light-dark(#7fa650, #4f6a35);
  --vale-clay: light-dark(#b08968, #6f5642);
  --vale-clay-lit: light-dark(#c49a76, #806450);
`;

/**
 * Eased rather than snapped, so an auto-walk reads as walking. The world drives
 * this one tile at a time; the game state has already moved on.
 */
const Farmer = styled.g`
  transition: transform 90ms linear;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Canvas = styled.svg`
  display: block;
  width: 100%;
  height: 100%;
`;

const Hotspots = styled.div`
  position: absolute;
  inset: 0;
`;

/**
 * Invisible until focused or hovered: the art already says what is there, so
 * the button only needs to announce itself to assistive tech and show where
 * keyboard focus has landed.
 */
const Hotspot = styled.button`
  position: absolute;
  /* The primary control of the game, tapped over and over on a phone — without
     this every tap waits out the double-tap-to-zoom delay. */
  touch-action: manipulation;
  padding: 0;
  background: none;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0;
  color: transparent;

  &:hover {
    border-color: light-dark(rgb(255 255 255 / 0.75), rgb(255 255 255 / 0.5));
    background: rgb(255 255 255 / 0.12);
  }

  &:focus-visible {
    outline: 3px solid var(--color-primary-400);
    outline-offset: 2px;
  }
`;
