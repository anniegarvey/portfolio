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

// ─── Pot SVG ──────────────────────────────────────────────────────────────────

interface PotConfig {
  rimRx: number;
  rimRy: number;
  rimColor: string;
  bodyTopRx: number;
  bodyBotRx: number;
  bodyColor: string;
  shadowColor: string;
  botColor: string;
  height: number;
  glaze?: boolean;
}

const POT_CONFIGS: Record<string, PotConfig> = {
  "simple-clay": {
    rimRx: 23,
    rimRy: 3.5,
    rimColor: "#9a4828",
    bodyTopRx: 22,
    bodyBotRx: 16,
    bodyColor: "#c1704a",
    shadowColor: "rgba(0,0,0,0.15)",
    botColor: "#8a3818",
    height: 17,
  },
  "glazed-ceramic": {
    rimRx: 25,
    rimRy: 3,
    rimColor: "#4a7a6a",
    bodyTopRx: 22,
    bodyBotRx: 17,
    bodyColor: "#6a9a88",
    shadowColor: "rgba(0,0,0,0.12)",
    botColor: "#3a6858",
    height: 20,
    glaze: true,
  },
  "lacquered-wood": {
    rimRx: 21,
    rimRy: 2.5,
    rimColor: "#1a0806",
    bodyTopRx: 21,
    bodyBotRx: 19,
    bodyColor: "#3a1a0a",
    shadowColor: "rgba(0,0,0,0.28)",
    botColor: "#1a0806",
    height: 17,
  },
  "stone-basin": {
    rimRx: 26,
    rimRy: 3,
    rimColor: "#6a6a62",
    bodyTopRx: 25,
    bodyBotRx: 21,
    bodyColor: "#8a8a80",
    shadowColor: "rgba(0,0,0,0.12)",
    botColor: "#5a5a52",
    height: 9,
  },
};

function PotSVG({
  cx,
  rimY,
  potStyle,
}: {
  cx: number;
  rimY: number;
  potStyle: string;
}) {
  const cfg = POT_CONFIGS[potStyle] ?? POT_CONFIGS["simple-clay"];
  const botY = rimY + cfg.height;
  const midY = rimY + cfg.height / 2;

  return (
    <g>
      <path
        d={`M ${cx - cfg.bodyTopRx},${rimY} C ${cx - cfg.bodyTopRx},${midY} ${cx - cfg.bodyBotRx},${botY - 2} ${cx - cfg.bodyBotRx},${botY} L ${cx + cfg.bodyBotRx},${botY} C ${cx + cfg.bodyBotRx},${botY - 2} ${cx + cfg.bodyTopRx},${midY} ${cx + cfg.bodyTopRx},${rimY} Z`}
        fill={cfg.bodyColor}
      />
      {/* Left-side shadow */}
      <path
        d={`M ${cx - cfg.bodyTopRx},${rimY} C ${cx - cfg.bodyTopRx},${midY} ${cx - cfg.bodyBotRx},${botY - 2} ${cx - cfg.bodyBotRx},${botY} L ${cx - cfg.bodyBotRx + 7},${botY} C ${cx - cfg.bodyTopRx + 8},${midY} ${cx - cfg.bodyTopRx + 7},${rimY + 2} ${cx - cfg.bodyTopRx + 5},${rimY} Z`}
        fill={cfg.shadowColor}
      />
      {cfg.glaze && (
        <ellipse
          cx={cx - 7}
          cy={rimY + 7}
          fill="rgba(255,255,255,0.18)"
          rx={3}
          ry={8}
          transform={`rotate(-20 ${cx - 7} ${rimY + 7})`}
        />
      )}
      <ellipse
        cx={cx}
        cy={botY}
        fill={cfg.botColor}
        rx={cfg.bodyBotRx}
        ry={2.5}
      />
      <ellipse
        cx={cx}
        cy={rimY}
        fill={cfg.rimColor}
        rx={cfg.rimRx}
        ry={cfg.rimRy}
      />
    </g>
  );
}

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
}: {
  cx: number;
  topY: number;
  standStyle: string;
}) {
  const cfg = STAND_CONFIGS[standStyle] ?? STAND_CONFIGS["bamboo-mat"];

  if (standStyle === "wooden-stand") {
    const platformH = 3;
    const legW = 5;
    const legH = cfg.height - platformH;
    return (
      <g>
        <rect
          fill={cfg.color}
          height={legH}
          rx={1}
          width={legW}
          x={cx - cfg.rx}
          y={topY + platformH}
        />
        <rect
          fill={cfg.color}
          height={legH}
          rx={1}
          width={legW}
          x={cx + cfg.rx - legW}
          y={topY + platformH}
        />
        <rect
          fill={cfg.color}
          height={platformH}
          width={cfg.rx * 2}
          x={cx - cfg.rx}
          y={topY}
        />
        <ellipse cx={cx} cy={topY} fill={cfg.topColor} rx={cfg.rx} ry={2.5} />
      </g>
    );
  }

  if (standStyle === "bamboo-mat") {
    return (
      <g>
        <rect
          fill={cfg.color}
          height={cfg.height}
          rx={1}
          width={cfg.rx * 2}
          x={cx - cfg.rx}
          y={topY}
        />
        <line
          stroke={cfg.topColor}
          strokeWidth={0.6}
          x1={cx - cfg.rx + 2}
          x2={cx + cfg.rx - 2}
          y1={topY + 1}
          y2={topY + 1}
        />
        <line
          stroke={cfg.topColor}
          strokeWidth={0.6}
          x1={cx - cfg.rx + 2}
          x2={cx + cfg.rx - 2}
          y1={topY + 2.5}
          y2={topY + 2.5}
        />
        <ellipse cx={cx} cy={topY} fill={cfg.topColor} rx={cfg.rx} ry={2} />
      </g>
    );
  }

  // carved-stone: solid block with bevel
  const botY = topY + cfg.height;
  return (
    <g>
      <rect
        fill={cfg.color}
        height={cfg.height}
        width={cfg.rx * 2}
        x={cx - cfg.rx}
        y={topY}
      />
      <ellipse cx={cx} cy={topY} fill={cfg.topColor} rx={cfg.rx} ry={2.5} />
      <ellipse cx={cx} cy={botY} fill="rgba(0,0,0,0.2)" rx={cfg.rx} ry={1.5} />
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
            cx={cx - 11}
            cy={soilCY - 2}
            fill="#f5a623"
            opacity={0.9}
            r={1.8}
          />
          <circle
            cx={cx - 6}
            cy={soilCY - 5}
            fill="#f5a623"
            opacity={0.9}
            r={1.8}
          />
          <circle
            cx={cx - 15}
            cy={soilCY + 1}
            fill="#f5a623"
            opacity={0.85}
            r={1.5}
          />
        </>
      )}
      {mkActive && (
        <>
          <circle
            cx={cx + 11}
            cy={soilCY - 2}
            fill="#4a9eda"
            opacity={0.9}
            r={1.8}
          />
          <circle
            cx={cx + 6}
            cy={soilCY - 5}
            fill="#4a9eda"
            opacity={0.9}
            r={1.8}
          />
          <circle
            cx={cx + 15}
            cy={soilCY + 1}
            fill="#4a9eda"
            opacity={0.85}
            r={1.5}
          />
        </>
      )}
    </g>
  );
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

  const rimY = svgData.trunkBaseY - 5;
  const potStyle = tree.equippedPotId
    ? parsePotId(tree.equippedPotId).style
    : null;
  const standStyle = tree.equippedStandId
    ? parseStandId(tree.equippedStandId).style
    : null;
  const potHeight = potStyle ? (POT_CONFIGS[potStyle]?.height ?? 17) : 0;
  const standTopY = rimY + potHeight;

  const bottomMargin = 30;
  const viewBox = cropTop
    ? (() => {
        const contentTopY = svgData.branches.reduce(
          (min, b) => Math.min(min, b.y1, b.y2),
          svgData.trunkTopY,
        );
        const minY = Math.max(0, contentTopY - bottomMargin);
        return `0 ${minY} 200 ${300 - minY}`;
      })()
    : svgData.viewBox;

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
          standStyle={standStyle}
          topY={standTopY}
        />
      )}

      {potStyle && (
        <PotSVG cx={svgData.trunkX} potStyle={potStyle} rimY={rimY} />
      )}

      <SoilEllipse
        cx={svgData.trunkX}
        cy={svgData.trunkBaseY + 4}
        fill={soilFill}
        rx={22}
        ry={7}
      />

      <FertiliserDots
        cx={svgData.trunkX}
        soilCY={svgData.trunkBaseY + 4}
        tree={tree}
      />

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
