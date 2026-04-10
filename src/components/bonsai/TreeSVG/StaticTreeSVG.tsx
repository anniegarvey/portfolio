"use client";

import { styled } from "next-yak";
import { useMemo } from "react";
import type { BonsaiTree } from "@/lib/bonsai/schema";
import { parsePotId, parseStandId, SPECIES_CONFIG } from "@/lib/bonsai/schema";
import { generateTree, type TreeSVGData } from "@/lib/bonsai/treeGenerator";

// ─── Leaf Shape Paths ─────────────────────────────────────────────────────────

/** Simplified 5-lobed maple leaf. */
const PALMATE_LEAF_PATH =
  "M 0,-1 C -0.1,-0.7 -0.2,-0.5 -0.25,-0.3 L -0.85,-0.45 L -0.4,0.1 " +
  "L -0.55,0.85 L 0,0.4 L 0.55,0.85 L 0.4,0.1 L 0.85,-0.45 " +
  "L 0.25,-0.3 C 0.2,-0.5 0.1,-0.7 0,-1 Z";

/** Oak-style lobed leaf with 4 pairs of rounded side lobes. */
const LOBED_LEAF_PATH =
  "M 0,-1 C 0.3,-0.85 0.55,-0.65 0.5,-0.45 C 0.7,-0.35 0.7,-0.15 0.5,0 " +
  "C 0.7,0.1 0.65,0.3 0.45,0.45 C 0.6,0.6 0.5,0.8 0.25,0.9 L 0,1 L -0.25,0.9 " +
  "C -0.5,0.8 -0.6,0.6 -0.45,0.45 C -0.65,0.3 -0.7,0.1 -0.5,0 " +
  "C -0.7,-0.15 -0.7,-0.35 -0.5,-0.45 C -0.55,-0.65 -0.3,-0.85 0,-1 Z";

// ─── Seed / Sprout Stage ──────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

function SeedSprout({
  day,
  cx,
  baseY,
  foliageColor,
}: {
  day: number;
  cx: number;
  baseY: number;
  foliageColor: string;
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
  const leafRx = leavesGrow * 6;
  const leafRy = leavesGrow * 3.5;

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
        <g opacity={Math.min(leavesGrow * 1.5, 1)}>
          <ellipse
            cx={cx - leafRx * 1.1}
            cy={stemTop + leafRy * 0.5}
            fill={foliageColor}
            rx={leafRx}
            ry={leafRy}
            transform={`rotate(-30 ${cx - leafRx * 1.1} ${stemTop + leafRy * 0.5})`}
          />
          <ellipse
            cx={cx + leafRx * 1.1}
            cy={stemTop + leafRy * 0.5}
            fill={foliageColor}
            rx={leafRx}
            ry={leafRy}
            transform={`rotate(30 ${cx + leafRx * 1.1} ${stemTop + leafRy * 0.5})`}
          />
        </g>
      )}
    </g>
  );
}

// ─── Leaf Renderer ────────────────────────────────────────────────────────────

function renderLeaves(
  leaves: ReturnType<typeof generateTree>["apexLeaves"],
  leafShape: string,
  foliageColor: string,
) {
  return leaves.map((leaf) => {
    if (leafShape === "palmate") {
      return (
        <path
          d={PALMATE_LEAF_PATH}
          fill={foliageColor}
          key={leaf.id}
          transform={`translate(${leaf.cx} ${leaf.cy}) rotate(${leaf.angleDeg}) scale(${leaf.rx})`}
        />
      );
    }
    if (leafShape === "lobed") {
      return (
        <path
          d={LOBED_LEAF_PATH}
          fill={foliageColor}
          key={leaf.id}
          transform={`translate(${leaf.cx} ${leaf.cy}) rotate(${leaf.angleDeg}) scale(${leaf.rx})`}
        />
      );
    }
    return (
      <ellipse
        cx={leaf.cx}
        cy={leaf.cy}
        fill={foliageColor}
        key={leaf.id}
        rx={leaf.rx}
        ry={leaf.ry}
        transform={`rotate(${leaf.angleDeg} ${leaf.cx} ${leaf.cy})`}
      />
    );
  });
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

  if (!cropTop) return `0 0 200 ${svgViewHeight}`;

  const contentTopY = svgData.branches.reduce(
    (min, b) => Math.min(min, b.y1, b.y2),
    svgData.trunkTopY,
  );
  const minY = Math.max(0, contentTopY - 30);
  return `0 ${minY} 200 ${svgViewHeight - minY}`;
}

// ─── Static Tree SVG ──────────────────────────────────────────────────────────

export function StaticTreeSVG({
  tree,
  cropTop,
  style,
  overlay,
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
}) {
  const config = SPECIES_CONFIG[tree.speciesId];
  const svgData = useMemo(
    () =>
      generateTree(tree.activeDaysCount, config, tree.prunedBranches, tree.id),
    [tree.activeDaysCount, config, tree.prunedBranches, tree.id],
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

      {svgData.trunkPathData && (
        <path d={svgData.trunkPathData} fill={config.trunkColor} />
      )}

      {[...svgData.branches]
        .sort((a, b) => b.depth - a.depth)
        .map((branch) => (
          <g key={branch.id}>
            <path d={branch.pathData} fill={config.trunkColor} />
            {renderLeaves(branch.leaves, config.leafShape, config.foliageColor)}
          </g>
        ))}

      {renderLeaves(svgData.apexLeaves, config.leafShape, config.foliageColor)}

      {showSeed && (
        <SeedSprout
          baseY={svgData.trunkBaseY}
          cx={svgData.trunkX}
          day={tree.activeDaysCount}
          foliageColor={config.foliageColor}
        />
      )}

      {overlay?.(svgData)}
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
