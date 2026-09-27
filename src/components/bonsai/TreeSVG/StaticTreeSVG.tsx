"use client";

import { keyframes, styled } from "next-yak";
import type React from "react";
import { useMemo } from "react";
import type { BonsaiTree } from "@/lib/bonsai/schema";
import { parsePotId, parseStandId } from "@/lib/bonsai/schema";
import {
  type LeafShape,
  SPECIES_CONFIG,
  type SpeciesConfig,
} from "@/lib/bonsai/speciesConfig";
import {
  generateTree,
  type Leaf,
  type TreeSVGData,
} from "@/lib/bonsai/treeGenerator";
import { clamp } from "@/lib/bonsai/treeGenerator.math";
import {
  FLOWER_TEMPLATES,
  leavesPathData,
  silhouettesPathData,
} from "./leafShapes";

// ─── Seed / Sprout Stage ──────────────────────────────────────────────────────

/**
 * Seed leaves as each species actually germinates, fanned from the stem top:
 * angles in degrees from straight up, length and width at full size. A pine
 * opens a ring of needle-like cotyledons, a juniper a narrow pair, a maple
 * two long straps, a wisteria two fleshy rounds. An oak keeps its
 * cotyledons in the acorn underground, so its first leaves are true ones.
 */
const COTYLEDONS: Record<
  LeafShape,
  { angles: number[]; length: number; width: number }
> = {
  needle: { angles: [-75, -50, -25, 0, 25, 50, 75], length: 5, width: 0.6 },
  scale: { angles: [-35, 35], length: 5, width: 0.8 },
  palmate: { angles: [-72, 72], length: 7.5, width: 1.7 },
  blossom: { angles: [-62, 62], length: 6, width: 3.2 },
  ovate: { angles: [-62, 62], length: 6, width: 3.2 },
  lobed: { angles: [], length: 0, width: 0 },
  pinnate: { angles: [-60, 60], length: 4.5, width: 3.8 },
  bipinnate: { angles: [-65, 65], length: 5.5, width: 3 },
};

function SeedSprout({
  day,
  cx,
  baseY,
  foliageColor,
  leafShape,
}: {
  day: number;
  cx: number;
  baseY: number;
  foliageColor: string;
  leafShape: LeafShape;
}) {
  const seedFade = Math.max(0, 1 - day / 5);
  const crackOpen = clamp(day / 2, 0, 1);
  const stemGrow = clamp((day - 0.5) / 3, 0, 1);
  const leavesGrow = clamp((day - 1) / 3, 0, 1);

  const seedRx = 10;
  const seedRy = 7;
  const seedY = baseY - seedRy;

  const crackDepth = seedRy * 0.6 * crackOpen;
  const crackWidth = seedRx * 0.18 * crackOpen;
  const stemTop = seedY - stemGrow * 22;
  const cotyledons = COTYLEDONS[leafShape];

  if (seedFade <= 0 && stemGrow <= 0) return null;

  return (
    <g>
      {seedFade > 0 && (
        <g opacity={seedFade}>
          <path
            d={`M ${cx} ${seedY - seedRy}
                C ${cx - seedRx * 1.1} ${seedY - seedRy * 0.5},
                  ${cx - seedRx * 0.9} ${seedY + seedRy * 0.5},
                  ${cx} ${seedY + seedRy}
                C ${cx - seedRx * 0.3} ${seedY + seedRy},
                  ${cx - crackWidth} ${seedY},
                  ${cx} ${seedY - crackDepth}`}
            fill="#8b6635"
          />
          <path
            d={`M ${cx} ${seedY - seedRy}
                C ${cx + seedRx * 1.1} ${seedY - seedRy * 0.5},
                  ${cx + seedRx * 0.9} ${seedY + seedRy * 0.5},
                  ${cx} ${seedY + seedRy}
                C ${cx + seedRx * 0.3} ${seedY + seedRy},
                  ${cx + crackWidth} ${seedY},
                  ${cx} ${seedY - crackDepth}`}
            fill="#a07840"
          />
          <ellipse
            cx={cx - 3}
            cy={seedY - 2}
            fill="rgba(255,255,255,0.18)"
            rx={3}
            ry={2}
          />
        </g>
      )}
      {stemGrow > 0 && (
        <line
          opacity={Math.min(stemGrow * 2, 1)}
          stroke="#5a7a3a"
          strokeLinecap="round"
          strokeWidth={1.5}
          x1={cx}
          x2={cx}
          y1={seedY - crackDepth * seedFade}
          y2={stemTop}
        />
      )}
      {leavesGrow > 0 && (
        <g fill={foliageColor} opacity={Math.min(leavesGrow * 1.5, 1)}>
          {cotyledons.angles.map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const half = (cotyledons.length * leavesGrow) / 2;
            const x = cx + Math.sin(rad) * half;
            const y = stemTop - Math.cos(rad) * half;
            return (
              <ellipse
                cx={x}
                cy={y}
                key={deg}
                rx={(cotyledons.width * leavesGrow) / 2}
                ry={half}
                transform={`rotate(${deg} ${x} ${y})`}
              />
            );
          })}
        </g>
      )}
    </g>
  );
}

// ─── Depth Tinting ────────────────────────────────────────────────────────────

/** Lerp two hex colours by factor t ∈ [0, 1]. Returns `a` for t ≤ 0. */
function lerpHexColor(a: string, b: string, t: number): string {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const rr = Math.round(ar + (br - ar) * t)
    .toString(16)
    .padStart(2, "0");
  const rg = Math.round(ag + (bg - ag) * t)
    .toString(16)
    .padStart(2, "0");
  const rb = Math.round(ab + (bb - ab) * t)
    .toString(16)
    .padStart(2, "0");
  return `#${rr}${rg}${rb}`;
}

/** Multiplies an RGB hex colour by `factor` (≈0.6 = darker shadow, ≈1.2 = lighter
 *  highlight). Used to derive tint endpoints from the species' base colour
 *  without requiring extra config fields. */
function shadeHexColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r * factor)
    .toString(16)
    .padStart(2, "0")}${clamp(g * factor)
    .toString(16)
    .padStart(2, "0")}${clamp(b * factor)
    .toString(16)
    .padStart(2, "0")}`;
}

/**
 * Returns the leaf fill colour for a branch at z-depth `z`, given the full
 * z-range of the tree. Linearly interpolates between a darkened
 * foliageColor (far) and the species' foliageColorLight (near) across the
 * full tree depth — full range, not capped, so the shadow → highlight
 * gradient is visible across overlapping foliage.
 *
 * When zRange < 1e-6 (all-flat tree, e.g. a young sapling with branches in
 * the picture plane only) returns foliageColor unchanged.
 */
function depthTintedColor(
  z: number,
  zMin: number,
  zRange: number,
  foliageColor: string,
  foliageColorLight: string,
): string {
  if (zRange < 1e-6) return foliageColor;
  const zNorm = (z - zMin) / zRange; // 0 = farthest, 1 = nearest viewer
  // Anchor the far end at a shaded version of foliageColor so back leaves
  // recede visibly. Front uses the species' lighter highlight unchanged.
  const farTone = shadeHexColor(foliageColor, 0.7);
  return lerpHexColor(farTone, foliageColorLight, zNorm);
}

/** Branch (wood) fill colour for the same z-based gradient as the foliage
 *  tint — keeps the trunk bark feeling consistent with the canopy. */
function depthTintedTrunkColor(
  z: number,
  zMin: number,
  zRange: number,
  trunkColor: string,
): string {
  if (zRange < 1e-6) return trunkColor;
  const zNorm = (z - zMin) / zRange;
  // Narrower brightness band on the wood than the leaves — bark always
  // reads as one species across depth, just shaded.
  const farTone = shadeHexColor(trunkColor, 0.75);
  const nearTone = shadeHexColor(trunkColor, 1.15);
  return lerpHexColor(farTone, nearTone, zNorm);
}

/** Computes z-depth bounds for a branch list in a single pass. */
function branchZBounds(branches: { z: number }[]): {
  zMin: number;
  zRange: number;
} {
  let zMin = 0;
  let zMax = 0;
  for (const b of branches) {
    if (b.z < zMin) zMin = b.z;
    if (b.z > zMax) zMax = b.z;
  }
  return { zMin, zRange: zMax - zMin };
}

/** The leaves a species wears at `day`: its juvenile foliage, if it has one,
 *  until it reaches flowering age; its crown foliage after. */
function foliageAt(config: SpeciesConfig, day: number) {
  const young = day < (config.flowers?.floweringAge ?? 0);
  return (young && config.juvenileFoliage) || config;
}

// ─── Foliage Layer ────────────────────────────────────────────────────────────

/** Depth bands the foliage is split into — one <path> (one colour) each. */
const FOLIAGE_BANDS = 6;

/**
 * Draws the depth-sorted foliage as one path per depth band, back to front.
 * Each band takes the depth tint at its middle, so the crown keeps its
 * shadow-to-highlight gradient while a mature tree costs six nodes of
 * foliage instead of thousands.
 */
function FoliageLayer({
  leaves,
  shape,
  foliageColor,
  foliageColorLight,
}: {
  leaves: { leaf: Leaf; absoluteZ: number }[];
  shape: LeafShape;
  foliageColor: string;
  foliageColorLight: string;
}) {
  const { zMin, zRange } = branchZBounds(
    leaves.map((e) => ({ z: e.absoluteZ })),
  );
  const bands: Leaf[][] = Array.from({ length: FOLIAGE_BANDS }, () => []);
  for (const { leaf, absoluteZ } of leaves) {
    const t = zRange < 1e-6 ? 0 : (absoluteZ - zMin) / zRange;
    bands[Math.min(FOLIAGE_BANDS - 1, Math.floor(t * FOLIAGE_BANDS))].push(
      leaf,
    );
  }
  return (
    <g className="foliage">
      {bands.map((band, i) =>
        band.length === 0 ? null : (
          <path
            d={leavesPathData(band, shape)}
            fill={depthTintedColor(
              zMin + ((i + 0.5) / FOLIAGE_BANDS) * zRange,
              zMin,
              zRange,
              foliageColor,
              foliageColorLight,
            )}
            // biome-ignore lint/suspicious/noArrayIndexKey: bands are fixed depth slots
            key={i}
          />
        ),
      )}
    </g>
  );
}

/**
 * Flattens every leaf from every branch (and the apex cluster) into one list,
 * tagged with each leaf's absolute z-depth (`branch.z + leaf.z`), then sorts
 * back-to-front so the renderer can globally depth-sort the foliage layer —
 * front pads overpaint rear pads regardless of which branch they sit on.
 */
function collectGlobalLeaves(
  branches: { z: number; leaves: Leaf[] }[],
  apexLeaves: Leaf[],
): { leaf: Leaf; absoluteZ: number }[] {
  const out: { leaf: Leaf; absoluteZ: number }[] = [];
  for (const branch of branches) {
    for (const leaf of branch.leaves) {
      out.push({ leaf, absoluteZ: branch.z + leaf.z });
    }
  }
  // Apex cluster centres on the trunk top — z origin is 0 there.
  for (const leaf of apexLeaves) {
    out.push({ leaf, absoluteZ: leaf.z });
  }
  out.sort((a, b) => a.absoluteZ - b.absoluteZ);
  return out;
}

// ─── Flower Renderer ──────────────────────────────────────────────────────────

import type { FlowerSpec } from "@/lib/bonsai/speciesConfig";
import type { Flower } from "@/lib/bonsai/treeGenerator";

/**
 * Every flower on the tree as at most two paths: the silhouettes in the
 * flower colour, then their accents (a sakura's eye, a samara's seed) on top.
 * All flowers share one progress, so one opacity covers the layer.
 */
function FlowerLayer({
  flowers,
  flowerSpec,
}: {
  flowers: Flower[];
  flowerSpec: FlowerSpec | undefined;
}) {
  if (!flowerSpec || flowers.length === 0) return null;
  const { flowerShape, flowerColor, flowerColorAccent } = flowerSpec;
  const { main, accent } = FLOWER_TEMPLATES[flowerShape];
  const florets = flowers.flatMap((f) => f.florets);
  return (
    <g className="flowers" opacity={flowers[0].progress}>
      <path d={silhouettesPathData(florets, main)} fill={flowerColor} />
      {accent && (
        <path
          d={silhouettesPathData(florets, accent)}
          fill={flowerColorAccent ?? flowerColor}
        />
      )}
    </g>
  );
}

import { PotBodySVG, PotRimSVG } from "./PotSVG";
import { POT_CONFIGS } from "./potConfigs";

// ─── Size scaling ─────────────────────────────────────────────────────────────

const SIZE_SCALE: Record<string, number> = {
  small: 1,
  medium: 1.35,
  large: 1.7,
};

// ─── Stand SVG ────────────────────────────────────────────────────────────────

interface StandConfig {
  color: string;
  topColor: string;
  height: number;
  rx: number;
}

const STAND_CONFIGS: Record<string, StandConfig> = {
  "bamboo-mat": { color: "#8a7840", topColor: "#b0986a", height: 4, rx: 20 },
  "wooden-stand": { color: "#7a5030", topColor: "#a07050", height: 11, rx: 19 },
  "carved-stone": { color: "#787870", topColor: "#9a9a90", height: 8, rx: 19 },
};

function StandSVG({
  cx,
  topY,
  standStyle,
  scale,
}: {
  cx: number;
  topY: number;
  standStyle: string;
  scale: number;
}) {
  const cfg = STAND_CONFIGS[standStyle] ?? STAND_CONFIGS["bamboo-mat"];
  const rx = Math.round(cfg.rx * scale);
  const height = Math.round(cfg.height * scale);

  if (standStyle === "wooden-stand") {
    const platformH = Math.round(3 * scale);
    const legW = Math.round(5 * scale);
    const legH = height - platformH;
    return (
      <g>
        <rect
          fill={cfg.color}
          height={legH}
          rx={1}
          width={legW}
          x={cx - rx}
          y={topY + platformH}
        />
        <rect
          fill={cfg.color}
          height={legH}
          rx={1}
          width={legW}
          x={cx + rx - legW}
          y={topY + platformH}
        />
        <rect
          fill={cfg.color}
          height={platformH}
          width={rx * 2}
          x={cx - rx}
          y={topY}
        />
        <ellipse cx={cx} cy={topY} fill={cfg.topColor} rx={rx} ry={2.5} />
      </g>
    );
  }

  if (standStyle === "bamboo-mat") {
    return (
      <g>
        <rect
          fill={cfg.color}
          height={height}
          rx={1}
          width={rx * 2}
          x={cx - rx}
          y={topY}
        />
        <line
          stroke={cfg.topColor}
          strokeWidth={0.6}
          x1={cx - rx + 2}
          x2={cx + rx - 2}
          y1={topY + 1}
          y2={topY + 1}
        />
        <line
          stroke={cfg.topColor}
          strokeWidth={0.6}
          x1={cx - rx + 2}
          x2={cx + rx - 2}
          y1={topY + 2.5}
          y2={topY + 2.5}
        />
        <ellipse cx={cx} cy={topY} fill={cfg.topColor} rx={rx} ry={2} />
      </g>
    );
  }

  // carved-stone: solid block with bevel
  const botY = topY + height;
  return (
    <g>
      <rect
        fill={cfg.color}
        height={height}
        width={rx * 2}
        x={cx - rx}
        y={topY}
      />
      <ellipse cx={cx} cy={topY} fill={cfg.topColor} rx={rx} ry={2.5} />
      <ellipse cx={cx} cy={botY} fill="rgba(0,0,0,0.2)" rx={rx} ry={1.5} />
    </g>
  );
}

// ─── Fertiliser Dots ──────────────────────────────────────────────────────────

function FertiliserDots({
  cx,
  soilCY,
  tree,
}: {
  cx: number;
  soilCY: number;
  tree: BonsaiTree;
}) {
  const gt = tree.activeFertilisers?.growthTonic;
  const mk = tree.activeFertilisers?.moistureKeeper;
  const gtActive = gt && tree.activeDaysCount < gt.expiresAtDay;
  const mkActive = mk && tree.activeDaysCount < mk.expiresAtDay;

  if (!(gtActive || mkActive)) return null;

  return (
    <g>
      {gtActive && (
        <>
          <circle
            cx={cx - 10}
            cy={soilCY - 4}
            fill="#f5a623"
            opacity={0.9}
            r={1.8}
          />
          <circle
            cx={cx + 7}
            cy={soilCY - 6}
            fill="#f5a623"
            opacity={0.9}
            r={1.8}
          />
          <circle
            cx={cx - 3}
            cy={soilCY + 0}
            fill="#f5a623"
            opacity={0.85}
            r={1.5}
          />
        </>
      )}
      {mkActive && (
        <>
          <circle
            cx={cx + 13}
            cy={soilCY - 2}
            fill="#4a9eda"
            opacity={0.9}
            r={1.8}
          />
          <circle
            cx={cx - 15}
            cy={soilCY - 1}
            fill="#4a9eda"
            opacity={0.9}
            r={1.8}
          />
          <circle
            cx={cx + 3}
            cy={soilCY - 5}
            fill="#4a9eda"
            opacity={0.85}
            r={1.5}
          />
        </>
      )}
    </g>
  );
}

// ─── Pot geometry helper ──────────────────────────────────────────────────────

function computePotGeometry(
  trunkBaseY: number,
  potStyle: string | null,
  potScale: number,
  standStyle: string | null,
) {
  if (!potStyle) {
    // No pot: soil at original ground position.
    return {
      soilRx: 22,
      soilRy: 7,
      soilCY: trunkBaseY + 4,
      rimY: trunkBaseY,
      standTopY: trunkBaseY + 11,
    };
  }
  const potCfgBase = POT_CONFIGS[potStyle];
  // Rim sits at the trunk base — the pot wraps the tree at soil level.
  const rimY = trunkBaseY;
  const scaledRimRy = Math.round(potCfgBase.rimRy * potScale);
  // Soil fills the pot opening. It is drawn AFTER the rim so it appears as
  // an inner disc — the rim collar shows around the edges (rimRx > soilRx).
  const soilCY = rimY + 0.5;
  const soilRy = Math.max(1, scaledRimRy - 1);
  // Leave ~4 px of rim visible on each side.
  const soilRx = Math.round(potCfgBase.bodyTopRx * potScale) - 2;
  const potHeight = Math.round(potCfgBase.height * potScale);
  const standTopY = standStyle ? rimY + potHeight : trunkBaseY + 11;
  return { soilRx, soilRy, soilCY, rimY, standTopY };
}

// ─── ViewBox helper ───────────────────────────────────────────────────────────

function computeViewBox(
  svgData: TreeSVGData,
  standTopY: number,
  standStyle: string | null,
  standScale: number,
  cropTop: boolean,
): string {
  const standCfg = standStyle
    ? (STAND_CONFIGS[standStyle] ?? STAND_CONFIGS["bamboo-mat"])
    : null;
  const standHeightPx = standCfg ? Math.round(standCfg.height * standScale) : 0;
  const svgViewHeight = Math.max(300, standTopY + standHeightPx + 5);

  // Branches normally stay within the default 0..200 width, but a rotated
  // view can redistribute canopy weight toward one side far enough to push
  // branch tips past it — widen (never narrow) to whatever the content
  // actually needs, so rotating never silently clips part of the tree.
  const contentMinX = svgData.branches.reduce(
    (min, b) => Math.min(min, b.x1, b.x2),
    100,
  );
  const contentMaxX = svgData.branches.reduce(
    (max, b) => Math.max(max, b.x1, b.x2),
    100,
  );
  const minX = Math.min(0, contentMinX - 30);
  const svgViewWidth = Math.max(200, contentMaxX + 30) - minX;

  if (!cropTop) return `${minX} 0 ${svgViewWidth} ${svgViewHeight}`;

  const contentTopY = svgData.branches.reduce(
    (min, b) => Math.min(min, b.y1, b.y2),
    svgData.trunkTopY,
  );
  const minY = Math.max(0, contentTopY - 30);
  return `${minX} ${minY} ${svgViewWidth} ${svgViewHeight - minY}`;
}

// ─── Static Tree SVG ──────────────────────────────────────────────────────────

export function StaticTreeSVG({
  tree,
  cropTop,
  style,
  overlay,
  growing,
  viewAngle,
}: {
  tree: BonsaiTree;
  /** Crop the SVG viewBox so there's equal vertical space above and below the tree. */
  cropTop?: boolean;
  style?: React.CSSProperties;
  /**
   * Optional render function called with the computed SVG data, allowing callers
   * to inject interactive elements inside the <svg> element (e.g. pruning hit targets).
   */
  overlay?: (svgData: TreeSVGData) => React.ReactNode;
  /** Play the growth surge: the tree pushes up out of a pot that stays put. */
  growing?: boolean;
  /** Yaw (radians) around the trunk's vertical axis. */
  viewAngle?: number;
}) {
  const config = SPECIES_CONFIG[tree.speciesId];
  const svgData = useMemo(
    () =>
      generateTree(
        tree.activeDaysCount,
        config,
        tree.prunedBranches,
        tree.id,
        viewAngle ?? 0,
      ),
    [tree.activeDaysCount, config, tree.prunedBranches, tree.id, viewAngle],
  );

  const showSeed = tree.activeDaysCount < 6;
  const isWateredToday = tree.lastWateredDay === tree.activeDaysCount;
  const soilFill = isWateredToday ? "#7a4f2a" : "#c4a878";

  const potParsed = tree.equippedPotId ? parsePotId(tree.equippedPotId) : null;
  const standParsed = tree.equippedStandId
    ? parseStandId(tree.equippedStandId)
    : null;
  const potStyle = potParsed?.style ?? null;
  const standStyle = standParsed?.style ?? null;
  const potScale = SIZE_SCALE[potParsed?.size ?? "small"] ?? 1;
  const standScale = SIZE_SCALE[standParsed?.size ?? "small"] ?? 1;

  const { soilRx, soilRy, soilCY, rimY, standTopY } = computePotGeometry(
    svgData.trunkBaseY,
    potStyle,
    potScale,
    standStyle,
  );

  const viewBox = computeViewBox(
    svgData,
    standTopY,
    standStyle,
    standScale,
    cropTop ?? false,
  );

  const { zMin, zRange } = branchZBounds(svgData.branches);
  // Far branches (small/negative z) first so near branches overpaint them.
  const sortedBranches = [...svgData.branches].sort(
    (a, b) => a.z - b.z || b.depth - a.depth,
  );

  // Foliage z-sort runs across every leaf in the tree, not just per-branch —
  // a forward-projected pad on a back branch can still overpaint a back pad
  // on a forward branch where the two discs cross in 2D.
  const globalLeaves = collectGlobalLeaves(sortedBranches, svgData.apexLeaves);
  const foliage = foliageAt(config, tree.activeDaysCount);

  return (
    <svg
      aria-label={`${config.label} bonsai tree, day ${tree.activeDaysCount}`}
      style={{ width: "100%", height: "auto", ...style }}
      viewBox={viewBox}
    >
      <title>{`${config.label} bonsai tree, day ${tree.activeDaysCount}`}</title>

      {standStyle && (
        <StandSVG
          cx={svgData.trunkX}
          scale={standScale}
          standStyle={standStyle}
          topY={standTopY}
        />
      )}

      {/* Pot body behind soil — soil will appear to sit inside the pot */}
      {potStyle && (
        <PotBodySVG
          cx={svgData.trunkX}
          potStyle={potStyle}
          rimY={rimY}
          scale={potScale}
        />
      )}

      {potStyle && (
        <PotRimSVG
          cx={svgData.trunkX}
          potStyle={potStyle}
          rimY={rimY}
          scale={potScale}
        />
      )}

      <SoilEllipse
        cx={svgData.trunkX}
        cy={soilCY}
        fill={soilFill}
        rx={soilRx}
        ry={soilRy}
      />

      <FertiliserDots cx={svgData.trunkX} soilCY={soilCY} tree={tree} />

      <line
        stroke="rgba(120, 90, 50, 0.3)"
        strokeWidth={1}
        x1={svgData.trunkX - 20}
        x2={svgData.trunkX + 20}
        y1={svgData.trunkBaseY}
        y2={svgData.trunkBaseY}
      />

      {/* Everything that grows sits in one group anchored on the soil, so a
         growth surge pushes the tree up out of a pot that stays where it is.
         The pruning overlay rides along, keeping its hit targets on the
         branches they belong to for the length of the animation. */}
      <TreeBody
        growing={growing}
        soilX={svgData.trunkX}
        soilY={svgData.trunkBaseY}
        watered={isWateredToday}
      >
        {/* Nebari root fingers painted before the main trunk so the trunk
           overlaps their inner end. */}
        {svgData.nebariPathData.map((d, idx) => (
          <path
            d={d}
            fill={config.trunkColor}
            // biome-ignore lint/suspicious/noArrayIndexKey: deterministic order per generation
            key={`nebari-${idx}`}
          />
        ))}

        {svgData.trunkPathData && (
          <path d={svgData.trunkPathData} fill={config.trunkColor} />
        )}

        {/* Branch wood — z-sorted back-to-front so near branches overpaint. */}
        {sortedBranches.map((branch) => {
          const branchColor = depthTintedTrunkColor(
            branch.z,
            zMin,
            zRange,
            config.trunkColor,
          );
          return (
            <path d={branch.pathData} fill={branchColor} key={branch.id} />
          );
        })}

        {/* Foliage layer — every leaf z-sorted globally so overlapping pads
           on different branches paint in true depth order. */}
        <FoliageLayer
          foliageColor={foliage.foliageColor}
          foliageColorLight={foliage.foliageColorLight}
          leaves={globalLeaves}
          shape={foliage.leafShape}
        />

        <FlowerLayer flowerSpec={config.flowers} flowers={svgData.flowers} />

        {showSeed && (
          <SeedSprout
            baseY={svgData.trunkBaseY}
            cx={svgData.trunkX}
            day={tree.activeDaysCount}
            foliageColor={foliage.foliageColor}
            leafShape={foliage.leafShape}
          />
        )}

        {overlay?.(svgData)}
      </TreeBody>
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const SoilEllipse = styled.ellipse`
  transition: fill 0.8s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/*
 * Squashed more vertically than horizontally, and anchored on the soil rather
 * than on the group's own box, so the tree rises rather than swelling in
 * place. No overshoot: a tree that has grown a day does not boing.
 */
const surge = keyframes`
  from { transform: scale(0.96, 0.84); }
  to   { transform: scale(1, 1); }
`;

const SurgeGroup = styled.g`
  /* view-box, not fill-box: the origin is a point in the tree's own
     coordinate system (the soil under the trunk), not a corner of whatever
     bounding box this group happens to have at its current size. */
  transform-box: view-box;
  transform-origin: var(--soil-x) var(--soil-y);

  &[data-growing] {
    animation: ${surge} 900ms var(--ease-out) both;
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-growing] {
      animation: none;
    }
  }
`;

/*
 * A watered tree stands a little taller. It is the same soil anchor as the
 * surge, on its own group so the two never fight over `transform`, and a
 * transition rather than an animation so it holds for as long as the tree is
 * watered instead of playing once and forgetting.
 *
 * Only the lift is expressed, never a droop: an unwatered tree is the
 * baseline. Falling short of a day is information here, not a rebuke.
 */
const RefreshGroup = styled.g`
  transform-box: view-box;
  transform-origin: var(--soil-x) var(--soil-y);
  transition: transform 700ms var(--ease-out);

  &[data-watered] {
    transform: scale(1.008, 1.022);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

function TreeBody({
  growing,
  watered,
  soilX,
  soilY,
  children,
}: {
  growing?: boolean;
  watered?: boolean;
  soilX: number;
  soilY: number;
  children: React.ReactNode;
}) {
  return (
    <SurgeGroup
      // Omitted rather than "false": React writes booleans into data-*
      // attributes verbatim, and [data-growing] would match either way.
      data-growing={growing || undefined}
      style={
        {
          "--soil-x": `${soilX}px`,
          "--soil-y": `${soilY}px`,
        } as React.CSSProperties
      }
    >
      <RefreshGroup data-watered={watered || undefined}>
        {children}
      </RefreshGroup>
    </SurgeGroup>
  );
}
